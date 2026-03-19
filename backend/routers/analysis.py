from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
import jwt, os

load_dotenv(Path(__file__).parent.parent / ".env")

from database import get_db, User, AnalysisResult, Repository
from services.audit import clone_and_audit_repo as run_audit
from services.gemini import analyze_audit_results as analyze_with_gemini
from email_service import send_analysis_complete_email

router = APIRouter()

class AnalysisRequest(BaseModel):
    repo_full_name: str

class ChatRequest(BaseModel):
    repo_context: dict
    message: str
    history: list = []

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        jwt_secret = os.getenv("JWT_SECRET")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/run")
async def run_analysis(
    request: AnalysisRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo_full_name = request.repo_full_name
    username = user.get("username")

    try:
        audit_results = await run_audit(repo_full_name)
        if not audit_results:
            raise Exception("Audit failed — could not clone repo")

        analysis = await analyze_with_gemini(audit_results)
        if not analysis:
            raise Exception("Gemini analysis failed")

        repo_id = str(abs(hash(repo_full_name)) % (10**9))
        repo_name = repo_full_name.split("/")[-1]

        result = AnalysisResult(
            repo_id=repo_id,
            username=username,
            repo_full_name=repo_full_name,
            health_score=analysis.get("healthScore", 0),
            summary=analysis.get("summary", ""),
            findings=analysis.get("findings", []),
            raw_audit=audit_results,
            analyzed_at=datetime.utcnow()
        )
        db.add(result)

        repo = db.query(Repository).filter(Repository.id == repo_id).first()
        if not repo:
            repo = Repository(
                id=repo_id,
                username=username,
                name=repo_name,
                full_name=repo_full_name,
            )
            db.add(repo)
        db.commit()

        db_user = db.query(User).filter(User.username == username).first()
        if db_user and db_user.email:
            email_data = {
                "repo_name": repo_name,
                "repo_full_name": repo_full_name,
                "health_score": analysis.get("healthScore", 0),
                "summary": analysis.get("summary", ""),
                "findings": analysis.get("findings", []),
            }
            send_analysis_complete_email(db_user.email, username, email_data)

        return {
            "healthScore": analysis.get("healthScore"),
            "summary": analysis.get("summary"),
            "findings": analysis.get("findings"),
            "generatedAt": datetime.utcnow().strftime("%m/%d/%Y"),
            "repoId": repo_id,
        }

    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{username}")
def get_history(username: str, db: Session = Depends(get_db)):
    results = db.query(AnalysisResult).filter(
        AnalysisResult.username == username
    ).order_by(AnalysisResult.analyzed_at.desc()).all()
    return results

@router.post("/send-test-digest")
async def send_test_digest(user=Depends(get_current_user), db: Session = Depends(get_db)):
    username = user.get("username")
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user or not db_user.email:
        raise HTTPException(status_code=400, detail="No email found for user")

    results_raw = db.query(AnalysisResult).filter(
        AnalysisResult.username == username
    ).order_by(AnalysisResult.analyzed_at.desc()).all()

    seen = {}
    for r in results_raw:
        if r.repo_id not in seen:
            seen[r.repo_id] = r

    if not seen:
        raise HTTPException(status_code=400, detail="No analyses found. Run some analyses first.")

    results_for_email = [
        {
            "repo_id": r.repo_id,
            "repo_name": r.repo_full_name.split("/")[-1],
            "repo_full_name": r.repo_full_name,
            "health_score": r.health_score,
            "summary": r.summary,
            "findings": r.findings,
        }
        for r in seen.values()
    ]

    from email_service import send_digest_email
    success = send_digest_email(db_user.email, username, results_for_email)
    if success:
        return {"message": f"Test digest sent to {db_user.email}"}
    raise HTTPException(status_code=500, detail="Failed to send digest")

@router.post("/chat")
async def chat_with_agent(
    request: ChatRequest,
    user=Depends(get_current_user)
):
    try:
        from google import genai
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

        repo = request.repo_context
        findings_text = ""
        for i, f in enumerate(repo.get("findings", [])):
            findings_text += f"\n{i+1}. [{f.get('severity','').upper()}] {f.get('title','')} — Fix: {f.get('fix','')} — Estimated time: {f.get('estimatedTime','')}"

        system_prompt = f"""You are the Driftless security agent for the repository '{repo.get('repo_name')}'.
Health score: {repo.get('healthScore')}/100
Summary: {repo.get('summary')}
Findings:{findings_text if findings_text else ' None found — this repo is clean.'}

Answer questions about this specific repository's security findings, vulnerabilities, and fixes.
Be concise, direct, and actionable. Use plain text only, no markdown formatting."""

        history_text = ""
        for msg in request.history[-6:]:
            role = "User" if msg.get("role") == "user" else "Agent"
            history_text += f"\n{role}: {msg.get('content','')}"

        full_prompt = f"{system_prompt}\n\nConversation:{history_text}\n\nUser: {request.message}\nAgent:"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt
        )

        return {"response": response.text.strip()}

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))