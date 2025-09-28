import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# Constants
GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN = None, None, None
MAIN_BRANCH_ONLY, MERGED_PRS_ONLY = False, False
headers = {}
BASE_URL = 'https://api.github.com'

def get_branches():
    url = f"{BASE_URL}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/branches"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception("Failed to fetch branches. Status code: " + str(response.status_code))

def get_commits(branch_name):
    url = f"{BASE_URL}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/commits?sha={branch_name}"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to fetch commits on branch {branch_name}. Status code: {response.status_code}. Exception: {response.reason}")

def get_commit_stats(commit_sha):
    url = f"{BASE_URL}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/commits/{commit_sha}"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        file_data = data.get('files', '')
        files = []
        additions = 0
        deletions = 0
        total = 0
        for file in file_data:
            files.append(file['filename'])
            additions += file['additions']
            deletions += file['deletions']
            total += file['changes']
        return {
            'files': files,
            'additions': additions,
            'deletions': deletions,
            'total': total
        }
    return {'additions': 0, 'deletions': 0, 'total': 0, 'files': []}

def sanitize_key(key):
    """Sanitize a string to make it a valid Firebase path key."""
    return key.replace('.', '_').replace('$', '_').replace('#', '_').replace('[', '_').replace(']', '_')

def collect_commit_data():
    all_commit_data = []
    print("Running", GITHUB_REPO)
    branches = get_branches()
    
    for branch in branches:
        if MAIN_BRANCH_ONLY and branch['name'] not in ('main', 'master'):
            print("Skipping branch", branch['name'])
            continue

        branch_name = branch['name']
        print("On branch", branch_name)
        commits = get_commits(branch_name)

        # Use a ThreadPoolExecutor to fetch commit stats in parallel
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Create a map of future->commit to track which result belongs to which commit
            futures_to_commit = {executor.submit(get_commit_stats, c.get('sha', '')): c for c in commits}

            for future in as_completed(futures_to_commit): # <--- Process as they complete
                commit = futures_to_commit[future]
                try:
                    stats = future.result()
                    author = commit.get('commit', {}).get('author', {}).get('email', 'Unknown')
                    all_commit_data.append({
                        'login': sanitize_key(author),
                        'sha': commit.get('sha', ''),
                        'url': commit.get('html_url', ''),
                        'timestamp': commit.get('commit', {}).get('author', {}).get('date', ''),
                        'branch': branch_name,
                        'message': commit.get('commit', {}).get('message', ''),
                        'files': stats.get('files', []),
                        'additions': stats['additions'],
                        'deletions': stats['deletions'],
                        'lines_changed': stats['total'],
                    })
                except Exception as exc:
                    print(f"Commit {commit.get('sha')} generated an exception: {exc}")

    print(f'{GITHUB_REPO} commit data aggregated successfully.')
    return all_commit_data


def collect_comment_data(pr_number):
    # This function now fetches both comment types in parallel for a single PR
    comments = []
    urls = [
        f"{BASE_URL}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/issues/{pr_number}/comments", # Issue comments
        f"{BASE_URL}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/pulls/{pr_number}/comments"  # Review comments
    ]
    
    def fetch_comments(url):
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        return []

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = executor.map(fetch_comments, urls)
        
        # Process issue comments
        for comment in next(results, []):
            comments.append({
                'login': sanitize_key(comment.get('user', {}).get('login', 'unknown')),
                'body': comment.get('body', ''),
                'timestamp': comment.get('created_at', ''),
                'pr_number': pr_number,
                'comment_id': comment.get('id', ''),
                'type': 'issue_comment'
            })
        # Process review comments
        for comment in next(results, []):
            comments.append({
                'login': sanitize_key(comment.get('user', {}).get('login', 'unknown')),
                'body': comment.get('body', ''),
                'timestamp': comment.get('created_at', ''),
                'pr_number': pr_number,
                'comment_id': comment.get('id', ''),
                'type': 'review_comment'
            })
            
    users_to_comments = {}
    for comment in comments:
        user = comment['login']
        if user not in users_to_comments:
            users_to_comments[user] = []
        users_to_comments[user].append(comment)
    
    return users_to_comments


def collect_pr_data():
    all_pr_data = []
    print("Fetching PRs for", GITHUB_REPO)
    url = f"{BASE_URL}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/pulls?state=all"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    pulls = response.json()

    # Filter PRs first
    if MERGED_PRS_ONLY:
        pulls = [pr for pr in pulls if pr.get('merged_at')]

    # Use a ThreadPoolExecutor to fetch comments for all PRs in parallel
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures_to_pr = {executor.submit(collect_comment_data, pr.get('number', '')): pr for pr in pulls}
        
        for future in as_completed(futures_to_pr): # <--- Process as they complete
            pr = futures_to_pr[future]
            try:
                comments = future.result()
                all_pr_data.append({
                    'login': sanitize_key(pr.get('user', {}).get('login', None)),
                    'pr_number': pr.get('number', ''),
                    'url': pr.get('html_url', ''),
                    'diff_url': pr.get('diff_url', ''),
                    'title': pr.get('title', ''),
                    'body': pr.get('body', ''),
                    'timestamp': pr.get('created_at', ''),
                    'merged_at': pr.get('merged_at', ''),
                    'closed_at': pr.get('closed_at', ''),
                    'merge_commit_sha': pr.get('merge_commit_sha', ''),
                    'state': pr.get('state', ''),
                    'comments': comments,
                })
            except Exception as exc:
                print(f"PR #{pr.get('number')} generated an exception: {exc}")

    print(f'{GITHUB_REPO} pull request data aggregated successfully.')
    return all_pr_data

# The main fetch_data function remains the same
def fetch_data(owner, repo_name, main_branch_only, merged_prs_only, token):
    global GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN, MAIN_BRANCH_ONLY, MERGED_PRS_ONLY, headers
    GITHUB_OWNER, GITHUB_REPO, MAIN_BRANCH_ONLY, MERGED_PRS_ONLY, GITHUB_TOKEN = owner, repo_name, main_branch_only, merged_prs_only, token
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }

    with ThreadPoolExecutor(max_workers=2) as executor:
        future_commit_data = executor.submit(collect_commit_data)
        future_pr_data = executor.submit(collect_pr_data)
        commit_data = future_commit_data.result()
        pr_data = future_pr_data.result()

    return commit_data, pr_data