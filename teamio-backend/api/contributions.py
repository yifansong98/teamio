from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from core.firebase import db_ref

router = APIRouter(prefix="/contributions")

@router.get("/all")
async def get_contributions(team_id: str = Query(...)):
    try:
        # Get contributions from contributions table
        ref = db_ref(f'contributions/{team_id}')
        raw_data = ref.get()
        contributions = list(raw_data.values()) if raw_data else []
        
        # For each contribution, fetch the detailed text from log_data
        enhanced_contributions = []
        for contrib in contributions:
            contrib_id = contrib.get('contribution_id')
            metric = contrib.get('metric', 'revision')  # Default to revision if not specified
            
            if contrib_id:
                # Try to fetch detailed data from log_data
                log_data_ref = db_ref(f'log_data/google_docs/{metric}/{contrib_id}')
                log_data = log_data_ref.get()
                
                if log_data:
                    # Merge the text and other details from log_data
                    enhanced_contrib = {
                        **contrib,  # Keep original contribution data
                        'text': log_data.get('text', ''),  # Add text from log_data
                        'word_count': log_data.get('word_count', 0),
                        'char_count': len(log_data.get('text', '')),
                        'author_id': log_data.get('author_id', contrib.get('author')),
                        'login': log_data.get('login', ''),
                        'file_name': log_data.get('file_name', ''),
                        'file_url': log_data.get('file_url', ''),
                        'quoted_text': log_data.get('quoted_text', '')  # For comments
                    }
                else:
                    # If no log_data found, keep original contribution
                    enhanced_contrib = {
                        **contrib,
                        'text': '',
                        'word_count': 0,
                        'char_count': 0
                    }
            else:
                # No contribution_id, keep original
                enhanced_contrib = {
                    **contrib,
                    'text': '',
                    'word_count': 0,
                    'char_count': 0
                }
            
            enhanced_contributions.append(enhanced_contrib)
        
        # Sort by timestamp
        enhanced_contributions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return JSONResponse(content=enhanced_contributions)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})