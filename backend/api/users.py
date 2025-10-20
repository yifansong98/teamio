from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from core.firebase import db_ref

router = APIRouter(prefix="/users")

@router.get("/")
async def get_user(email: str = Query(...)):
    try:
        ref = db_ref(f'users/')
        users = ref.get() or {}
        for user_id, user_info in users.items():
            if user_info.get('email') == email:
                return JSONResponse(content={"user_id": user_id, **user_info})
        return JSONResponse(status_code=404, content={"error": "User not found"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})