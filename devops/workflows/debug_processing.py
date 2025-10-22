import sys
import os
sys.path.append('../../teamio-backend')

from helpers.post_google_docs_data import process_docs_revisions, process_docs_comments, post_docs_to_db

def debug_processing():
    """
    Debug the document processing to see what's happening.
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
        
        print("=== Debugging Document Processing ===")
        print(f"Input document keys: {list(test_doc.keys())}")
        print(f"Events count: {len(test_doc.get('events', []))}")
        print(f"Users: {list(test_doc.get('users', {}).keys())}")
        
        # Test processing
        print("\n=== Processing Revisions ===")
        revs = process_docs_revisions(test_doc)
        print(f"Revisions processed: {len(revs)}")
        if revs:
            print(f"First revision: {revs[0]}")
        else:
            print("No revisions found!")
        
        print("\n=== Processing Comments ===")
        cmts = process_docs_comments(test_doc)
        print(f"Comments processed: {len(cmts)}")
        if cmts:
            print(f"First comment: {cmts[0]}")
        else:
            print("No comments found!")
        
        print(f"\n=== Total Contributions ===")
        total_contributions = revs + cmts
        print(f"Total contributions: {len(total_contributions)}")
        
        if total_contributions:
            print("Sample contribution:")
            print(json.dumps(total_contributions[0], indent=2))
        else:
            print("❌ No contributions generated!")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error in processing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import json
    debug_processing()
