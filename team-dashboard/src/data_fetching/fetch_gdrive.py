from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from collections import defaultdict
from google.auth.transport.requests import Request
import os
import json
import pickle

CLIENT_SECRET_FILE = ''  # Replace with the path to your credentials.json
API_NAME = 'drive'
API_VERSION = 'v3'

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


def get_comments(file_id):
    """
    Returns comments and their details of a specific file
    """
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
            'anchor' : comment['anchor'],
            'commented_on_type': comment.get('quotedFileContent', {}).get('mimeType', 'N/A'),
            'commented_on': comment.get('quotedFileContent', {}).get('value', 'N/A'),
            'created_time': comment['createdTime'],
            'replies': comment['replies'],
            'resolved': comment.get('resolved', False)
        }
        comments.append(comment_info)
        
    return comments


def get_revision_history(file_id):
    '''
    Returns revision history of a specific file
    '''
    service = authenticate('drive') 
    results = service.revisions().list(fileId=file_id, fields="*").execute()
    revisions = results.get('revisions', [])
    revisions_history=  []
    for revision in revisions:
        data = {
        'file_id': file_id,
        'revision_id' :revision['id'],
        'mime_type':revision['mimeType'],
        'modified_time' : revision['modifiedTime'],
        'last_modifying_user': revision.get('lastModifyingUser', {}).get('displayName', 'Unknown'),
        'published' : revision.get('published', False),
        }
        revisions_history.append(data)
    return revisions_history

def get_drive_history(file_id):
    """
    Returns the revision history and comments of a google drive file
    """
    drive_data =  defaultdict(list)
    drive_data['revisions'].append(get_revision_history(file_id))
    drive_data["comments"].append(get_comments(file_id))
    return drive_data



def main():

    file_id = '' # Enter the file_id here

    with open(f"google_doc_history_{file_id}.json", "w") as file:
        json.dump(get_drive_history(file_id), file, indent=4)

if __name__ == "__main__":
    main()
    
    