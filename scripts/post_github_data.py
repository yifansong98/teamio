import argparse
import json
import firebase_admin
from firebase_admin import credentials, db
import datetime
import requests
import os
import uuid

TEAM_ID = None

def initialize_db():
    cred = credentials.Certificate('firebase_secret_key.json')
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
    })

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

    commits_ref = db.reference(f'log_data/github')
    existing_commits = commits_ref.get() or {}

    existing_shas = set(commit['sha'] for commit in existing_commits.values() or [])
    prev_count = len(processed_data)
    processed_data = [commit for commit in processed_data if commit['sha'] not in existing_shas]
    print(f"Filtered out {prev_count - len(processed_data)} commits already in the database.")

    return processed_data

def post_to_contributions(commit_data):
    for commit in commit_data:
        ref = db.reference(f'contributions/{TEAM_ID}/{commit["contribution_id"]}')
        ref.set({
            'contribution_id': commit['contribution_id'],
            'author': commit['login'],
            'timestamp': commit['timestamp'],
            'metric': 'commit',
            'team_id': TEAM_ID,
        })

def post_to_log_data(commit_data):
    for commit in commit_data:
        ref = db.reference(f'log_data/github/{commit["contribution_id"]}')
        ref.set(commit)
    print(f"Posted {len(commit_data)} commits to log_data/github.")

def post_to_students(commit_data):

    # Needs to be updated to use a mapping of GitHub logins to student info
    team_members = set()
    for commit in commit_data:
        email = commit['login']
        net_id = email.split('@')[0]
        team_members.add(net_id)
        ref = db.reference(f'students/{net_id}')
        student_data = ref.get() or {
            'net_id': net_id,
            'email': email,
            'first_name': 'John',
            'last_name': 'Doe',
            'team_id': TEAM_ID,
            'contributions': []
        }
        if commit['contribution_id'] not in student_data['contributions']:
            student_data['contributions'].append(commit['contribution_id'])
        ref.set(student_data)
    print(f"Updated student records for {len(commit_data)} commits.")

    ref = db.reference(f'teams/{TEAM_ID}')
    team_data = ref.get() or {'team_id': TEAM_ID, 'members': []}
    team_data['team_id'] = TEAM_ID
    ref.set(team_data)

    ref = db.reference(f'teams/{TEAM_ID}/members')
    existing_members = ref.get() or []
    updated_members = list(set(existing_members) | team_members)
    ref.set(updated_members)
    print(f"Updated team {TEAM_ID} members.")

def post_to_db(commit_data):
    clean_data = process_commit_data(commit_data)
    post_to_contributions(clean_data)
    post_to_log_data(clean_data)
    post_to_students(clean_data)
    print("Successfully posted commit data to the database.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process and post GitHub data")
    parser.add_argument("--commit-data", required=False, help="Commit data in JSON format")
    parser.add_argument("--commit-data-file", required=False, help="Path to a file containing commit data")
    parser.add_argument("--team-id", required=True, help="Team Name")
    args = parser.parse_args()

    TEAM_ID = args.team_id

    if args.commit_data:
        commit_data = json.loads(args.commit_data)
    elif args.commit_data_file and os.path.exists(args.commit_data_file):
        with open(args.commit_data_file, "r") as file:
            commit_data = json.load(file)
    else:
        raise ValueError("You must provide either --commit-data or --commit-data-file")

    initialize_db()
    post_to_db(commit_data)