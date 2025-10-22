import sys
import os
sys.path.append('../../teamio-backend/scripts')
sys.path.append('../../teamio-backend/helpers')

def test_processing_direct():
    """
    Test the processing functions directly to see if they're working.
    """
    try:
        print("=== Testing Processing Functions Directly ===")
        
        # Test data
        test_doc = {
            "meta": {
                "docId": "test_document_direct",
                "url": "https://docs.google.com/document/d/test_document_direct/edit"
            },
            "users": {
                "user1": {"name": "Direct User 1", "anonymous": False},
                "user2": {"name": "Direct User 2", "anonymous": False}
            },
            "events": [
                {
                    "type": "insert",
                    "authorId": "user1",
                    "text": "Direct content 1",
                    "timestamp": "2024-01-15T10:00:00Z"
                },
                {
                    "type": "insert", 
                    "authorId": "user2",
                    "text": "Direct content 2",
                    "timestamp": "2024-01-15T10:05:00Z"
                }
            ]
        }
        
        print(f"Input document keys: {list(test_doc.keys())}")
        print(f"Events count: {len(test_doc.get('events', []))}")
        print(f"Users: {list(test_doc.get('users', {}).keys())}")
        
        # Test processing functions
        print("\n=== Testing process_docs_revisions ===")
        try:
            from post_docs_data import process_docs_revisions
            revs = process_docs_revisions(test_doc)
            print(f"Revisions processed: {len(revs)}")
            if revs:
                print(f"First revision: {revs[0]}")
                print(f"Revision team_id: {revs[0].get('team_id')}")
            else:
                print("No revisions found!")
        except Exception as e:
            print(f"Error in process_docs_revisions: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n=== Testing process_docs_comments ===")
        try:
            from post_docs_data import process_docs_comments
            cmts = process_docs_comments(test_doc)
            print(f"Comments processed: {len(cmts)}")
            if cmts:
                print(f"First comment: {cmts[0]}")
                print(f"Comment team_id: {cmts[0].get('team_id')}")
            else:
                print("No comments found!")
        except Exception as e:
            print(f"Error in process_docs_comments: {e}")
            import traceback
            traceback.print_exc()
        
        return True
        
    except Exception as e:
        print(f"❌ Error in direct processing test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_processing_direct()
