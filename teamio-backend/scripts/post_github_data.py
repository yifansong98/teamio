import firebase_admin
from firebase_admin import credentials, db
from concurrent.futures import ThreadPoolExecutor, as_completed
import uuid

TEAM_ID = None
FIREBASE_SERVICE_CREDENTIALS = None

def _uuid5(key: str) -> str:
    # content-derived stable id (idempotent)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))

def process_commit_data(commit_data):
    processed_data = []
    sha_set = set()
    dupe_count = 0
    for commit in commit_data:
        sha = commit['sha']
        if sha not in sha_set:
            sha_set.add(sha)
            commit['contribution_id'] = _uuid5(sha)
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
            pr['contribution_id'] = _uuid5(f"{TEAM_ID}, pr-{pr_number}")
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

def batch_post_to_contributions(commit_data, pr_data):
    """Prepares and posts all contributions in a single batch."""
    if not commit_data and not pr_data:
        return

    contributions_payload = {}
    
    # Prepare commit contributions
    for c in commit_data:
        path = c['contribution_id']
        contributions_payload[path] = {
            'contribution_id': c['contribution_id'],
            'author': c['login'],
            'net_id': c['login'],  # Use login as net_id for GitHub data
            'timestamp': c['timestamp'],
            'tool': 'github',
            'metric': 'commit',
            'team_id': TEAM_ID,
            'title': c.get('message', ''),
            'quantity': c.get('lines_changed', 0)
        }
        
    # Prepare PR contributions
    for pr in pr_data:
        path = pr['contribution_id']
        contributions_payload[path] = {
            'contribution_id': pr['contribution_id'],
            'author': pr['login'],
            'net_id': pr['login'],  # Use login as net_id for GitHub data
            'timestamp': pr['timestamp'],
            'tool': 'github',
            'metric': 'pull_request',
            'team_id': TEAM_ID,
            'title': pr.get('title', ''),
            'quantity': 0 # PRs don't have a simple quantity metric here
        }

    if contributions_payload:
        ref = db.reference(f'contributions/{TEAM_ID}')
        ref.update(contributions_payload)
    print("Batch-posted all contributions to the database.")

def batch_post_to_log_data(data, metric):
    """Prepares and posts all log data for a given metric in a single batch."""
    if not data:
        return
        
    log_data_payload = {item['contribution_id']: item for item in data}
    
    if log_data_payload:
        ref = db.reference(f'log_data/github/{metric}')
        ref.update(log_data_payload)
    print(f"Batch-posted {len(data)} {metric}(s) to log_data.")


def batch_post_to_teams(all_logins):
    """Updates team logins in a single batch."""
    if not TEAM_ID:
        raise ValueError("TEAM_ID is not set.")
    if not all_logins:
        return

    ref = db.reference(f'teams/{TEAM_ID}/logins')
    existing_logins_data = ref.get() or {}
    existing_logins_set = set(existing_logins_data.keys())

    new_logins_to_add = all_logins - existing_logins_set
    
    updates = {}
    for login in new_logins_to_add:
        sanitized_key = login.replace('.', '_').replace('$', '_') # etc.
        updates[sanitized_key] = {
            'login': login,
            'net_id': login, # Placeholder
        }

    if updates:
        ref.update(updates)
    print(f"Updated team {TEAM_ID} with {len(updates)} new members.")


# --- REFACTORED MAIN ORCHESTRATOR FUNCTION ---

def post_to_db(commit_data, pr_data, team_id=None):
    global TEAM_ID
    TEAM_ID = team_id

    # Stage 1: Process and clean data in parallel (unchanged)
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_commits = executor.submit(process_commit_data, commit_data)
        future_prs = executor.submit(process_pr_data, pr_data)
        clean_commit_data = future_commits.result()
        clean_pr_data = future_prs.result()

    # Stage 2: Submit all batch database writes to run in parallel
    with ThreadPoolExecutor(max_workers=4) as executor:
        # Consolidate all unique logins from both data sources first
        all_logins = {c['login'] for c in clean_commit_data} | {p['login'] for p in clean_pr_data}

        # Submit all batch operations
        futures = [
            executor.submit(batch_post_to_contributions, clean_commit_data, clean_pr_data),
            executor.submit(batch_post_to_log_data, clean_commit_data, 'commit'),
            executor.submit(batch_post_to_log_data, clean_pr_data, 'pull_request'),
            executor.submit(batch_post_to_teams, all_logins)
        ]

        # Wait for all posting to complete and handle any exceptions
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"A database posting operation failed: {e}")
                raise
    
    print("All database operations completed successfully.")
