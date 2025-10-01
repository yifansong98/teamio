import uuid
import os
import re
from datetime import datetime, timezone
from typing import Dict, Any, List
from firebase_admin import db
from concurrent.futures import ThreadPoolExecutor, as_completed

def _uuid5(key: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))

def _author_to_email(author: str) -> str:
    if not author:
        return "unknown@example.com"
    return author

def sanitize_key(key):
    return key.replace('.', '_').replace('$', '_').replace('#', '_').replace('[', '_').replace(']', '_')

def process_docs_revisions(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    file = doc.get("file", {})
    file_id = file.get("id", "unknown_file")
    file_name = file.get("name", "Untitled")
    file_url = file.get("url", "")
    blocks = (doc.get("revision") or {}).get("blocks", []) or []

    out = []
    for idx, b in enumerate(blocks):
        author_email = _author_to_email(b.get("author"))
        ts = b.get("timestamp", "")
        typ = b.get("type", "unknown")
        title = (b.get("finalText") or b.get("text") or "").strip()
        cid = _uuid5(f"{file_id}:rev:{ts}:{idx}:{typ}:{title[:64]}")
        out.append({
            "contribution_id": cid,
            "login": sanitize_key(author_email),
            "timestamp": ts,
            "tool": "google_docs",
            "metric": "revision",
            "title": title[:140] or f"{typ} @ {ts}",
            "file": {"id": file_id, "name": file_name, "url": file_url},
            "type": typ,
            "raw": b,
        })
    return out

def process_docs_comments(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    file = doc.get("file", {})
    file_id = file.get("id", "unknown_file")
    file_name = file.get("name", "Untitled")
    file_url = file.get("url", "")
    threads = (doc.get("comments") or {}).get("threads", []) or []

    out = []
    for t in threads:
        # Get commenter email from various possible fields
        commenter_email = _author_to_email(
            t.get("authorEmail") or t.get("author") or t.get("authorName")
        )
        created = t.get("createdTime", "") or t.get("modifiedTime", "")
        thread_id = str(t.get("id", ""))

        # Extract comment content and quoted text
        content = (t.get("content") or "").strip()
        quoted = (t.get("quoted") or "").strip()  # Quoted text from document, if present
        title = _fmt_title_from_ts(created, "Comment")

        # Extract attribution info for the text being commented on
        att = t.get("attribution") or {}
        target_author = att.get("author") or att.get("authorName")
        target_author_id = att.get("authorId")
        target_confidence = att.get("confidence")
        target_method = att.get("method")
        target_tile_ts = att.get("tileTimestamp")
        target_tile_title = att.get("tileTitle")
        target_tile_index = att.get("tileIndexHint")

        # Generate stable ID from file, comment thread, and timestamp
        title = (t.get("content") or "").strip().splitlines()[0][:140] if t.get("content") else f"Comment {thread_id}"
        cid = _uuid5(f"{file_id}:cmt:{thread_id}:{created}")
        out.append({
            "contribution_id": cid,
            "login": commenter_email,                 # Commenter's email
            "login": sanitize_key(author_email),
            "timestamp": created,
            "tool": "google_docs",
            "metric": "comment",
            "team_id": None,
            
             "action": "comment",      
             "text": content,    

            "title": title,            # Formatted as "Comment — YYYY-MM-DD HH:MM:SS"

            "title": title,
            "file": {"id": file_id, "name": file_name, "url": file_url},

            # Info about whose text is being commented on
            "comment_target_author": target_author,
        

            # Optional: quoted text from the document
            "quoted_text": quoted or None,
        })
    return out


def post_to_contributions_generic(contributions: List[Dict[str, Any]], team_id: str):
# --- NEW BATCH-ORIENTED POSTING FUNCTIONS ---

def batch_post_to_contributions(contributions: List[Dict[str, Any]], team_id: str):
    """Prepares and posts all contributions in a single batch update."""
    if not contributions:
        return
    
    payload = {}
    for c in contributions:
        c["team_id"] = team_id
        ref = db.reference(f'contributions/{team_id}/{c["contribution_id"]}')
        payload = {
        # The contribution_id becomes the key in the update payload
        payload[c["contribution_id"]] = {
            "contribution_id": c["contribution_id"],
            "author": c.get("login") or c.get("author") or "",
            "author": c["login"],
            "timestamp": c.get("timestamp", ""),
            "tool": c.get("tool", "google_docs"),
            "metric": c.get("metric", ""),
            "team_id": team_id,
            "title": c.get("title", ""),
        }
        # Store basic contribution metadata

        ref.set(payload)


def _fmt_title_from_ts(ts: str, type_str: str) -> str:
    """
    Format ISO timestamp to '[Type] — YYYY-MM-DD HH:MM:SS' format.
    Falls back to raw timestamp if parsing fails.
    """
    try:
        # Normalize 'Z' -> UTC
        iso = ts.replace("Z", "+00:00")
        dt = datetime.fromisoformat(iso)
        # Render in UTC naive for consistency with your examples
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return f"{type_str} — {dt.strftime('%Y-%m-%d %H:%M:%S')}"
    except Exception:
        return f"{type_str} — {ts or 'Unknown'}"


def process_docs_revisions(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Process document revisions into contribution records.
    Returns list of revision contributions with:
      - title: 'Revision — YYYY-MM-DD HH:MM:SS'
      - text: full revision content
      - action: normalized action type ('insert'/'delete')
      - word_count: word count from stats or computed from text
    """
    file = doc.get("file", {}) or {}
    file_id = file.get("id", "unknown_file")
    file_name = file.get("name", "Untitled")
    file_url = file.get("url", "")

    blocks: List[Dict[str, Any]] = (doc.get("revision") or {}).get("blocks", []) or []

    out: List[Dict[str, Any]] = []
    for idx, b in enumerate(blocks):
        author_email = _author_to_email(b.get("author"))
        ts = b.get("timestamp", "") or ""
        raw_type = (b.get("type") or "revision").strip()
        typ = raw_type.lower()
        if typ == "insert_tile":
            typ = "insert"
        elif typ == "deletion":
            typ = "delete"

        final_text = (b.get("finalText") or b.get("text") or "").strip()

        # Get word count from stats if available, otherwise compute from text
        stats = b.get("stats") or {}
        wc = stats.get("totalWords")
        if not isinstance(wc, int):
            # Fallback: count words using regex pattern
            wc = len(re.findall(r"\b\w+\b", final_text))

        title = _fmt_title_from_ts(ts, "Revision")
        # Generate stable ID from file, revision details, and text sample
        cid = _uuid5(f"{file_id}:rev:{ts}:{idx}:{typ}:{final_text[:64]}")

        out.append({
            "contribution_id": cid,
            "login": author_email,
            "timestamp": ts,
            "tool": "google_docs",
            "metric": "revision",
            "action": typ,
            "title": title,
            "text": final_text,
            "word_count": wc,  
            "team_id": None,
            "file": {"id": file_id, "name": file_name, "url": file_url},
        })
    return out

def post_to_log_data_docs(contributions: List[Dict[str, Any]]):
    """
    Store full contribution data in log_data tables:
      log_data/google_docs/revision/{contribution_id}
      log_data/google_docs/comment/{contribution_id}
    """
        }
    
    if payload:
        ref = db.reference(f'contributions/{team_id}')
        ref.update(payload)
    print(f"Batch-posted {len(payload)} contribution(s).")

def batch_post_to_log_data(contributions: List[Dict[str, Any]]):
    """Prepares and posts all raw log data in two batch updates."""
    if not contributions:
        return

    revisions_payload = {}
    comments_payload = {}

    for c in contributions:
        metric = c.get("metric")  # 'revision' or 'comment'
        ref = db.reference(f'log_data/google_docs/{metric}/{c["contribution_id"]}')
        ref.set(c)  # store full record (includes 'raw')
    print(f"Posted {len(contributions)} item(s) to log_data/google_docs/*.")

def post_to_students_and_team(contributions: List[Dict[str, Any]], team_id: str):
    # Update student records and team membership
    members = set()
    for c in contributions:
        email = c["login"]
        net_id = _email_to_net_id(email)
        members.add(net_id)

        sref = db.reference(f"students/{net_id}")
        student = sref.get() or {
            "net_id": net_id,
            "email": email,
            "first_name": "John",
            "last_name": "Doe",
            "team_id": team_id,
            "contributions": [],
        }
        if c["contribution_id"] not in student.get("contributions", []):
            student["contributions"].append(c["contribution_id"])
        student["team_id"] = team_id  # ensure latest
        sref.set(student)

    tref = db.reference(f"teams/{team_id}")
    team_data = tref.get() or {"team_id": team_id, "members": []}
    team_data["team_id"] = team_id
    tref.set(team_data)

    mref = db.reference(f"teams/{team_id}/members")
    existing = mref.get() or []
    updated = list(set(existing) | members)
    mref.set(updated)
        if c.get("metric") == "revision":
            revisions_payload[c["contribution_id"]] = c
        elif c.get("metric") == "comment":
            comments_payload[c["contribution_id"]] = c

    # Run these two updates in a small parallel executor
    with ThreadPoolExecutor(max_workers=2) as executor:
        if revisions_payload:
            ref = db.reference('log_data/google_docs/revision')
            executor.submit(ref.update, revisions_payload)
        if comments_payload:
            ref = db.reference('log_data/google_docs/comment')
            executor.submit(ref.update, comments_payload)
            
    print(f"Batch-posted {len(revisions_payload)} revision(s) and {len(comments_payload)} comment(s) to log_data.")


def post_to_teams(contributions: List[Dict[str, Any]], team_id: str):
    team_logins = set(c['login'] for c in contributions)
    if not team_logins:
        return

    ref = db.reference(f'teams/{team_id}/logins')
    existing_logins_data = ref.get() or {}
    existing_logins_set = set(existing_logins_data.keys())

    new_logins_to_add = team_logins - existing_logins_set
    
    updates = {
        login: {'login': login, 'net_id': login}
        for login in new_logins_to_add
    }
    
    if updates:
        ref.update(updates)
    print(f"Updated team {team_id} with {len(updates)} new member(s).")


# --- REFACTORED MAIN ORCHESTRATOR FUNCTION ---

def post_docs_to_db(doc_json: Dict[str, Any], team_id: str):
    # Process document data into contributions
    """Processes docs data and posts it to Firebase efficiently in parallel batches."""
    # 1. Process data in memory (this is fast)
    revs = process_docs_revisions(doc_json)
    cmts = process_docs_comments(doc_json)

    # Store summary data in contributions table
    post_to_contributions_generic(revs, team_id)
    post_to_contributions_generic(cmts, team_id)

    # Store detailed data in log_data tables
    post_to_log_data_docs(revs)
    post_to_log_data_docs(cmts)

    # Update student and team records
    post_to_students_and_team(revs + cmts, team_id)
    all_contributions = revs + cmts
    
    if not all_contributions:
        print("No revisions or comments found to post.")
        return

    # 2. Run all database write operations in parallel
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(batch_post_to_contributions, all_contributions, team_id),
            executor.submit(batch_post_to_log_data, all_contributions),
            executor.submit(post_to_teams, all_contributions, team_id)
        ]
        
        # Wait for all parallel tasks to complete and check for errors
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"A database posting operation failed: {e}")
                raise

    print("Successfully posted Google Docs data to Firebase.")