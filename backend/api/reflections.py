from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi import UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
import asyncio
from core.firebase import db_ref
from collections import defaultdict
from helpers.post_google_docs_data import post_docs_to_db
from datetime import datetime

router = APIRouter(prefix="/reflections")

@router.get("/commits")
async def get_commit_summary(team_id: str = Query(...)):
    contrib_ref = await run_in_threadpool(db_ref, f"contributions/{team_id}")
    contributions = await run_in_threadpool(contrib_ref.get) or {}

    # Get mapped users from logins
    logins_ref = await run_in_threadpool(db_ref, f"teams/{team_id}/logins")
    logins_data = await run_in_threadpool(logins_ref.get) or {}
    # mapped_users = {}
    # for login_key, login_info in logins_data.items():
    #     if isinstance(login_info, dict) and 'user_id' in login_info:
    #         mapped_users[login_info['login']] = login_info['user_id']

    tasks = []
    for contrib_id in contributions.keys():
        task = run_in_threadpool(db_ref(f"log_data/github/commit/{contrib_id}").get)
        tasks.append(task)

    commit_results = await asyncio.gather(*tasks)

    summary = {}
    timeline_map = {}
    
    for contrib_data, commit_data in zip(contributions.values(), commit_results):
        if commit_data:
            # Use mapped user_id if available, otherwise fall back to author
            author = contrib_data.get("author", "unknown")
            # author = mapped_users.get(original_author, original_author)
            if author not in summary:
                summary[author] =  {"commits": 0, "lines": 0}
            summary[author]["commits"] += 1

            additions = commit_data.get("additions", 0)
            #deletions = commit_data.get("deletions", 0)
            summary[author]["lines"] += additions #+ deletions
            timestamp = commit_data.get("timestamp")
            size =  contrib_data.get("quantity")
            if timestamp:
                if author not in timeline_map:
                    timeline_map[author] = []
                timeline_map[author].append({
                    "ts": timestamp,
                    "size": size
                })

    timeline = [
        {"author": author, "contributions": timestamps}
        for author, timestamps in timeline_map.items()
    ]
    
    return JSONResponse(content={"summary": summary, "timeline": timeline}, headers={"Access-Control-Allow-Origin": "*"})

@router.get("/feedback")
async def get_feedback_matrix(team_id: str = Query(...)):
    try:
        # 1. Fetch all PRs for the team
        pr_ref = await run_in_threadpool(db_ref, f"log_data/github/pull_request")
        pr_data = await run_in_threadpool(pr_ref.get) or {}
        print(f"Total PRs fetched: {len(pr_data)}")  #
        team_data = await run_in_threadpool(db_ref(f"teams/{team_id}/logins").get) or {}

        team_students = {
            login: info.get("login")
            for login, info in team_data.items()
            if info.get("login")  # only include if user_id exists
        }
        # 2. Prepare async tasks for fetching comments under each PR
        tasks = []
        pr_list = list(pr_data.items())
        for pr_id, pr_info in pr_list:
            comments_ref = db_ref(f"log_data/github/pull_request/{pr_id}/comments")
            task = run_in_threadpool(comments_ref.get)
            tasks.append(task)

        # 3. Execute all comment fetches concurrently
        comments_results = await asyncio.gather(*tasks)

        # 4. Aggregate feedback counts: giver → receiver → count
        feedback_counts = {}
        feedback_messages_google_doc = {}

        for (pr_id, pr_info), comments in zip(pr_list, comments_results):
            author = pr_info.get("login", "unknown")
            if not comments:
                continue

            for commenter, comment_entries in comments.items():
                if commenter.lower() == "copilot":
                    continue
                

                if commenter not in feedback_counts:
                    feedback_counts[commenter] = {}

                if author not in feedback_counts[commenter]:
                    feedback_counts[commenter][author] = 0

                feedback_counts[commenter][author] += len(comment_entries)  # count all comments

        gdoc_comments_ref = await run_in_threadpool(
            db_ref,
            "log_data/google_docs/comment"
        )
        gdoc_comments = await run_in_threadpool(gdoc_comments_ref.get) or {}
        print(gdoc_comments)
        for comment_id, comment_info in gdoc_comments.items():
            giver_login = comment_info.get("login")
            receiver_name = comment_info.get("comment_target_author")
            file_info = comment_info.get("file", {})
            file_name = file_info.get("name", "Unknown Document")
            text = comment_info.get("text", "")
            if not giver_login or not receiver_name:
                continue


            if giver_login not in feedback_counts:
                feedback_counts[giver_login] = {}
            if receiver_name not in feedback_counts[giver_login]:
                feedback_counts[giver_login][receiver_name] = 0

            feedback_counts[giver_login][receiver_name] += 1

            feedback_messages_google_doc.setdefault(giver_login , {})
            feedback_messages_google_doc[giver_login].setdefault(receiver_name, [])

            feedback_messages_google_doc[giver_login][receiver_name].append({
                "doc": file_name,
                "comment": text
            })

        return JSONResponse(content={"feedback_counts": feedback_counts, "feedback_messages_google_doc": feedback_messages_google_doc})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/revisions")
async def get_revisions_history(team_id: str = Query(...)):
    try:
        # 1. Make the first blocking call
        contrib_ref = await run_in_threadpool(db_ref, f"contributions/{team_id}")
        contributions = await run_in_threadpool(contrib_ref.get) or {}

        # Get mapped users from logins
        logins_ref = await run_in_threadpool(db_ref, f"teams/{team_id}/logins")
        logins_data = await run_in_threadpool(logins_ref.get) or {}
        # mapped_users = {}
        # for login_key, login_info in logins_data.items():
        #     if isinstance(login_info, dict) and 'user_id' in login_info:
        #         mapped_users[login_info['login']] = login_info['user_id']

        # 2. Prepare a list of asynchronous tasks
        tasks = []
        for contrib_id in contributions.keys():
            task = run_in_threadpool(db_ref(f"log_data/google_docs/revision/{contrib_id}").get)
            tasks.append(task)

        # 3. Execute all tasks concurrently
        revision_results = await asyncio.gather(*tasks)

        # 4. Process the results
        summary = {}
        timeline_map = defaultdict(lambda: defaultdict(lambda: {"size": 0, "titles": []}))

        for contrib_data, revision_data in zip(contributions.values(), revision_results):
            if revision_data:
                # Use mapped user_id if available, otherwise fall back to author
                author = contrib_data.get("author", "unknown")
                # author = mapped_users.get(original_author, original_author)
                if author not in summary:
                    summary[author] = {"revisions": 0, "word_count": 0}
                summary[author]['revisions'] += 1
                word_count = revision_data.get('word_count', 0)
                summary[author]['word_count'] += word_count
                timestamp = revision_data.get("timestamp")
                message = revision_data.get("title", "")
                if timestamp:
                    date_str = datetime.fromisoformat(timestamp).date().isoformat()
                    if date_str <= "2025-02-25" and date_str >= "2025-01-06":
                        # Ensure the nested structure exists
                        timeline_map[author][date_str]['size'] += word_count
                        timeline_map[author][date_str]['titles'].append({
                            "author": author,
                            "date": date_str,
                            "tool": 'Google Docs',
                            "message": message
                        })

        timeline = [
        {
            "author": author,
            "contributions": [{"date": date, "size": data['size'], "titles": data['titles']} for date, data in sorted(dates.items())]
        }
            for author, dates in timeline_map.items()
        ]

        return JSONResponse(content={"summary": summary, "timeline": timeline})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
from typing import Dict
class Reflection(BaseModel):
    user_id: str
    phase: str
    team_id: str
    responses: Dict[str, str]
    timestamp: str

@router.post("/save_reflection")
async def post_reflection(reflection: Reflection):
    data = reflection.dict()
    ref = await run_in_threadpool(db_ref, f"reflections/{data['phase']}/{data['user_id']}")
    await run_in_threadpool(ref.set, data)
    print("✅ Received reflection:", data)
    return {"status": "success", "received": data}