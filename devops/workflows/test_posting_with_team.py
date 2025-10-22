import requests
import json

def test_posting_with_team():
    """
    Test posting with the correct team ID to verify it works.
    """
    try:
        print("=== Testing Posting with Team ID ===")
        
        # Test data
        test_doc = {
            "meta": {
                "docId": "test_document_team",
                "url": "https://docs.google.com/document/d/test_document_team/edit"
            },
            "users": {
                "user1": {"name": "Team User 1", "anonymous": False},
                "user2": {"name": "Team User 2", "anonymous": False}
            },
            "events": [
                {
                    "type": "insert",
                    "authorId": "user1",
                    "text": "Team content 1",
                    "timestamp": "2024-01-15T10:00:00Z"
                },
                {
                    "type": "insert", 
                    "authorId": "user2",
                    "text": "Team content 2",
                    "timestamp": "2024-01-15T10:05:00Z"
                }
            ]
        }
        
        payload = {
            "team_id": "vitals",
            "doc": test_doc
        }
        
        print(f"Posting with team_id: {payload['team_id']}")
        print(f"Document keys: {list(payload['doc'].keys())}")
        
        try:
            response = requests.post(
                'http://localhost:3000/api/google_docs/post',
                headers={'Content-Type': 'application/json'},
                json=payload,
                timeout=30
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response text: {response.text}")
            
            if response.ok:
                print("✅ Posting successful!")
                
                # Check if data was posted
                import time
                time.sleep(2)
                
                # Check contributions
                try:
                    contrib_response = requests.get('http://localhost:3000/api/contributions/all?team_id=vitals', timeout=10)
                    if contrib_response.ok:
                        contrib_data = contrib_response.json()
                        print(f"Contributions found: {len(contrib_data)}")
                        if contrib_data:
                            print("Sample contributions:")
                            for contrib in contrib_data[:2]:
                                print(f"  - {contrib.get('author', 'unknown')}: {contrib.get('title', 'unknown')}")
                    else:
                        print(f"❌ Failed to fetch contributions: {contrib_response.status_code}")
                except Exception as e:
                    print(f"❌ Error fetching contributions: {e}")
                
                # Check logins
                try:
                    logins_response = requests.get('http://localhost:3000/api/teams/logins?team_id=vitals', timeout=10)
                    if logins_response.ok:
                        logins_data = logins_response.json()
                        print(f"Logins found: {len(logins_data)}")
                        if logins_data:
                            print("Sample logins:")
                            for login in logins_data[:2]:
                                print(f"  - {login}")
                    else:
                        print(f"❌ Failed to fetch logins: {logins_response.status_code}")
                except Exception as e:
                    print(f"❌ Error fetching logins: {e}")
                
            else:
                print(f"❌ Posting failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing posting: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error in posting test: {e}")
        return False

if __name__ == "__main__":
    test_posting_with_team()
