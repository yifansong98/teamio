import requests
from collections import defaultdict
import json
import time
import os
from dotenv import load_dotenv

GITHUB_TOKEN = ""
ORG_NAME = 'yifansong98' 
REPO_NAME = 'teamio'

BASE_URL = 'https://api.github.com'

headers = {
    'Authorization' : f'token {GITHUB_TOKEN}',
    'Accept' : 'application/vnd.github.v3+json'
}


def get_branches(repo_name):
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/branches"
    response = requests.get(url, headers=headers)
    # print("get_branches: " + str(response.status_code))
    return response.json() if response.status_code == 200 else []

def get_commits(repo_name, branch_name):
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/commits?sha={branch_name}"
    response = requests.get(url, headers=headers)
    # print("get_commits: " + str(response.status_code))
    return response.json() if response.status_code == 200 else []

def get_commit_stats(repo_name, commit_sha):
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/commits/{commit_sha}"
    response = requests.get(url, headers=headers)
    # print("get_commit_stats: " + str(response.status_code))
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
            'files' : files,
            'additions' : additions,
            'deletions' : deletions,
        }
    return {'additions': 0, 'deletions': 0}

def get_pull_requests(repo_name):
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/pulls?state=all"  
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    return []

def get_pr_reviews(repo_name, pr_number):
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/pulls/{pr_number}/reviews"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    return []

def collect_commit_data(repo_name):
    commit_data_by_user = defaultdict(list)
    branches = get_branches(repo_name)
        
    for branch in branches:
        branch_name = branch['name']
        commits = get_commits(repo_name, branch_name)

        for commit in commits:
            author = commit.get('commit', {}).get('author', {}).get('email', 'Unknown')
            message = commit.get('commit', {}).get('message', '')
            timestamp = commit.get('commit', {}).get('author', {}).get('date', '')
            commit_sha = commit.get('sha', '')
            url = commit.get('url', '')
            # Fetch additions and deletions using the commit SHA
            stats = get_commit_stats(repo_name, commit_sha)
            file_names = []
            if "files" in stats.keys():
                file_names = stats['files']
            
            commit_data_by_user[REPO_NAME+"_commit_history"].append({
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
        print(f"Fetched {len(commits)} commits from {repo_name}, branch: {branch_name}")

    pull_requests = get_pull_requests(repo_name)
    for pr in pull_requests:
        pr_number = pr.get('number', '')
        pr_title = pr.get('title', '')
        pr_url = pr.get('html_url', '')
        pr_author = pr.get('user', {}).get('login', 'Unknown')
        pr_state = pr.get('state', 'Unknown')
        pr_created_at = pr.get('created_at', '')
        pr_merged_at = pr.get('merged_at', '')
        pr_description = pr.get('body', 'No description provided')
        merged_by = pr.get('merged_by', {}).get('login', None) if pr_merged_at else None
        closed_by = get_closer_of_pr(repo_name, pr_number) if pr_state == "closed" and not pr_merged_at else None
        pr_reviews = get_pr_reviews(repo_name, pr_number)
        reviewers = [review.get('user', {}).get('login', 'Unknown') for review in pr_reviews]

        commit_data_by_user[repo_name+"_pull_requests"].append({
            'pr_number': pr_number,
            'title': pr_title,
            'url': pr_url,
            'author': pr_author,
            'state': pr_state,
            'description' : pr_description,
            'created_at': pr_created_at,
            'merged_at': pr_merged_at,
            'merged_by': merged_by,
            'closed_by': closed_by,
            'reviewers': reviewers 
        })
    print(f"Fetched {len(pull_requests)} pull requests from {repo_name}")

    print(f"Data aggregation for {repo_name} completed successfully.")
    return commit_data_by_user

def get_closer_of_pr(repo_name, pr_number):
    url = f"{BASE_URL}/repos/{ORG_NAME}/{repo_name}/issues/{pr_number}/events"
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        events = response.json()
        for event in reversed(events):  # Check events from latest to earliest
            if event.get("event") == "closed":
                return event.get("actor", {}).get("login", "Unknown")
    return "Unknown"

def main():
    REPO_NAME = 'teamio'
    commit_data_by_user = collect_commit_data(REPO_NAME)
    
    with open(f"commit_history_{REPO_NAME}.json", "w") as file:
        json.dump(commit_data_by_user, file, indent=4)
    
    print("Commit history has been collected and saved to commit_history.json")

if __name__ == "__main__":
    main()   