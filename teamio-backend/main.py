from fastapi import FastAPI, Request, Response
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
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")  # <-- read once
if not GITHUB_TOKEN:
    # Fail early with a clear message instead of a stack trace later
    raise RuntimeError("GITHUB_TOKEN is not set. Create teamio-backend/.env with GITHUB_TOKEN=...")


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
    commit_data, pr_data = fetch_data(owner, repo_name, GITHUB_TOKEN)
    
    from scripts.post_github_data import post_to_db
    post_to_db(commit_data, pr_data, team_id)

    return {"message": "Data successfully posted to Firebase"}

# Summary: Fetch contributions for a team as a list, sorted by timestamp descending.
# Request body example: {"team_id": "your_team_id"}
# Returns: List of contribution objects, sorted by timestamp descending.

# replace your current GET handler
@app.get("/api/contributions/all")
async def get_contributions(team_id: str):
    ref = db.reference(f'contributions/{team_id}')
    raw = ref.get() or {}
    contributions = list(raw.values()) if isinstance(raw, dict) else []
    contributions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return contributions



    


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

# Summary: Fetch detailed log_data record by tool/metric/contribution_id.
# Query params example: ?tool=google_docs&metric=revision&contribution_id=UUID
# Returns: Full log_data object or 404 if not found.
@app.get("/api/log_data")
async def get_log_data(tool: str, metric: str, contribution_id: str):
    try:
        ref = db.reference(f'log_data/{tool}/{metric}/{contribution_id}')
        data = ref.get()
        if not data:
            raise HTTPException(status_code=404, detail="Log data not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
