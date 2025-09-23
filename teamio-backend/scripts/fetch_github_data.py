import requests

# Constants
GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN = None, None, None
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
        for file in file_data:
            files.append(file['filename'])
            additions += file['additions']
            deletions += file['deletions']
        return {
            'files': files,
            'additions': additions,
            'deletions': deletions,
        }
    return {'additions': 0, 'deletions': 0}

def sanitize_key(key):
    """Sanitize a string to make it a valid Firebase path key."""
    return key.replace('.', '_').replace('$', '_').replace('#', '_').replace('[', '_').replace(']', '_')

def collect_commit_data():
    commit_data = []
    print("Running", GITHUB_REPO)
    branches = get_branches()
    for branch in branches:
        branch_name = branch['name']
        print("On branch", branch_name)
        commits = get_commits(branch_name)

        for commit in commits:
            author = commit.get('commit', {}).get('author', {}).get('email', 'Unknown')
            message = commit.get('commit', {}).get('message', '')
            timestamp = commit.get('commit', {}).get('author', {}).get('date', '')
            commit_sha = commit.get('sha', '')
            url = commit.get('html_url', '')
            stats = get_commit_stats(commit_sha)
            file_names = stats.get('files', [])
            commit_data.append({
                'login': sanitize_key(author),
                'sha': commit_sha,
                'url': url,
                'timestamp': timestamp,
                'branch': branch_name,
                'message': message,
                'files': file_names,
                'additions': stats['additions'],
                'deletions': stats['deletions'],
            })
    print(f'{GITHUB_REPO} commit data aggregated successfully.')
    return commit_data

def collect_pr_data():
    pr_data = []
    print("Fetching PRs for", GITHUB_REPO)
    url = f"{BASE_URL}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/pulls?state=all"
    response = requests.get(url, headers=headers)
    pulls = response.json()
    for pr in pulls:
        url = pr.get('html_url', '')
        diff_url = pr.get('diff_url', '')
        number = pr.get('number', '')
        login = pr.get('user', {}).get('login', None)
        title = pr.get('title', '')
        body = pr.get('body', '')
        created_at = pr.get('created_at', '')
        merged_at = pr.get('merged_at', '')
        closed_at = pr.get('closed_at', '')
        merge_commit_sha = pr.get('merge_commit_sha', '')
        state = pr.get('state', '')
        pr_data.append({
            'login': sanitize_key(login),
            'pr_number': number,
            'url': url,
            'diff_url': diff_url,
            'title': title,
            'body': body,
            'timestamp': created_at,
            'merged_at': merged_at,
            'closed_at': closed_at,
            'merge_commit_sha': merge_commit_sha,
            'state': state
        })
    print(f'{GITHUB_REPO} pull request data aggregated successfully.')
    return pr_data

def fetch_data(owner, repo_name, token):

    global GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN, headers
    GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN = owner, repo_name, token
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }

    commit_data = collect_commit_data()
    pr_data = collect_pr_data()
    return commit_data, pr_data