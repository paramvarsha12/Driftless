from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt as pyjwt
from dotenv import load_dotenv
from pathlib import Path
import httpx, os

load_dotenv(Path(__file__).parent.parent / ".env")

router = APIRouter()
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        jwt_secret = os.getenv("JWT_SECRET")
        payload = pyjwt.decode(credentials.credentials, jwt_secret, algorithms=["HS256"])
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/")
async def get_user_repos(user=Depends(get_current_user)):
    username = user.get("username")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.github.com/users/{username}/repos",
                params={"per_page": 100, "sort": "updated"},
                headers={"Accept": "application/vnd.github.v3+json"}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch repos from GitHub")
            return resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))