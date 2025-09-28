import uuid
import os
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
        author_email = _author_to_email(t.get("authorEmail") or t.get("author") or t.get("authorName"))
        created = t.get("createdTime", "")
        thread_id = str(t.get("id", ""))
        title = (t.get("content") or "").strip().splitlines()[0][:140] if t.get("content") else f"Comment {thread_id}"
        cid = _uuid5(f"{file_id}:cmt:{thread_id}:{created}")
        out.append({
            "contribution_id": cid,
            "login": sanitize_key(author_email),
            "timestamp": created,
            "tool": "google_docs",
            "metric": "comment",
            "title": title,
            "file": {"id": file_id, "name": file_name, "url": file_url},
            "raw": t,
        })
    return out

# --- NEW BATCH-ORIENTED POSTING FUNCTIONS ---

def batch_post_to_contributions(contributions: List[Dict[str, Any]], team_id: str):
    """Prepares and posts all contributions in a single batch update."""
    if not contributions:
        return
    
    payload = {}
    for c in contributions:
        # The contribution_id becomes the key in the update payload
        payload[c["contribution_id"]] = {
            "contribution_id": c["contribution_id"],
            "author": c["login"],
            "timestamp": c.get("timestamp", ""),
            "tool": c.get("tool", "google_docs"),
            "metric": c.get("metric", ""),
            "team_id": team_id,
            "title": c.get("title", ""),
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
    """Processes docs data and posts it to Firebase efficiently in parallel batches."""
    # 1. Process data in memory (this is fast)
    revs = process_docs_revisions(doc_json)
    cmts = process_docs_comments(doc_json)
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