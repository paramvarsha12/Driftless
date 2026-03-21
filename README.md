# Driftless

> AI-powered codebase health monitor

Driftless scans your GitHub repositories for real CVEs, analyzes them with Gemini AI, and delivers a prioritized security report — every Sunday before you open your laptop.

## What it does

- Connects to your GitHub account via OAuth
- Scans repos for vulnerabilities using npm audit, pip-audit, and the OSV database
- Supports JavaScript, Python, Go, Rust, Java, Ruby, PHP, and Dart
- Generates a health score from 0–100 with AI-powered findings and fixes
- Sends an email report immediately after analysis
- Weekly digest every Sunday at 8am
- Ask the AI agent questions about your findings in real time

## Tech Stack

**Frontend:** React 18, Vite, React Router, Recharts, Three.js, Lucide React

**Backend:** Python, FastAPI, SQLAlchemy, Supabase PostgreSQL

**AI:** Gemini 2.5 Flash

**Services:** Resend (email), GitHub OAuth, OSV API

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git

### Installation
```bash
# Clone the repo
git clone https://github.com/paramvarsha12/Driftless.git
cd Driftless
```

# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Environment Variables

Create a `.env` file in the `backend` folder:
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5174
DATABASE_URL=your_supabase_connection_string
RESEND_API_KEY=your_resend_api_key
```

## Live Demo

Frontend: https://driftless-delta.vercel.app

Backend: https://driftless.onrender.com




That's the easiest way to host images for a README without adding them to the repo itself.
