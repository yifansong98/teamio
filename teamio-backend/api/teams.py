from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
from core.firebase import db_ref

router = APIRouter(prefix="/teams")

@router.get("/logins")
async def get_team_logins(team_id: str = Query(...)):
    try:
        ref = db_ref(f'teams/{team_id}/logins')
        logins_data = ref.get() or {}
        # Convert to array format expected by frontend
        logins = list(logins_data.keys())
        return JSONResponse(content=logins)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/map-logins")
async def update_team_logins(team_id: str = Query(...), request: Request = None):
    try:
        if not request:
            return JSONResponse(status_code=400, content={"error": "No request body"})
        
        body = await request.json()
        mappings = body.get("mappings", {})
        
        if not mappings:
            return JSONResponse(status_code=400, content={"error": "No mappings provided"})
        
        # Update the team logins with the mappings
        ref = db_ref(f'teams/{team_id}/logins')
        updates = {}
        for login, user_id in mappings.items():
            updates[login] = {"login": login, "user_id": user_id}
        
        ref.update(updates)
        return JSONResponse(content={"message": "Mappings updated successfully"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/members")
async def get_team_members(team_id: str = Query(...)):
    try:
        ref = db_ref(f'teams/{team_id}/members')
        students_data = ref.get() or {}
        print(f"Fetched user_ids: {students_data.keys()}")
        user_ids = list(students_data.keys())

        members = []
        for user_id in user_ids:
            user_ref = db_ref(f'users/{user_id}')
            user_info = user_ref.get()
            if user_info:
                members.append({"user_id": user_id, **user_info})

        return JSONResponse(content=members)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/mapped-users")
async def get_mapped_users(team_id: str = Query(...)):
    try:
        ref = db_ref(f'teams/{team_id}/logins')
        logins_data = ref.get() or {}
        # Return the mapping of logins to user_ids
        mapped_users = {}
        for login_key, login_info in logins_data.items():
            if isinstance(login_info, dict) and 'user_id' in login_info:
                users_ref = db_ref(f'users/{login_info["user_id"]}')
                user_data = users_ref.get() or {}
                user_data['user_id'] = login_info['user_id']
                mapped_users[login_info['login']] = user_data
        return JSONResponse(content=mapped_users)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})