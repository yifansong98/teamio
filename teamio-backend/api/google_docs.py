from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi import UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
import json
from helpers.post_google_docs_data import post_docs_to_db

class DocsIngestBody(BaseModel):
    team_id: str
    doc: dict

router = APIRouter(prefix="/google_docs")

@router.post("/post")
async def post_google_docs_json(body: DocsIngestBody):
    try:
        print("Posting Google Docs data for team:", body.team_id)
        await run_in_threadpool(post_docs_to_db, body.doc, body.team_id)
        return {"message": "Google Docs data posted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_google_docs_file(team_id: str = Form(...), file: UploadFile = File(...)):
    try:
        raw = await file.read()
        doc_json = json.loads(raw.decode("utf-8"))
        post_docs_to_db(doc_json, team_id)
        return {"message": "Google Docs data posted (file upload)"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid upload: {e}")