from fastapi import APIRouter, Query
from fastapi import UploadFile, File, Form, HTTPException
from core.firebase import db_ref

router = APIRouter(prefix="/log_data")

# Summary: Fetch detailed log_data record by tool/metric/contribution_id.
# Query params example: ?tool=google_docs&metric=revision&contribution_id=UUID
# Returns: Full log_data object or 404 if not found.
@router.get("/")
async def get_log_data(tool: str, metric: str, contribution_id: str):
    try:
        ref = db_ref(f'log_data/{tool}/{metric}/{contribution_id}')
        data = ref.get()
        if not data:
            raise HTTPException(status_code=404, detail="Log data not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))