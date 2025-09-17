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
async def fetch_github_data(request: Request):
    body = await request.json()
    owner = body.get('repo_owner', None)
    repo_name = body.get('repo_name', None)
    team_id = body.get('team_id', None)

    if not owner or not repo_name:
        return {"error": "repo_owner and repo_name are required"}

    if not team_id:
        return {"error": "team_id is required"}

    if not owner or not repo_name:
        return {"error": "owner and repo_name are required"}

    from scripts.fetch_github_data import fetch_data
    from env import GITHUB_TOKEN
    commit_data, pr_data = fetch_data(owner, repo_name, GITHUB_TOKEN)
    
    from scripts.post_github_data import post_to_db
    post_to_db(commit_data, pr_data, team_id)

    return {"message": "Data successfully posted to Firebase"}

# Summary: Fetch contributions for a team as a list, sorted by timestamp descending.
# Request body example: {"team_id": "your_team_id"}
# Returns: List of contribution objects, sorted by timestamp descending.
# @app.get("/api/contributions/all")
# async def get_contributions(request: Request):
#     body = await request.json()
#     team_id = body.get('team_id', None)
#     if not team_id:
#         return {"error": "team_id is required"}

#     ref = db.reference(f'contributions/{team_id}')
#     contributions = list(ref.get().values()) or []
#     contributions.sort(key=lambda x: x['timestamp'], reverse=True)

#     return contributions

# @app.get("/api/contributions/all")
# async def get_contributions(team_id: str = Query(..., description="Team ID")):
#     if not team_id:
#         return {"error": "team_id is required"}

#     ref = db.reference(f'contributions/{team_id}')
#     data = ref.get()

#     if not data:
#         return {"contributions": []}

#     contributions = list(data.values())
#     contributions.sort(key=lambda x: x['timestamp'], reverse=True)

#     return {"contributions": contributions}

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
        author = contrib_data.get("author", "unknown")
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



    


from scripts.post_docs_data import post_docs_to_db
from pydantic import BaseModel
from fastapi import UploadFile, File, Form, HTTPException
import json

class DocsIngestBody(BaseModel):
    team_id: str
    doc: dict

@app.post("/api/google_docs/post")
async def post_google_docs_json(body: DocsIngestBody):
    try:
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
