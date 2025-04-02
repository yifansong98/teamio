from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from collections import defaultdict
from google.auth.transport.requests import Request
import os
import json
import pickle


#CLIENT_SECRET_FILE = 'client_secret.json'  
#API_NAME = 'drive'
#API_VERSION = 'v3'


SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.activity',
    'https://www.googleapis.com/auth/drive.activity.readonly'
]

def authenticate(api_name):
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=8080)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    
    return build(api_name, 'v3' if api_name == 'drive' else 'v2', credentials=creds)



def get_revision_history(file_id):
    service = authenticate('drive')  
    results = service.revisions().list(fileId=file_id, fields="*").execute()
    revisions = results.get('revisions', [])
    revisions_data =  defaultdict(list)
    for revision in revisions:
        #print(f"Revision ID: {revision['id']}")
        #print(f"Modified Time: {revision['modifiedTime']}")
        #print(f"Last Modifying User: {revision.get('lastModifyingUser', {}).get('displayName', 'Unknown')}")
        #print(f"Published: {revision.get('published', False)}")
        #print('-' * 40)
        revisions_data["revision_history"].append({
        'file_id': file_id,
        'revision_id' :revision['id'],
        'mime_type':revision['mimeType'],
        'modified_time' : revision['modifiedTime'],
        'last_modifying_user': revision.get('lastModifyingUser', {}).get('displayName', 'Unknown'),
        'published' : revision.get('published', False),
        })
    revisions_data["comments"].append(get_comments(file_id))
    return revisions_data

def get_comments(file_id):
    service = authenticate('drive')
    comments = []
    
    results = service.comments().list(fileId=file_id, fields='*').execute()
    comments_data = results.get('comments', [])
   
    for comment in comments_data:
        comment_info = {
            'file_id': file_id,
            'comment_id': comment.get('id', 'No ID available'),
            'content': comment['content'],
            'author': comment['author']['displayName'],
            'created_time': comment['createdTime'],
            'replies': comment['replies'],
            'resolved': comment.get('resolved', False)
        }
        comments.append(comment_info)
        
    return comments


def display_comments(file_id):
    comments = get_comments(file_id)
    
    if comments:
        for comment in comments:
            print(f"Comment ID: {comment.get('id', 'No ID available')}")
            print(f"Content: {comment['content']}")
            print(f"Author: {comment['author']}")
            print(f"Created Time: {comment['created_time']}")
            print(f"Resolved: {comment['resolved']}")
            print("-" * 40)
    else:
        print("No comments found.")



def main():
    file_id = '1vdyhCpgsAkWYi5qR5YSCtDNHfaw1uHEEHyMC--UgfPU'

    with open("google_doc_history.json", "w") as file:
        json.dump(get_revision_history(file_id), file, indent=4)

if __name__ == "__main__":
    main()
    
    