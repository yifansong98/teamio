import requests
import json

def test_scraping_flow():
    """
    Test the scraping flow to see what's happening.
    """
    try:
        print("=== Testing Scraping Flow ===")
        
        # Test scraping with a simple document
        test_url = "https://docs.google.com/document/d/1ABC123/edit"  # Dummy URL
        
        payload = {
            "target": test_url,
            "includeRaw": False,
            "includeChars": False,
            "download": False,
            "logoutFirst": False
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer 65678987654567887658",
            "X-Google-Token": "test_token"  # Dummy token
        }
        
        print(f"Testing scraping with URL: {test_url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        try:
            response = requests.post(
                'http://localhost:8787/api/replay',
                headers=headers,
                json=payload,
                timeout=30
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            
            if response.ok:
                data = response.json()
                print(f"✅ Scraping successful!")
                print(f"Response keys: {list(data.keys())}")
                
                # Check if we have the expected data structure
                if 'users' in data:
                    print(f"Users found: {list(data['users'].keys())}")
                if 'events' in data:
                    print(f"Events found: {len(data['events'])}")
                if 'meta' in data:
                    print(f"Meta data: {data['meta']}")
                
                return data
            else:
                print(f"❌ Scraping failed: {response.status_code}")
                print(f"Response text: {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            print("❌ Scraping request timed out")
            return None
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect to scraping server")
            return None
        except Exception as e:
            print(f"❌ Error during scraping: {e}")
            return None
        
    except Exception as e:
        print(f"❌ Error in scraping flow test: {e}")
        return None

if __name__ == "__main__":
    test_scraping_flow()
