import requests
import json

def test_posting():
    """
    Test if the backend posting endpoint is working.
    """
    try:
        # Test data
        test_doc = {
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
        
        payload = {
            "team_id": "vitals",
            "doc": test_doc
        }
        
        print("Testing backend posting...")
        print(f"Payload: team_id={payload['team_id']}, doc keys={list(payload['doc'].keys())}")
        
        response = requests.post(
            'http://localhost:3000/api/google_docs/post',
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=30
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.ok:
            print("✅ Backend posting successful!")
            return True
        else:
            print(f"❌ Backend posting failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Is it running on localhost:3000?")
        return False
    except Exception as e:
        print(f"❌ Error testing posting: {e}")
        return False

if __name__ == "__main__":
    test_posting()
