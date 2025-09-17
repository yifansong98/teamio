import uuid
import os
from typing import Dict, Any, List
from firebase_admin import db

def _uuid5(key: str) -> str:
    # content-derived stable id (idempotent)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))

def _author_to_email(author: str) -> str:
    """
    Your docs JSON may give 'author' as an email or a name.
    If it's not an email, you can map it later; for now keep as-is.
    """
    if not author:
        return "unknown@example.com"
    return author

def _email_to_net_id(email: str) -> str:
    # Same convention as your GitHub path (email -> net_id)
    return (email.split("@")[0] if "@" in email else email).strip().lower()

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
        # Stable ID: file + rev + timestamp + index + type + first64 chars
        cid = _uuid5(f"{file_id}:rev:{ts}:{idx}:{typ}:{title[:64]}")
        out.append({
            "contribution_id": cid,
            "login": author_email,                   # keep same key as GitHub path expects
            "timestamp": ts,
            "tool": "google_docs",
            "metric": "revision",
            "team_id": None,                         # filled later
            "title": title[:140] or f"{typ} @ {ts}",
            "file": {"id": file_id, "name": file_name, "url": file_url},
            "type": typ,
            # Keep the full block for log_data
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
        # Prefer email if present; else fall back to a name
        author_email = _author_to_email(t.get("authorEmail") or t.get("author") or t.get("authorName"))
        created = t.get("createdTime", "")
        thread_id = str(t.get("id", ""))
        title = (t.get("content") or "").strip().splitlines()[0][:140] if t.get("content") else f"Comment {thread_id}"

        # Stable ID: file + comment-thread id + created
        cid = _uuid5(f"{file_id}:cmt:{thread_id}:{created}")

        out.append({
            "contribution_id": cid,
            "login": author_email,                   # align with GitHub pipeline
            "timestamp": created,
            "tool": "google_docs",
            "metric": "comment",
            "team_id": None,                         # filled later
            "title": title,
            "file": {"id": file_id, "name": file_name, "url": file_url},
            "raw": t,
        })
    return out

def post_to_contributions_generic(contributions: List[Dict[str, Any]], team_id: str):
    for c in contributions:
        c["team_id"] = team_id
        ref = db.reference(f'contributions/{team_id}/{c["contribution_id"]}')
        ref.set({
            "contribution_id": c["contribution_id"],
            "author": c["login"],                      # same as GH
            "timestamp": c.get("timestamp", ""),
            "tool": c.get("tool", "google_docs"),
            "metric": c.get("metric", ""),
            "team_id": team_id,
            "title": c.get("title", ""),
        })

def post_to_log_data_docs(contributions: List[Dict[str, Any]]):
    """
    Writes full raw payloads under:
      log_data/google_docs/revision/{id}
      log_data/google_docs/comment/{id}
    """
    for c in contributions:
        metric = c.get("metric")  # 'revision' or 'comment'
        ref = db.reference(f'log_data/google_docs/{metric}/{c["contribution_id"]}')
        ref.set(c)  # store full record (includes 'raw')
    print(f"Posted {len(contributions)} item(s) to log_data/google_docs/*.")

def post_to_students_and_team(contributions: List[Dict[str, Any]], team_id: str):
    # upsert students + team membership
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
def post_docs_to_db(doc_json: Dict[str, Any], team_id: str):
    # build contributions
    revs = process_docs_revisions(doc_json)
    cmts = process_docs_comments(doc_json)

    # write contributions (summary)
    post_to_contributions_generic(revs, team_id)
    post_to_contributions_generic(cmts, team_id)

    # write detailed log data (raw)
    post_to_log_data_docs(revs)
    post_to_log_data_docs(cmts)

    # update students + team
    post_to_students_and_team(revs + cmts, team_id)

    print("Successfully posted Google Docs data to Firebase.")


