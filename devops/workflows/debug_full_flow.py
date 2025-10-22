import requests
import json
import time

def debug_full_flow():
    """
    Debug the full scraping and posting flow.
    """
    try:
        print("=== Debugging Full Flow ===")
        
        # Step 1: Test scraping server
        print("\n1. Testing scraping server...")
        try:
            response = requests.get('http://localhost:8787/api/replay', timeout=5)
            print(f"   Scraping server status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            print("   ❌ Scraping server not running on localhost:8787")
            return False
        except Exception as e:
            print(f"   ❌ Scraping server error: {e}")
            return False
        
        # Step 2: Test backend server
        print("\n2. Testing backend server...")
        try:
            response = requests.get('http://localhost:3000/api/health', timeout=5)
            print(f"   Backend server status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            print("   ❌ Backend server not running on localhost:3000")
            return False
        except Exception as e:
            print(f"   ❌ Backend server error: {e}")
            return False
        
        # Step 3: Test posting endpoint
        print("\n3. Testing posting endpoint...")
        test_doc = {
            "meta": {
                "docId": "test_document_debug",
                "url": "https://docs.google.com/document/d/test_document_debug/edit"
            },
            "users": {
                "user1": {"name": "Debug User 1", "anonymous": False},
                "user2": {"name": "Debug User 2", "anonymous": False}
            },
            "events": [
                {
                    "type": "insert",
                    "authorId": "user1",
                    "text": "Debug content 1",
                    "timestamp": "2024-01-15T10:00:00Z"
                }
            ]
        }
        
        payload = {
            "team_id": "vitals",
            "doc": test_doc
        }
        
        try:
            response = requests.post(
                'http://localhost:3000/api/google_docs/post',
                headers={'Content-Type': 'application/json'},
                json=payload,
                timeout=30
            )
            print(f"   Posting response: {response.status_code}")
            print(f"   Response text: {response.text}")
            
            if response.ok:
                print("   ✅ Posting successful!")
                
                # Step 4: Check if data was posted
                print("\n4. Checking posted data...")
                time.sleep(2)  # Wait for database write
                
                # Check contributions
                try:
                    contrib_response = requests.get('http://localhost:3000/api/contributions/all?team_id=vitals', timeout=10)
                    if contrib_response.ok:
                        contrib_data = contrib_response.json()
                        print(f"   Contributions found: {len(contrib_data)}")
                        if contrib_data:
                            print(f"   Sample contribution: {contrib_data[0]}")
                    else:
                        print(f"   ❌ Failed to fetch contributions: {contrib_response.status_code}")
                except Exception as e:
                    print(f"   ❌ Error fetching contributions: {e}")
                
                # Check logins
                try:
                    logins_response = requests.get('http://localhost:3000/api/teams/logins?team_id=vitals', timeout=10)
                    if logins_response.ok:
                        logins_data = logins_response.json()
                        print(f"   Logins found: {len(logins_data)}")
                        if logins_data:
                            print(f"   Sample logins: {logins_data}")
                    else:
                        print(f"   ❌ Failed to fetch logins: {logins_response.status_code}")
                except Exception as e:
                    print(f"   ❌ Error fetching logins: {e}")
                
            else:
                print(f"   ❌ Posting failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error testing posting: {e}")
            return False
        
        print("\n✅ Full flow debug completed")
        return True
        
    except Exception as e:
        print(f"❌ Error in full flow debug: {e}")
        return False

if __name__ == "__main__":
    debug_full_flow()
