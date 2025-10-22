import firebase_admin
from firebase_admin import credentials, db
import json

def test_new_scraping(team_id):
    """
    Test that new document scraping will work correctly.
    """
    try:
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate("../../teamio-backend/FIREBASE_SERVICE_CREDENTIALS.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
        })
        print("Firebase app initialized successfully.")

        # Simulate new document data with current editors
        mock_document_data = {
            "meta": {
                "docId": "test_document_123",
                "url": "https://docs.google.com/document/d/test_document_123/edit"
            },
            "users": {
                "user1": {"name": "Alice Johnson", "anonymous": False},
                "user2": {"name": "Bob Smith", "anonymous": False}
            },
            "events": [
                {
                    "type": "insert",
                    "authorId": "user1",
                    "text": "Hello from Alice",
                    "timestamp": "2024-01-15T10:00:00Z"
                },
                {
                    "type": "insert", 
                    "authorId": "user2",
                    "text": "Hello from Bob",
                    "timestamp": "2024-01-15T10:05:00Z"
                }
            ]
        }

        print(f"\n=== Testing new scraping for team '{team_id}' ===")
        print("Mock document data:")
        print(f"  - Document ID: {mock_document_data['meta']['docId']}")
        print(f"  - Users: {list(mock_document_data['users'].keys())}")
        print(f"  - Events: {len(mock_document_data['events'])}")

        # Simulate the login extraction process
        all_logins = set()
        for event in mock_document_data['events']:
            author_id = event.get('authorId')
            if author_id in mock_document_data['users']:
                user_info = mock_document_data['users'][author_id]
                author_name = user_info.get('name', f'User_{author_id}')
                all_logins.add(author_name)

        print(f"\nExtracted logins: {list(all_logins)}")

        # Simulate the login storage process
        logins_ref = db.reference(f'teams/{team_id}/logins')
        
        # Clear existing Google Docs logins (this should now work correctly)
        existing_logins = logins_ref.get() or {}
        google_docs_logins = {}
        other_logins = {}
        
        for key, login_data in existing_logins.items():
            if isinstance(login_data, dict):
                tool = login_data.get('tool')
                if tool == 'google_docs' or (tool is None and login_data.get('login') == 'unknown'):
                    google_docs_logins[key] = login_data
                else:
                    other_logins[key] = login_data
            else:
                other_logins[key] = login_data
        
        print(f"Existing logins to clear: {len(google_docs_logins)}")
        print(f"Other logins to preserve: {len(other_logins)}")
        
        # Create new logins for current document
        logins_updates = {}
        for login in all_logins:
            sanitized_key = login.replace('.', '_').replace('$', '_').replace('#', '_').replace('[', '_').replace(']', '_')
            logins_updates[sanitized_key] = {
                'login': login,
                'user_id': login,  # Placeholder until mapped
                'tool': 'google_docs'  # Mark as Google Docs login
            }
        
        # Combine other tool logins with new Google Docs logins
        all_logins_data = {**other_logins, **logins_updates}
        logins_ref.set(all_logins_data)
        
        print(f"\n✅ Updated team {team_id} with {len(logins_updates)} Google Docs logins")
        print("New logins stored:")
        for key, login_data in logins_updates.items():
            print(f"  - {key}: {login_data['login']} (tool: {login_data['tool']})")
        
        return True

    except Exception as e:
        print(f"❌ Error testing new scraping: {e}")
        return False

if __name__ == "__main__":
    import sys
    team_id = sys.argv[1] if len(sys.argv) > 1 else "vitals"
    test_new_scraping(team_id)
