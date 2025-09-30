from fastapi import FastAPI, Request, Response, Query
import firebase_admin
from firebase_admin import credentials, db
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import uuid
import os
from typing import Dict, Any, List
from firebase_admin import db
import traceback
import json
from collections import defaultdict
import asyncio
from fastapi.concurrency import run_in_threadpool

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cred = credentials.Certificate("TEAMIO_FIREBASE_SERVICE_CREDENTIALS.json")  # your Firebase service account JSON
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
})

# Summary: Fetch GitHub data for a given owner and repo, then post it to Firebase under a specific team.
# Request body example: {"owner": "octocat", "repo_name": "Hello-World", "team_id": "your_team_id"}
# Returns: Success message or error.
@app.post("/api/github/post")
async def fetch_github_data(team_id: str = Query(...), owner: str = Query(...), repo_name: str = Query(...), main_branch_only: bool = Query(False), merged_prs_only: bool = Query(False)):
    try:
        from scripts.fetch_github_data import fetch_data
        from env import GITHUB_TOKEN

        commit_data, pr_data = await run_in_threadpool(fetch_data, owner, repo_name, main_branch_only, merged_prs_only, GITHUB_TOKEN)

        from scripts.post_github_data import post_to_db
        print("Commit data:", commit_data)
        print("PR data:", pr_data)
        await run_in_threadpool(post_to_db, commit_data, pr_data, team_id)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

from fastapi.responses import JSONResponse

@app.get("/api/contributions/all")
async def get_contributions(team_id: str = Query(...)):
    try:
        ref = db.reference(f'contributions/{team_id}')
        raw_data = ref.get()
        contributions = list(raw_data.values()) if raw_data else []
        contributions.sort(key=lambda x: x['timestamp'], reverse=True)
        return JSONResponse(content=contributions)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/reflections/commits")
async def get_commit_summary(team_id: str = Query(...)):
    contrib_ref = await run_in_threadpool(db.reference, f"contributions/{team_id}")
    contributions = await run_in_threadpool(contrib_ref.get) or {}

    tasks = []
    for contrib_id in contributions.keys():
        task = run_in_threadpool(db.reference(f"log_data/github/commit/{contrib_id}").get)
        tasks.append(task)

    commit_results = await asyncio.gather(*tasks)

    summary = {}
    timeline_map = {}
    
    for contrib_data, commit_data in zip(contributions.values(), commit_results):
        if commit_data:
            author = contrib_data.get("net_id", "unknown")
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

@app.get("/api/reflections/feedback")
async def get_feedback_matrix(team_id: str = Query(...)):
    try:
        # 1. Fetch all PRs for the team
        pr_ref = await run_in_threadpool(db.reference, f"log_data/github/pull_request")
        pr_data = await run_in_threadpool(pr_ref.get) or {}
        print(f"Total PRs fetched: {len(pr_data)}")  #
        team_data = await run_in_threadpool(db.reference(f"teams/{team_id}/logins").get) or {}

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
            comments_ref = db.reference(f"log_data/github/pull_request/{pr_id}/comments")
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
            db.reference,
            "log_data/google_docs/comment"
        )
        gdoc_comments = await run_in_threadpool(gdoc_comments_ref.get) or {}
        print(gdoc_comments)
        for comment_id, comment_info in gdoc_comments.items():
            giver_login = comment_info.get("login")
            raw_attr = comment_info.get("raw", {}).get("attribution", {})
            receiver_name = raw_attr.get("author")

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


@app.get("/api/reflections/revisions")
async def get_revisions_history(team_id: str = Query(...)):
    # 1. Make the first blocking call
    contrib_ref = await run_in_threadpool(db.reference, f"contributions/{team_id}")
    contributions = await run_in_threadpool(contrib_ref.get) or {}

    # 2. Prepare a list of asynchronous tasks
    tasks = []
    for contrib_id in contributions.keys():
        task = run_in_threadpool(db.reference(f"log_data/google_docs/revision/{contrib_id}").get)
        tasks.append(task)

    # 3. Execute all tasks concurrently
    revision_results = await asyncio.gather(*tasks)

    # 4. Process the results
    summary = {}
    timeline_map = {}

    for contrib_data, revision_data in zip(contributions.values(), revision_results):
        if revision_data:
            author = contrib_data.get("net_id", "unknown")
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

from scripts.post_docs_data import post_docs_to_db
class DocsIngestBody(BaseModel):
    team_id: str
    doc: dict

@app.post("/api/google_docs/post")
async def post_google_docs_json(body: DocsIngestBody):
    try:
        print("Posting Google Docs data for team:", body.team_id)
        await run_in_threadpool(post_docs_to_db, body.doc, body.team_id)
        return {"message": "Google Docs data posted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/google_docs/upload")
async def upload_google_docs_file(team_id: str = Form(...), file: UploadFile = File(...)):
    try:
        raw = await file.read()
        doc_json = json.loads(raw.decode("utf-8"))
        post_docs_to_db(doc_json, team_id)
        return {"message": "Google Docs data posted (file upload)"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid upload: {e}")

@app.get("/api/teams/logins")
async def get_team_logins(team_id: str = Query(...)):
    try:
        ref = db.reference(f'teams/{team_id}/logins')
        logins_data = ref.get() or {}
        logins = list(logins_data.keys())
        return JSONResponse(content=logins)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/teams/map-logins")
async def map_logins_to_net_ids(team_id: str = Query(...), Request: Request = None):
    try:
        data = await Request.json()
        mappings = data.get("mappings", {})
        if not mappings:
            return {"message": "No mappings provided."}

        # --- Stage 1: Prepare all data updates in memory ---

        # Prepare payloads for batch updates
        team_logins_update = {}
        contributions_update = {}
        net_ids_to_logins = defaultdict(list)
        net_ids_to_contributions = defaultdict(list)

        for login, net_id in mappings.items():
            # Prepare the update for the team's login list
            team_logins_update[login] = {"net_id": net_id, "login": login}
            net_ids_to_logins[net_id].append(login)

        # Fetch all contributions once
        contrib_ref = db.reference(f'contributions/{team_id}')
        contributions = await run_in_threadpool(contrib_ref.get) or {}
        
        for contrib_id, contrib_data in contributions.items():
            author = contrib_data.get("author")
            if author in mappings:
                net_id = mappings[author]
                contrib_data["net_id"] = net_id
                # Prepare the update for this specific contribution
                contributions_update[contrib_id] = contrib_data
                net_ids_to_contributions[net_id].append(contrib_id)
        
        # --- Stage 2: Batch-update team logins and contributions ---
        update_tasks = []
        if team_logins_update:
            team_ref = db.reference(f'teams/{team_id}/logins')
            update_tasks.append(run_in_threadpool(team_ref.update, team_logins_update))
        
        if contributions_update:
            update_tasks.append(run_in_threadpool(contrib_ref.update, contributions_update))
        
        # Run these two major updates concurrently
        if update_tasks:
            await asyncio.gather(*update_tasks)

        # --- Stage 3: Fetch all required student data in parallel ---
        students_ref = db.reference('students')
        all_net_ids_to_update = set(net_ids_to_logins.keys()) | set(net_ids_to_contributions.keys())
        
        if not all_net_ids_to_update:
            return {"message": "Mappings processed, no student data to update."}

        # Create a parallel fetch task for each unique student
        fetch_tasks = [run_in_threadpool(students_ref.child(net_id).get) for net_id in all_net_ids_to_update]
        existing_student_data_list = await asyncio.gather(*fetch_tasks)

        # --- Stage 4: Consolidate updates and perform a single batch write for students ---
        students_update_payload = {}
        for net_id, existing_data in zip(all_net_ids_to_update, existing_student_data_list):
            student_data = existing_data or {
                "net_id": net_id,
                "team_id": team_id,
                "contributions": [],
                "logins": [],
            }
            
            # Consolidate logins
            new_logins = net_ids_to_logins.get(net_id, [])
            existing_logins = student_data.get("logins", [])
            student_data["logins"] = list(set(existing_logins + new_logins))

            # Consolidate contributions
            new_contributions = net_ids_to_contributions.get(net_id, [])
            existing_contributions = student_data.get("contributions", [])
            student_data["contributions"] = list(set(existing_contributions + new_contributions))

            student_data["team_id"] = team_id # Ensure team ID is set/updated

            students_update_payload[net_id] = student_data

        # Perform the final, single batch update for all students
        if students_update_payload:
            await run_in_threadpool(students_ref.update, students_update_payload)
            
        return {"message": "Logins mapped and all related data updated successfully."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))