from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import init_db
from scheduler import start_scheduler, stop_scheduler
from routers import auth, repos, analysis
import os

load_dotenv()

app = FastAPI(title="Driftless API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5174")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    start_scheduler()
    print("Driftless API started")

@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()

app.include_router(auth.router, prefix="/auth")
app.include_router(repos.router, prefix="/repos")
app.include_router(analysis.router, prefix="/analysis")

@app.get("/health")
def health():
    return {"status": "ok"}