from fastapi import FastAPI, Request, Response
import firebase_admin
from firebase_admin import credentials, db
from fastapi.middleware.cors import CORSMiddleware

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
@app.get("/api/contributions/all")
async def get_contributions(request: Request):
    body = await request.json()
    team_id = body.get('team_id', None)
    if not team_id:
        return {"error": "team_id is required"}

    ref = db.reference(f'contributions/{team_id}')
    contributions = list(ref.get().values()) or []
    contributions.sort(key=lambda x: x['timestamp'], reverse=True)

    return contributions