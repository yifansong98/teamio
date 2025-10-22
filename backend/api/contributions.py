from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from core.firebase import db_ref

router = APIRouter(prefix="/contributions")

@router.get("/all")
async def get_contributions(team_id: str = Query(...)):
    try:
        ref = db_ref(f'contributions/{team_id}')
        raw_data = ref.get()
        contributions = list(raw_data.values()) if raw_data else []
        contributions.sort(key=lambda x: x['timestamp'], reverse=True)
        return JSONResponse(content=contributions)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})