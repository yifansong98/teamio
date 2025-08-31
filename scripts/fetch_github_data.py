import requests
import argparse
from collections import defaultdict
import json
import time
import pandas as pd
import os

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
        raise Exception(f"Failed to fetch commits on branch {branch_name}. Status code: " + str(response.status_code))

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
                'login': author,
                'sha': commit_sha,
                'url': url,
                'timestamp': timestamp,
                'branch': branch_name,
                'message': message,
                'files': file_names,
                'additions': stats['additions'],
                'deletions': stats['deletions'],
            })
    print(f'{GITHUB_REPO} data aggregated successfully.')
    return commit_data

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Fetch GitHub commit data.')
    parser.add_argument('--owner', type=str, required=True, default=GITHUB_OWNER, help='GitHub organization or user name')
    parser.add_argument('--repo-name', type=str, required=True, default=GITHUB_REPO, help='GitHub repository name')
    parser.add_argument('--token', type=str, required=False, default=GITHUB_TOKEN, help='GitHub token')
    args = parser.parse_args()
    
    GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN = args.owner, args.repo_name, args.token
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    } if GITHUB_TOKEN else {
        'Accept': 'application/vnd.github.v3+json'
    }

    commit_data = collect_commit_data()
    print(f"::set-output name=commit_data::{json.dumps(commit_data)}")
    print("Commit history has been collected and saved to commit_history.json")
    with open("commit_history.json", "w") as file:
        json.dump(commit_data, file, indent=4)