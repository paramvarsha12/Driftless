from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from database import SessionLocal, User, AnalysisResult
from email_service import send_digest_email
from datetime import datetime, timedelta

scheduler = BackgroundScheduler()

def run_weekly_digest():
    print(f"[{datetime.now()}] Running weekly digest job...")
    db: Session = SessionLocal()
    try:
        users = db.query(User).filter(User.digest_enabled == True).all()
        for user in users:
            if not user.email:
                continue
            # Get latest analysis per repo for this user
            results_raw = db.query(AnalysisResult).filter(
                AnalysisResult.username == user.username
            ).order_by(AnalysisResult.analyzed_at.desc()).all()

            # Deduplicate — keep latest per repo
            seen = {}
            for r in results_raw:
                if r.repo_id not in seen:
                    seen[r.repo_id] = r

            if not seen:
                print(f"No results for {user.username}, skipping")
                continue

            results_for_email = [
                {
                    "repo_id": r.repo_id,
                    "repo_name": r.repo_full_name.split("/")[-1] if r.repo_full_name else r.repo_id,
                    "repo_full_name": r.repo_full_name,
                    "health_score": r.health_score,
                    "summary": r.summary,
                    "findings": r.findings,
                    "analyzed_at": r.analyzed_at.isoformat() if r.analyzed_at else None
                }
                for r in seen.values()
            ]

            send_digest_email(user.email, user.username, results_for_email)
            print(f"Digest sent to {user.username} ({user.email})")

    except Exception as e:
        print(f"Digest job error: {e}")
    finally:
        db.close()

def start_scheduler():
    # Run every Sunday at 08:00
    scheduler.add_job(
        run_weekly_digest,
        CronTrigger(day_of_week="sun", hour=8, minute=0),
        id="weekly_digest",
        replace_existing=True
    )
    scheduler.start()
    print("Scheduler started — weekly digest every Sunday at 08:00")

def stop_scheduler():
    scheduler.shutdown()