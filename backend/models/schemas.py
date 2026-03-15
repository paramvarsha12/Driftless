from pydantic import BaseModel
from typing import List, Optional

class GitHubUser(BaseModel):
    id: int
    login: str
    email: Optional[str] = None
    avatar_url: str
    name: Optional[str] = None

class GitHubRepo(BaseModel):
    id: int
    name: str
    full_name: str
    language: Optional[str] = None
    private: bool
    updated_at: str

class AnalysisRequest(BaseModel):
    repo_full_name: str
    github_token: str

class Finding(BaseModel):
    rank: int
    severity: str
    title: str
    explanation: str
    fix: str
    urgency: str
    estimatedTime: str

class AnalysisResponse(BaseModel):
    healthScore: int
    summary: str
    findings: List[Finding]

class JWTToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
