import requests
import json

def test_mapping_posting():
    """
    Test if the mapping posting is working correctly.
    """
    try:
        print("=== Testing Mapping Posting ===")
        
        # Test mapping data
        test_mappings = {
            "Alice Johnson": "alice@example.com",
            "Bob Smith": "bob@example.com"
        }
        
        payload = {
            "mappings": test_mappings
        }
        
        print(f"Testing mapping posting for team: vitals")
        print(f"Mappings: {test_mappings}")
        
        try:
            response = requests.post(
                'http://localhost:3000/api/teams/map-logins?team_id=vitals',
                headers={'Content-Type': 'application/json'},
                json=payload,
                timeout=30
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response text: {response.text}")
            
            if response.ok:
                print("✅ Mapping posting successful!")
                
                # Check if mappings were saved
                import time
                time.sleep(2)
                
                # Check logins
                try:
                    logins_response = requests.get('http://localhost:3000/api/teams/logins?team_id=vitals', timeout=10)
                    if logins_response.ok:
                        logins_data = logins_response.json()
                        print(f"Logins after mapping: {logins_data}")
                        
                        # Check if mappings were applied
                        for login, user_id in test_mappings.items():
                            if login in logins_data:
                                print(f"✅ Mapping found: {login} -> {user_id}")
                            else:
                                print(f"❌ Mapping not found: {login}")
                    else:
                        print(f"❌ Failed to fetch logins: {logins_response.status_code}")
                except Exception as e:
                    print(f"❌ Error fetching logins: {e}")
                
            else:
                print(f"❌ Mapping posting failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing mapping posting: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error in mapping posting test: {e}")
        return False

if __name__ == "__main__":
    test_mapping_posting()
