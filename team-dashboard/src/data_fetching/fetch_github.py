import requests
from collections import defaultdict
import json
import logging

GITHUB_TOKEN = '' # Enter token
ORG_NAME = '' # Enter github organization/owner name
REPO_NAME = '' # Enter name of repository

BASE_URL = 'https://api.github.com'

headers = {
    'Authorization' : f'token {GITHUB_TOKEN}',
    'Accept' : 'application/vnd.github.v3+json'
}


def get_branches(repo_name):
    '''
        Fetched all the branches in a repository
    '''
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/branches"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        logging.error(f"Failed to fetch branches for repo {repo_name}: {response.status_code}")
        return []
    return response.json()


def get_commits(repo_name, branch_name):
    '''
        Fetches all the commits to a specific branch
    '''
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/commits?sha={branch_name}"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        logging.error(f"Failed to fetch commits for branch {branch_name}: {response.status_code}")
        return []
    return response.json()


def get_commit_stats(repo_name, commit_sha):
    '''
        Get commit statistics for a specific commit SHA
    '''
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/commits/{commit_sha}"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        logging.error(f"Failed to fetch commit statistics for commit_sha {commit_sha}: {response.status_code}")
        return {'additions': 0, 'deletions': 0}
    
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
        'files' : files,
        'additions' : additions,
        'deletions' : deletions,
    }
    


def get_pull_requests(repo_name):
    '''
        Get all pull requests for a repository
    '''
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/pulls?state=all"  
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        logging.error(f"Failed to fetch pull requests for {repo_name}: {response.status_code}")
        return []
    return response.json()


def get_pr_reviewer(repo_name, pr_number):
    '''
        Fetch all reviewers for a specific pull request
    '''
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/pulls/{pr_number}/reviews"
    response = requests.get(url, headers=headers)

    reviewers = set()
    if response.status_code != 200:
        logging.error(f"Failed to fetch reviewers for pull request #{pr_number}: {response.status_code}")
        return []
    
    reviews = response.json()
    for review in reviews:
        user = review.get('user', {})
        username = user.get('login')
        if username:
            reviewers.add(username)

    return list(reviewers)


def collect_github_data(repo_name):
    '''
        Get commit history data and pull request data
    '''
    data = defaultdict(list)
    branches = get_branches(repo_name)
        
    for branch in branches:
        branch_name = branch['name']
        commits = get_commits(repo_name, branch_name)

        for commit in commits:
            author = commit.get('commit', {}).get('committer', {}).get('name', 'Unknown')
            message = commit.get('commit', {}).get('message', '')
            timestamp = commit.get('commit', {}).get('author', {}).get('date', '')
            commit_sha = commit.get('sha', '')
            url = commit.get('url', '')
            
            stats = get_commit_stats(repo_name, commit_sha)
            file_names = []
            if "files" in stats.keys():
                file_names = stats['files']
            
            data[repo_name+"_commit_history"].append({
                'login' : author,
                'sha' : commit_sha,
                'url' : url,
                'timestamp' : timestamp,
                'branch': branch_name,
                'message': message,
                'files' : file_names,
                'additions': stats['additions'],
                'deletions': stats['deletions']
            })

        # print(f"Fetched {len(commits)} commits from {repo_name}, branch: {branch_name}")

    pull_requests = get_pull_requests(repo_name)
    for pr in pull_requests:
        pr_number = pr.get('number', '')
        pr_title = pr.get('title', '')
        pr_url = pr.get('html_url', '')
        pr_author = pr.get('user', {}).get('login', 'Unknown')
        pr_description = pr.get('body', 'No description provided')
        pr_state = pr.get('state', 'Unknown')
        pr_created_at = pr.get('created_at', '')
        pr_merged_at = pr.get('merged_at', '')
        reviewers = get_pr_reviewer(repo_name, pr_number)

        data[repo_name+"_PRs"].append({
            'pr_number': pr_number,
            'title': pr_title,
            'url': pr_url,
            'author': pr_author,
            'state': pr_state,
            'description' : pr_description,
            'created_at': pr_created_at,
            'merged_at': pr_merged_at,
            'reviewers': reviewers 
        })
    # print(f"Fetched {len(pull_requests)} pull requests from {repo_name}")
       
    # print(f"Data aggregation for {repo_name} completed successfully.")
    return data



def main():
    data = collect_github_data(REPO_NAME)
    with open(f"github_history_{REPO_NAME}.json", "w") as file:
        json.dump(data, file, indent=4)
    print("Commit and PR history has been collected and saved to github_history.json")

if __name__ == "__main__":
    main()   



