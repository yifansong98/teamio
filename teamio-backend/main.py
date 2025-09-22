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
import json
from collections import defaultdict

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
async def fetch_github_data(team_id: str = Query(...), owner: str = Query(...), repo_name: str = Query(...)):
    try:
        from scripts.fetch_github_data import fetch_data
        from env import GITHUB_TOKEN

        commit_data, pr_data = fetch_data(owner, repo_name, GITHUB_TOKEN)

        from scripts.post_github_data import post_to_db
        post_to_db(commit_data, pr_data, team_id)
    except Exception as e:
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
 
    contrib_ref = db.reference(f"contributions/{team_id}")
    contributions = contrib_ref.get() or {}
    summary = {}
    timeline_map = {}

    for contrib_id, contrib_data in contributions.items():
        author = contrib_data.get("net_id", "unknown")
        # print(author)
        # Check if this contribution has a matching commit
        commit_ref = db.reference(f"log_data/github/commit/{contrib_id}")
        commit_data = commit_ref.get()
        # print(commit_data)

        if commit_data:
            summary[author] = summary.get(author, 0) + 1

            timestamp = commit_data.get("timestamp")
            if timestamp:
                if author not in timeline_map:
                    timeline_map[author] = []
                timeline_map[author].append(timestamp)
    timeline = [
        {"author": author, "timestamps": timestamps}
        for author, timestamps in timeline_map.items()
    ]
    print(timeline)
    return JSONResponse(content={"summary": summary, "timeline": timeline})

@app.get("/api/reflections/revisions")
async def get_revisions_history(team_id: str = Query(...)):
 
    contrib_ref = db.reference(f"contributions/{team_id}")
    contributions = contrib_ref.get() or {}
    summary = {}
    timeline_map = {}

    for contrib_id, contrib_data in contributions.items():
        author = contrib_data.get("net_id", "unknown")
        revision_ref = db.reference(f"log_data/google_docs/revision/{contrib_id}")
        revision_data = revision_ref.get()

        if revision_data:
            summary[author] = summary.get(author, 0) + 1

            timestamp = revision_data.get("timestamp")
            if timestamp:
                if author not in timeline_map:
                    timeline_map[author] = []
                timeline_map[author].append(timestamp)
    timeline = [
        {"author": author, "timestamps": timestamps}
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
        print(body.doc)
        post_docs_to_db(body.doc, body.team_id)
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
        mappings = data["mappings"]
        ref = db.reference(f'teams/{team_id}/logins')
        net_ids_to_logins = defaultdict(list)
        for login, net_id in mappings.items():
            net_ids_to_logins[net_id].append(login)
            ref.child(login).set({"net_id": net_id, "login": login})

        students_ref = db.reference('students')
        for net_id, new_logins in net_ids_to_logins.items():
            student_ref = students_ref.child(net_id)
            student_data = student_ref.get() or {
                "net_id": net_id,
                "team_id": team_id,
                "contributions": [],
                "logins": [],
            }

            # Append new logins to the existing logins
            existing_logins = student_data.get("logins", [])
            updated_logins = list(set(existing_logins + new_logins))  # Ensure no duplicates
            student_data["logins"] = updated_logins
            student_data["team_id"] = team_id  # Ensure team_id is updated

            # Save the updated student data
            student_ref.set(student_data)

        net_ids_to_contributions = defaultdict(list)
        contrib_ref = db.reference(f'contributions/{team_id}')
        contributions = contrib_ref.get() or {}
        for contrib_id, contrib_data in contributions.items():
            author = contrib_data.get("author")
            if author in mappings:
                net_id = mappings[author]
                net_ids_to_contributions[net_id].append(contrib_id)
                contrib_data["net_id"] = net_id
                contrib_ref.child(contrib_id).set(contrib_data)
        
        for net_id, new_contributions in net_ids_to_contributions.items():
            student_ref = students_ref.child(net_id)
            student_data = student_ref.get() or {
                "net_id": net_id,
                "team_id": team_id,
                "contributions": [],
                "logins": [],
            }

            # Append new contributions to the existing contributions
            existing_contributions = student_data.get("contributions", [])
            updated_contributions = list(set(existing_contributions + new_contributions))  # Ensure no duplicates
            student_data["contributions"] = updated_contributions
            student_data["team_id"] = team_id  # Ensure team_id is updated

            # Save the updated student data
            student_ref.set(student_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))