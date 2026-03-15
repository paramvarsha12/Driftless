import os
import resend
from datetime import datetime

resend.api_key = os.getenv("RESEND_API_KEY")

def get_severity_color(severity: str) -> str:
    colors = {
        "critical": "#f85149",
        "high": "#ff7b72",
        "medium": "#d29922",
        "low": "#3fb950"
    }
    return colors.get(severity.lower(), "#8b949e")

def get_health_color(score: int) -> str:
    if score > 80:
        return "#3fb950"
    elif score >= 60:
        return "#d29922"
    return "#f85149"

def build_digest_html(username: str, results: list) -> str:
    total_repos = len(results)
    critical_count = sum(
        1 for r in results
        for f in (r.get("findings") or [])
        if f.get("severity") == "critical"
    )
    avg_score = round(sum(r.get("health_score", 0) for r in results) / total_repos) if total_repos else 0
    avg_color = get_health_color(avg_score)
    date_str = datetime.now().strftime("%B %d, %Y")

    repo_cards = ""
    for r in results:
        score = r.get("health_score", 0)
        score_color = get_health_color(score)
        findings = r.get("findings") or []
        findings_html = ""
        for f in findings[:3]:
            sc = get_severity_color(f.get("severity", "low"))
            findings_html += f"""
            <tr>
              <td style="padding: 10px 16px; border-bottom: 1px solid #21262d;">
                <span style="display:inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: {sc}20; color: {sc}; margin-right: 8px;">{f.get("severity","")}</span>
                <span style="color: #c9d1d9; font-size: 13px;">{f.get("title","")}</span>
              </td>
              <td style="padding: 10px 16px; border-bottom: 1px solid #21262d; color: #8b949e; font-size: 12px; white-space: nowrap;">{f.get("estimatedTime","")}</td>
            </tr>
            """
        if not findings_html:
            findings_html = '<tr><td colspan="2" style="padding: 10px 16px; color: #3fb950; font-size: 13px;">✓ No issues found</td></tr>'

        repo_cards += f"""
        <div style="background: #161b22; border: 1px solid #21262d; border-radius: 8px; margin-bottom: 16px; overflow: hidden;">
          <div style="padding: 14px 16px; border-bottom: 1px solid #21262d; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="color: #58a6ff; font-size: 14px; font-weight: 600;">{r.get("repo_name","")}</span>
              <span style="color: #8b949e; font-size: 12px; margin-left: 8px;">{r.get("repo_full_name","")}</span>
            </div>
            <span style="color: {score_color}; font-size: 18px; font-weight: 700;">{score}<span style="font-size: 12px; color: #8b949e;">/100</span></span>
          </div>
          <div style="padding: 10px 16px; background: #0d1117; font-size: 12px; color: #8b949e; font-style: italic; border-bottom: 1px solid #21262d;">
            {r.get("summary","")[:200]}...
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            {findings_html}
          </table>
        </div>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="margin: 0; padding: 0; background: #010409; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; padding: 40px 20px;">

        <!-- Header -->
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #3fb950;"></div>
            <span style="color: #3fb950; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Driftless Weekly Digest</span>
          </div>
          <h1 style="color: #e6edf3; font-size: 28px; font-weight: 700; margin: 0 0 4px;">Good morning, {username}.</h1>
          <p style="color: #8b949e; font-size: 14px; margin: 0;">{date_str} · Weekly codebase health report</p>
        </div>

        <!-- Stats -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px;">
          <div style="background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #e6edf3;">{total_repos}</div>
            <div style="font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Repos Scanned</div>
          </div>
          <div style="background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: {avg_color};">{avg_score}</div>
            <div style="font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Avg Health Score</div>
          </div>
          <div style="background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: {'#f85149' if critical_count > 0 else '#3fb950'};">{critical_count}</div>
            <div style="font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Critical Issues</div>
          </div>
        </div>

        <!-- Repo Reports -->
        <h2 style="color: #e6edf3; font-size: 16px; font-weight: 600; margin: 0 0 16px;">Repository Reports</h2>
        {repo_cards}

        <!-- Footer -->
        <div style="border-top: 1px solid #21262d; padding-top: 24px; margin-top: 32px; text-align: center;">
          <p style="color: #484f58; font-size: 12px; margin: 0 0 8px;">Driftless · AI-powered codebase health monitoring</p>
          <p style="color: #484f58; font-size: 11px; margin: 0;">You're receiving this because you connected your GitHub to Driftless.</p>
        </div>

      </div>
    </body>
    </html>
    """
    return html

def send_digest_email(to_email: str, username: str, results: list) -> bool:
    try:
        html = build_digest_html(username, results)
        resend.Emails.send({
            "from": "Driftless <onboarding@resend.dev>",
            "to": to_email,
            "subject": f"🛡️ Your weekly codebase digest — {datetime.now().strftime('%B %d')}",
            "html": html
        })
        print(f"Digest sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send digest: {e}")
        return False

def send_analysis_complete_email(to_email: str, username: str, result: dict) -> bool:
    score = result.get("health_score", 0)
    score_color = get_health_color(score)
    repo_name = result.get("repo_name", "")
    findings = result.get("findings") or []

    findings_html = ""
    for f in findings[:5]:
        sc = get_severity_color(f.get("severity", "low"))
        findings_html += f"""
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #21262d;">
            <span style="display:inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: {sc}20; color: {sc}; margin-right: 8px;">{f.get("severity","")}</span>
            <span style="color: #c9d1d9; font-size: 13px;">{f.get("title","")}</span>
          </td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #21262d; color: #8b949e; font-size: 12px;">{f.get("estimatedTime","")}</td>
        </tr>
        """

    if not findings_html:
        findings_html = '<tr><td colspan="2" style="padding: 12px 16px; color: #3fb950;">✓ No vulnerabilities found — this repo is clean!</td></tr>'

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background: #010409; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 580px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #3fb950;"></div>
            <span style="color: #3fb950; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Analysis Complete</span>
          </div>
          <h1 style="color: #e6edf3; font-size: 24px; font-weight: 700; margin: 0 0 4px;">{repo_name}</h1>
          <p style="color: #8b949e; font-size: 13px; margin: 0;">Analysis finished · {datetime.now().strftime("%B %d, %Y at %H:%M")}</p>
        </div>

        <div style="background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 48px; font-weight: 700; color: {score_color};">{score}</div>
          <div style="font-size: 13px; color: #8b949e; margin-top: 4px;">Health Score out of 100</div>
          <div style="font-size: 14px; font-weight: 600; color: {score_color}; margin-top: 8px;">
            {'Healthy' if score > 80 else 'Needs Attention' if score >= 60 else 'Critical'}
          </div>
        </div>

        <div style="background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
          <p style="color: #8b949e; font-size: 13px; font-style: italic; margin: 0;">"{result.get("summary","")}"</p>
        </div>

        <h3 style="color: #e6edf3; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Findings</h3>
        <div style="background: #161b22; border: 1px solid #21262d; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            {findings_html}
          </table>
        </div>

        <div style="border-top: 1px solid #21262d; padding-top: 20px; text-align: center;">
          <p style="color: #484f58; font-size: 12px; margin: 0;">Driftless · AI-powered codebase health monitoring</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        resend.Emails.send({
            "from": "Driftless <onboarding@resend.dev>",
            "to": to_email,
            "subject": f"✅ Analysis complete: {repo_name} scored {score}/100",
            "html": html
        })
        print(f"Analysis email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send analysis email: {e}")
        return False