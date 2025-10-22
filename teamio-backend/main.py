from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.firebase import initialize_firebase
from api.contributions import router as contributions_router
from api.google_docs import router as google_docs_router
from api.log_data import router as log_data_router
from api.reflections import router as reflections_router
from api.teams import router as teams_router
from api.users import router as users_router

# Initialize Firebase
initialize_firebase()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(contributions_router, prefix="/api")
app.include_router(google_docs_router, prefix="/api")
app.include_router(log_data_router, prefix="/api")
app.include_router(reflections_router, prefix="/api")
app.include_router(teams_router, prefix="/api")
app.include_router(users_router, prefix="/api")