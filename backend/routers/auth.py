from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx, os, jwt
from datetime import datetime, timedelta
from database import get_db, User
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env", override=False)

router = APIRouter()

@router.get("/github")
def github_login():
    client_id = os.getenv("GITHUB_CLIENT_ID")
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=read:user,user:email,repo"
    )

@router.get("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    jwt_secret = os.getenv("JWT_SECRET")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5174")

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={"client_id": client_id, "client_secret": client_secret, "code": code},
            headers={"Accept": "application/json"}
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="GitHub auth failed")

        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        github_user = user_resp.json()
        username = github_user.get("login")

        email_resp = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        emails = email_resp.json()
        primary_email = next(
            (e["email"] for e in emails if e.get("primary") and e.get("verified")),
            None
        )

        user = db.query(User).filter(User.username == username).first()
        if not user:
            user = User(
                username=username,
                email=primary_email or f"{username}@github.com",
                avatar_url=github_user.get("avatar_url"),
            )
            db.add(user)
        else:
            if primary_email:
                user.email = primary_email
            user.avatar_url = github_user.get("avatar_url")
        db.commit()

    payload = {
        "username": username,
        "email": user.email,
        "avatar": github_user.get("avatar_url"),
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    jwt_token = jwt.encode(payload, jwt_secret, algorithm="HS256")
    return RedirectResponse(f"{frontend_url}/dashboard?token={jwt_token}")