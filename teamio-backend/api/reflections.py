from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi import UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
import asyncio
from core.firebase import db_ref
from collections import defaultdict
from helpers.post_google_docs_data import post_docs_to_db

router = APIRouter(prefix="/reflections")

@router.get("/commits")
async def get_commit_summary(team_id: str = Query(...)):
    contrib_ref = await run_in_threadpool(db_ref, f"contributions/{team_id}")
    contributions = await run_in_threadpool(contrib_ref.get) or {}

    # Get mapped users from logins
    logins_ref = await run_in_threadpool(db_ref, f"teams/{team_id}/logins")
    logins_data = await run_in_threadpool(logins_ref.get) or {}
    mapped_users = {}
    for login_key, login_info in logins_data.items():
        if isinstance(login_info, dict) and 'net_id' in login_info:
            mapped_users[login_info['login']] = login_info['net_id']
    print(f"Commits mapped_users: {mapped_users}")

    tasks = []
    for contrib_id in contributions.keys():
        task = run_in_threadpool(db_ref(f"log_data/github/commit/{contrib_id}").get)
        tasks.append(task)

    commit_results = await asyncio.gather(*tasks)

    summary = {}
    timeline_map = {}
    
    for contrib_data, commit_data in zip(contributions.values(), commit_results):
        if commit_data:
            # Use mapped net_id if available, otherwise fall back to author
            original_author = contrib_data.get("author", "unknown")
            author = mapped_users.get(original_author, original_author)
            print(f"GitHub timeline: {original_author} -> {author}")
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
    
    return JSONResponse(content={"summary": summary, "timeline": timeline})

@router.get("/feedback")
async def get_feedback_matrix(team_id: str = Query(...)):
    try:
        # 1. Fetch all PRs for the team
        pr_ref = await run_in_threadpool(db_ref, f"log_data/github/pull_request")
        pr_data = await run_in_threadpool(pr_ref.get) or {}
        print(f"Total PRs fetched: {len(pr_data)}")  #
        team_data = await run_in_threadpool(db_ref(f"teams/{team_id}/logins").get) or {}

        team_students = {
            login: info.get("net_id")
            for login, info in team_data.items()
            if info.get("net_id")  # only include if net_id exists
        }
        print(f"Team students (github_login -> netid): {team_students}")
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

        for (pr_id, pr_info), comments in zip(pr_list, comments_results):
            author = pr_info.get("login", "unknown")
            if not comments:
                continue
            author_netid = team_students.get(author)
            if not author_netid:
                continue
            for commenter, comment_entries in comments.items():
                if commenter.lower() == "copilot":
                    continue
                commenter_netid = team_students.get(commenter)
                if not commenter_netid:
                    continue

                if commenter_netid not in feedback_counts:
                    feedback_counts[commenter_netid] = {}

                if author_netid not in feedback_counts[commenter_netid]:
                    feedback_counts[commenter_netid][author_netid] = 0

                feedback_counts[commenter_netid][author_netid] += len(comment_entries)  # count all comments

        gdoc_comments_ref = await run_in_threadpool(
            db_ref,
            "log_data/google_docs/comment"
        )
        gdoc_comments = await run_in_threadpool(gdoc_comments_ref.get) or {}
        print(gdoc_comments)
        for comment_id, comment_info in gdoc_comments.items():
            giver_login = comment_info.get("login")
            receiver_name = comment_info.get("comment_target_author")

            if not giver_login or not receiver_name:
                continue

            giver_netid = team_students.get(giver_login)
            receiver_netid = team_students.get(receiver_name)

            if not giver_netid or not receiver_netid:
                continue

            if giver_netid not in feedback_counts:
                feedback_counts[giver_netid] = {}
            if receiver_netid not in feedback_counts[giver_netid]:
                feedback_counts[giver_netid][receiver_netid] = 0

            feedback_counts[giver_netid][receiver_netid] += 1

        return JSONResponse(content={"feedback_counts": feedback_counts})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/revisions")
async def get_revisions_history(team_id: str = Query(...)):
    # 1. Make the first blocking call
    contrib_ref = await run_in_threadpool(db_ref, f"contributions/{team_id}")
    contributions = await run_in_threadpool(contrib_ref.get) or {}

    # Get mapped users from logins
    logins_ref = await run_in_threadpool(db_ref, f"teams/{team_id}/logins")
    logins_data = await run_in_threadpool(logins_ref.get) or {}
    mapped_users = {}
    for login_key, login_info in logins_data.items():
        if isinstance(login_info, dict) and 'user_id' in login_info:
            mapped_users[login_info['login']] = login_info['user_id']
    print(f"Revisions mapped_users: {mapped_users}")

    # 2. Prepare a list of asynchronous tasks
    tasks = []
    for contrib_id in contributions.keys():
        task = run_in_threadpool(db_ref(f"log_data/google_docs/revision/{contrib_id}").get)
        tasks.append(task)

    # 3. Execute all tasks concurrently
    revision_results = await asyncio.gather(*tasks)

    # 4. Process the results
    summary = {}
    timeline_map = {}

    for contrib_data, revision_data in zip(contributions.values(), revision_results):
        if revision_data:
            # Use mapped net_id if available, otherwise fall back to author
            original_author = contrib_data.get("author", "unknown")
            author = mapped_users.get(original_author, original_author)
            print(f"Google Docs timeline: {original_author} -> {author}")
            summary[author] = summary.get(author, 0) + 1

            timestamp = revision_data.get("timestamp")
            if timestamp:
                if author not in timeline_map:
                    timeline_map[author] = []
                timeline_map[author].append({"ts": timestamp, "size" : 0})
    
    timeline = [
        {"author": author, "contributions": timestamps}
        for author, timestamps in timeline_map.items()
    ]
    
    return JSONResponse(content={"summary": summary, "timeline": timeline})