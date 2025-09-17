import firebase_admin
from firebase_admin import credentials, db
import uuid

TEAM_ID = None
FIREBASE_SERVICE_CREDENTIALS = None

def process_commit_data(commit_data):
    processed_data = []
    sha_set = set()
    dupe_count = 0
    for commit in commit_data:
        sha = commit['sha']
        if sha not in sha_set:
            sha_set.add(sha)
            commit['contribution_id'] = str(uuid.uuid4())
            processed_data.append(commit)
        else:
            dupe_count += 1

    # Handle logic for multiple commits by the same author with different logins goes here
    
    print(f"Removed {dupe_count} duplicate commits.")

    commits_ref = db.reference(f'log_data/github/commit')
    existing_commits = commits_ref.get() or {}

    existing_shas = {commit['sha']: commit['contribution_id'] for commit in existing_commits.values()}
    count = 0
    for commit in processed_data:
        if commit['sha'] in existing_shas.keys():
            commit['contribution_id'] = existing_shas[commit['sha']]
            count += 1
    
    print(f"Matched {count} existing commits with contribution IDs.")

    return processed_data

def process_pr_data(pr_data):
    processed_data = []
    pr_number_set = set()
    dupe_count = 0
    for pr in pr_data:
        pr_number = pr['pr_number']
        if pr_number not in pr_number_set:
            pr_number_set.add(pr_number)
            pr['contribution_id'] = str(uuid.uuid4())
            processed_data.append(pr)
        else:
            dupe_count += 1

    print(f"Removed {dupe_count} duplicate pull requests.")

    prs_ref = db.reference(f'log_data/github/pull_request')
    existing_prs = prs_ref.get() or {}

    existing_shas = {pr['pr_number']: pr['contribution_id'] for pr in existing_prs.values()}
    count = 0
    for pr in processed_data:
        if pr['pr_number'] in existing_shas.keys():
            pr['contribution_id'] = existing_shas[pr['pr_number']]
            count += 1
    
    print(f"Matched {count} existing pull requests with contribution IDs.")

    return processed_data

def post_to_contributions(github_data, metric):
    for contribution in github_data:
        ref = db.reference(f'contributions/{TEAM_ID}/{contribution["contribution_id"]}')
        ref.set({
            'contribution_id': contribution['contribution_id'],
            'author': contribution['login'],
            'timestamp': contribution['timestamp'],
            'tool': 'github',
            'metric': metric,
            'team_id': TEAM_ID,
            'title': contribution.get('title', contribution.get('message', ''))
        })

def post_to_log_data(github_data, metric):
    for contribution in github_data:
        ref = db.reference(f'log_data/github/{metric}/{contribution["contribution_id"]}')
        ref.set(contribution)
    print(f"Posted {len(github_data)} {metric}(s) to log_data/github/{metric}.")

def post_to_teams(github_data):
    if not TEAM_ID:
        raise ValueError("TEAM_ID is not set. Please provide a valid team ID.")

    team_logins = set(contribution['login'] for contribution in github_data)

    ref = db.reference(f'teams/{TEAM_ID}')
    if not ref.get():
        ref.set({'team_id': TEAM_ID, 'logins': []})

    ref = db.reference(f'teams/{TEAM_ID}/logins')
    existing_logins = ref.get() or []

    updates = {}
    for login in team_logins:
        sanitized_login = login  
        if sanitized_login not in existing_logins:
            updates[sanitized_login] = {
                'login': login,  # Save the original login value
                'net_id': login,  # Placeholder until we have a mapping
            }

    if updates:
        ref.update(updates)

    print(f"Updated team {TEAM_ID} members.")

def post_to_db(commit_data, pr_data, team_id=None):
    global TEAM_ID
    TEAM_ID = team_id

    clean_commit_data = process_commit_data(commit_data)
    post_to_contributions(clean_commit_data, 'commit')
    post_to_log_data(clean_commit_data, 'commit')
    post_to_teams(clean_commit_data)
    print("Successfully posted commit data to the database.")

    clean_pr_data = process_pr_data(pr_data)
    post_to_contributions(clean_pr_data, 'pull_request')
    post_to_log_data(clean_pr_data, 'pull_request')
    post_to_teams(clean_pr_data)
    print("Successfully posted pull request data to the database.")
