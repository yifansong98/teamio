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

def _email_to_net_id(email: str) -> str:
    """Convert email to net_id (simple implementation)"""
    return email.split('@')[0] if '@' in email else email

def sanitize_key(key):
    return key.replace('.', '_').replace('$', '_').replace('#', '_').replace('[', '_').replace(']', '_')

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

def process_server_format(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Process server format: {meta: {...}, users: {...}, events: [...], finalText: "...", comments: {...}}
    """
    meta = doc.get("meta", {}) or {}
    file_id = meta.get("docId", "unknown_file")
    file_url = meta.get("url", "")
    
    users = doc.get("users", {}) or {}
    events = doc.get("events", []) or []
    
    def get_user_name(user_id):
        user_info = users.get(str(user_id), {}) or {}
        return user_info.get("name", f"User_{user_id}")
    
    out = []
    for idx, event in enumerate(events):
        if not isinstance(event, dict):
            continue
            
        event_type = event.get("type", "")
        if event_type not in ["insert", "delete"]:
            continue
            
        author_id = event.get("authorId", "")
        author_name = get_user_name(author_id)
        timestamp = event.get("timestamp", "")
        text = event.get("text", "")
        
        # Count words
        word_count = len(re.findall(r"\b\w+\b", text)) if text else 0
        
        # Generate title
        title = _fmt_title_from_ts(timestamp, "Contribution")
        
        # Generate stable ID
        cid = _uuid5(f"{file_id}:event:{idx}:{event_type}:{text[:64]}")
        
        out.append({
            "contribution_id": cid,
            "login": author_name,  # Use name as login
            "timestamp": timestamp,
            "tool": "google_docs",
            "metric": "revision",
            "team_id": None,
            "action": event_type,
            "title": title,
            "text": text,
            "word_count": word_count,
            "file_id": file_id,
            "file_name": "Document",  # Server doesn't provide name
            "file_url": file_url,
            "author_id": author_id
        })
    
    return out

def process_docs_revisions(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Process document revisions into contribution records.
    Returns list of revision contributions with:
      - title: 'Revision — YYYY-MM-DD HH:MM:SS'
      - text: full revision content
      - action: normalized action type ('insert'/'delete')
      - word_count: word count from stats or computed from text
    """
    # Handle server format: {meta: {...}, users: {...}, events: [...], finalText: "..."}
    if "events" in doc and "meta" in doc:
        return process_server_format(doc)
    
    # Handle server output format: {tiles: [...], file: {...}, totalsByUser: {...}}
    if "tiles" in doc and "file" in doc:
        return process_server_output_format(doc)
    
    # Handle Chrome extension format: {file: {...}, revision: {tiles: [...]}, comments: {...}}
    file = doc.get("file", {}) or {}
    file_id = file.get("id", "unknown_file")
    file_name = file.get("name", "Untitled")
    file_url = file.get("url", "")

    # Handle both old format (blocks) and new format (tiles)
    revision = doc.get("revision", {}) or {}
    tiles = revision.get("tiles", []) or []
    blocks = revision.get("blocks", []) or []
    
    # Use tiles if available, otherwise fall back to blocks
    items = tiles if tiles else blocks

    out: List[Dict[str, Any]] = []
    for idx, item in enumerate(items):
        # Handle both tile format and block format
        if tiles:  # New format with tiles
            author_email = _author_to_email(item.get("author"))
            ts = item.get("timestamp", "") or ""
            typ = "insert"  # tiles are always insertions
            final_text = (item.get("text") or "").strip()
            title = item.get("title", _fmt_title_from_ts(ts, "Contribution"))
        else:  # Old format with blocks
            author_email = _author_to_email(item.get("author"))
            ts = item.get("timestamp", "") or ""
            raw_type = (item.get("type") or "revision").strip()
            typ = raw_type.lower()
            if typ == "insert_tile":
                typ = "insert"
            elif typ == "deletion":
                typ = "delete"
            final_text = (item.get("finalText") or item.get("text") or "").strip()
            title = _fmt_title_from_ts(ts, "Contribution")

        # Get word count from stats if available, otherwise compute from text
        stats = item.get("stats") or {}
        wc = stats.get("totalWords")
        if not isinstance(wc, int):
            # Fallback: count words using regex pattern
            wc = len(re.findall(r"\b\w+\b", final_text))

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

def process_server_output_format(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Process server output format: {tiles: [...], file: {...}, totalsByUser: {...}}
    """
    file = doc.get("file", {}) or {}
    file_id = file.get("id", "unknown_file")
    file_name = file.get("name", "Document")
    file_url = file.get("url", "")
    
    tiles = doc.get("tiles", []) or []
    
    out = []
    for idx, tile in enumerate(tiles):
        if not isinstance(tile, dict):
            continue
            
        # Extract tile information
        author_name = tile.get("author", "Unknown")
        author_id = tile.get("authorId", "unknown")
        timestamp = tile.get("timestamp", "")
        text = tile.get("text", "")
        
        # Count words
        word_count = len(re.findall(r"\b\w+\b", text)) if text else 0
        
        # Skip contributions with no meaningful content
        if word_count == 0:
            continue
        
        # Generate title
        title = _fmt_title_from_ts(timestamp, "Contribution")
        
        # Generate stable ID
        cid = _uuid5(f"{file_id}:tile:{idx}:{text[:64]}")
        
        out.append({
            "contribution_id": cid,
            "login": author_name,  # Use name as login
            "timestamp": timestamp,
            "tool": "google_docs",
            "metric": "revision",
            "team_id": None,
            "action": "insert",  # Tiles are insertions
            "title": title,
            "text": text,
            "word_count": word_count,
            "file_id": file_id,
            "file_name": file_name,
            "file_url": file_url,
            "author_id": author_id
        })
    
    return out

def process_server_comments(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Process comments from server format: {meta: {...}, comments: {threads: [...]}}
    """
    meta = doc.get("meta", {}) or {}
    file_id = meta.get("docId", "unknown_file")
    file_url = meta.get("url", "")
    
    comments_data = doc.get("comments", {}) or {}
    threads = comments_data.get("threads", []) or []
    
    out = []
    for thread_idx, thread in enumerate(threads):
        if not isinstance(thread, dict):
            continue
            
        # Process main comment
        author_name = thread.get("authorName", "Unknown")
        timestamp = thread.get("createdTime", "")
        content = thread.get("content", "")
        
        # Get attribution data to determine target author
        attribution = thread.get("attribution", {})
        target_author = attribution.get("author") if attribution else None
        
        if content.strip():  # Only process non-empty comments
            word_count = len(re.findall(r"\b\w+\b", content))
            title = _fmt_title_from_ts(timestamp, "Comment")
            cid = _uuid5(f"{file_id}:comment:{thread_idx}:{content[:64]}")
            
            out.append({
                "contribution_id": cid,
                "login": author_name,
                "timestamp": timestamp,
                "tool": "google_docs",
                "metric": "comment",
                "team_id": None,
                "action": "comment",
                "title": title,
                "text": content,
                "word_count": word_count,
                "file_id": file_id,
                "file_name": "Document",
                "file_url": file_url,
                "comment_id": thread.get("id", ""),
                "comment_target_author": target_author  # Use attribution data
            })
        
        # Process replies
        replies = thread.get("replies", []) or []
        for reply_idx, reply in enumerate(replies):
            if not isinstance(reply, dict):
                continue
                
            reply_author = reply.get("authorName", "Unknown")
            reply_timestamp = reply.get("createdTime", "")
            reply_content = reply.get("content", "")
            
            if reply_content.strip():
                reply_word_count = len(re.findall(r"\b\w+\b", reply_content))
                reply_title = _fmt_title_from_ts(reply_timestamp, "Reply")
                reply_cid = _uuid5(f"{file_id}:reply:{thread_idx}:{reply_idx}:{reply_content[:64]}")
                
                out.append({
                    "contribution_id": reply_cid,
                    "login": reply_author,
                    "timestamp": reply_timestamp,
                    "tool": "google_docs",
                    "metric": "comment",
                    "team_id": None,
                    "action": "reply",
                    "title": reply_title,
                    "text": reply_content,
                    "word_count": reply_word_count,
                    "file_id": file_id,
                    "file_name": "Document",
                    "file_url": file_url,
                    "comment_id": reply.get("id", ""),
                    "comment_target_author": author_name  # Reply targets the main comment author
                })
    
    return out

def process_server_output_comments(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Process comments from server output format: {tiles: [...], file: {...}, comments: {...}}
    """
    file = doc.get("file", {}) or {}
    file_id = file.get("id", "unknown_file")
    file_name = file.get("name", "Document")
    file_url = file.get("url", "")
    
    comments_data = doc.get("comments", {}) or {}
    threads = comments_data.get("threads", []) or []
    
    out = []
    for thread_idx, thread in enumerate(threads):
        if not isinstance(thread, dict):
            continue
            
        # Process main comment
        author_name = thread.get("authorName", "Unknown")
        timestamp = thread.get("createdTime", "")
        content = thread.get("content", "")
        
        # Get attribution data to determine target author
        attribution = thread.get("attribution", {})
        target_author = attribution.get("author") if attribution else None
        
        if content.strip():  # Only process non-empty comments
            word_count = len(re.findall(r"\b\w+\b", content))
            title = _fmt_title_from_ts(timestamp, "Comment")
            cid = _uuid5(f"{file_id}:comment:{thread_idx}:{content[:64]}")
            
            out.append({
                "contribution_id": cid,
                "login": author_name,
                "timestamp": timestamp,
                "tool": "google_docs",
                "metric": "comment",
                "team_id": None,
                "action": "comment",
                "title": title,
                "text": content,
                "word_count": word_count,
                "file_id": file_id,
                "file_name": file_name,
                "file_url": file_url,
                "comment_id": thread.get("id", ""),
                "comment_target_author": target_author  # Use attribution data
            })
        
        # Process replies
        replies = thread.get("replies", []) or []
        for reply_idx, reply in enumerate(replies):
            if not isinstance(reply, dict):
                continue
                
            reply_author = reply.get("authorName", "Unknown")
            reply_timestamp = reply.get("createdTime", "")
            reply_content = reply.get("content", "")
            
            if reply_content.strip():
                reply_word_count = len(re.findall(r"\b\w+\b", reply_content))
                reply_title = _fmt_title_from_ts(reply_timestamp, "Reply")
                reply_cid = _uuid5(f"{file_id}:reply:{thread_idx}:{reply_idx}:{reply_content[:64]}")
                
                out.append({
                    "contribution_id": reply_cid,
                    "login": reply_author,
                    "timestamp": reply_timestamp,
                    "tool": "google_docs",
                    "metric": "comment",
                    "team_id": None,
                    "action": "reply",
                    "title": reply_title,
                    "text": reply_content,
                    "word_count": reply_word_count,
                    "file_id": file_id,
                    "file_name": file_name,
                    "file_url": file_url,
                    "comment_id": reply.get("id", ""),
                    "comment_target_author": author_name  # Reply targets the main comment author
                })
    
    return out

def process_docs_comments(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    # Handle server format: {meta: {...}, users: {...}, events: [...], comments: {...}}
    if "events" in doc and "meta" in doc:
        return process_server_comments(doc)
    
    # Handle server output format: {tiles: [...], file: {...}, comments: {...}}
    if "tiles" in doc and "file" in doc:
        return process_server_output_comments(doc)
    
    # Handle Chrome extension format: {file: {...}, revision: {tiles: [...]}, comments: {...}}
    file = doc.get("file", {})
    file_id = file.get("id", "unknown_file")
    file_name = file.get("name", "Untitled")
    file_url = file.get("url", "")
    threads = (doc.get("comments") or {}).get("threads", []) or []

    out = []
    for t in threads:
        # Get commenter email from various possible fields (handle both old and new formats)
        commenter_email = _author_to_email(
            t.get("authorEmail") or t.get("author") or t.get("authorName")
        )
        created = t.get("createdTime", "") or t.get("modifiedTime", "")
        thread_id = str(t.get("id", ""))

        # Extract comment content and quoted text
        content = (t.get("content") or "").strip()
        quoted = (t.get("quoted") or "").strip()  # Quoted text from document, if present
        title = _fmt_title_from_ts(created, "Comment")

        # Extract attribution info for the text being commented on (handle both old and new formats)
        att = t.get("attribution") or {}
        target_author = att.get("author") or att.get("authorName")

        # Generate stable ID from file, comment thread, and timestamp
        cid = _uuid5(f"{file_id}:cmt:{thread_id}:{created}")
        out.append({
            "contribution_id": cid,
            "login": commenter_email,
            "timestamp": created,
            "tool": "google_docs",
            "metric": "comment",
            "team_id": None,
            "action": "comment",      
            "text": content,    
            "title": title,
            "file": {"id": file_id, "name": file_name, "url": file_url},
            "comment_target_author": target_author,
            "quoted_text": quoted or None,
        })
    return out

def post_to_contributions_generic(contributions: List[Dict[str, Any]], team_id: str):
    for c in contributions:
        c["team_id"] = team_id
        ref = db.reference(f'contributions/{team_id}/{c["contribution_id"]}')
        payload = {
            "contribution_id": c["contribution_id"],
            "author": c.get("login") or c.get("author") or "",
            "timestamp": c.get("timestamp", ""),
            "tool": c.get("tool", "google_docs"),
            "metric": c.get("metric", ""),
            "team_id": team_id,
            "title": c.get("title", ""),
            "quantity": c.get("word_count"),  # Use word_count as quantity for Google Docs
        }
        ref.set(payload)

def post_to_log_data_docs(contributions: List[Dict[str, Any]]):
    """
    Store full contribution data in log_data tables:
      log_data/google_docs/revision/{contribution_id}
      log_data/google_docs/comment/{contribution_id}
    """
    for c in contributions:
        metric = c.get("metric")  # 'revision' or 'comment'
        ref = db.reference(f'log_data/google_docs/{metric}/{c["contribution_id"]}')
        ref.set(c)  # store full record (includes 'raw')
    print(f"Posted {len(contributions)} item(s) to log_data/google_docs/*.")

def post_to_students_and_team(contributions: List[Dict[str, Any]], team_id: str):
    # Collect all logins for team storage
    all_logins = set()
    
    for c in contributions:
        email = c["login"]
        all_logins.add(email)  # Add email as login

    # Store all logins in teams/{team_id}/logins for mapping
    logins_ref = db.reference(f"teams/{team_id}/logins")
    existing_logins = logins_ref.get() or {}
    logins_updates = {}
    for login in all_logins:
        if login not in existing_logins:
            sanitized_key = login.replace('.', '_').replace('$', '_').replace('#', '_').replace('[', '_').replace(']', '_')
            logins_updates[sanitized_key] = {
                'login': login,
                'net_id': login  # Placeholder until mapped
            }
    if logins_updates:
        logins_ref.update(logins_updates)
        print(f"Updated team {team_id} with {len(logins_updates)} new logins from Google Docs.")

def post_docs_to_db(doc_json: Dict[str, Any], team_id: str):
    print(f"Processing Google Docs data for team {team_id}")
    print(f"Document structure keys: {list(doc_json.keys())}")
    
    # Process document data into contributions
    revs = process_docs_revisions(doc_json)
    cmts = process_docs_comments(doc_json)
    
    print(f"Found {len(revs)} revisions and {len(cmts)} comments")

    # Store summary data in contributions table
    post_to_contributions_generic(revs, team_id)
    post_to_contributions_generic(cmts, team_id)

    # Store detailed data in log_data tables
    post_to_log_data_docs(revs)
    post_to_log_data_docs(cmts)

    # Update student and team records
    post_to_students_and_team(revs + cmts, team_id)

    print("Successfully posted Google Docs data to Firebase.")