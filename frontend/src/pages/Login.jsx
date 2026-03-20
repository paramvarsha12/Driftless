import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', sans-serif", backgroundColor: '#0d1117' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-left {
          flex: 1; display: flex; flex-direction: column;
          justify-content: space-between; padding: 48px 64px;
          background: #0d1117; max-width: 560px;
          border-right: 1px solid #21262d;
        }
        .login-right {
          flex: 1; background: #010409; position: relative;
          overflow: hidden; display: flex; align-items: center; justify-content: center;
        }
        .right-glow {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(63,185,80,0.08) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%, -50%);
        }
        .right-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .right-content { position: relative; z-index: 10; text-align: center; padding: 48px; }
        .right-title { font-family: 'DM Serif Display', serif; font-size: 52px; line-height: 1.1; letter-spacing: -2px; color: #e6edf3; margin-bottom: 20px; }
        .right-title em { font-style: italic; color: #3fb950; }
        .right-sub { font-size: 15px; line-height: 1.7; color: #8b949e; font-weight: 300; max-width: 320px; margin: 0 auto 40px; }
        .right-stats { display: flex; gap: 40px; justify-content: center; }
        .right-stat-num { font-family: 'DM Serif Display', serif; font-size: 32px; color: #e6edf3; letter-spacing: -1px; }
        .right-stat-num span { color: #3fb950; }
        .right-stat-label { font-size: 11px; color: #484f58; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
        .logo-mark { display: flex; align-items: center; gap: 10px; font-family: 'DM Serif Display', serif; font-size: 20px; color: #e6edf3; cursor: pointer; }
        .logo-dot-light { width: 8px; height: 8px; border-radius: 50%; background: #3fb950; box-shadow: 0 0 8px #3fb950; }
        .form-area { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 48px 0; }
        .form-headline { font-family: 'DM Serif Display', serif; font-size: 36px; letter-spacing: -1px; color: #e6edf3; margin-bottom: 8px; }
        .form-sub { font-size: 14px; color: #8b949e; margin-bottom: 48px; font-weight: 300; line-height: 1.6; }
        .github-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px;
          padding: 16px 20px; background: #238636; color: white; border: 1px solid #2ea043;
          border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; margin-bottom: 16px;
          box-shadow: 0 4px 24px rgba(35,134,54,0.2);
        }
        .github-btn:hover { background: #2ea043; transform: translateY(-1px); box-shadow: 0 6px 32px rgba(35,134,54,0.3); }
        .security-note {
          display: flex; align-items: center; gap: 8px; padding: 12px 16px;
          background: #161b22; border: 1px solid #21262d; border-radius: 8px;
          margin-bottom: 32px;
        }
        .security-dot { width: 6px; height: 6px; border-radius: 50%; background: #3fb950; flex-shrink: 0; }
        .security-text { font-size: 12px; color: #8b949e; line-height: 1.5; }
        .divider { height: 1px; background: #21262d; margin-bottom: 24px; }
        .features-list { display: flex; flex-direction: column; gap: 12px; }
        .feature-item { display: flex; align-items: center; gap: 10px; }
        .feature-icon { font-size: 14px; flex-shrink: 0; }
        .feature-text { font-size: 13px; color: #8b949e; }
        .footer-note { font-size: 12px; color: #484f58; line-height: 1.6; }
        @media (max-width: 900px) {
          .login-right { display: none; }
          .login-left { max-width: 100%; padding: 32px; border-right: none; }
        }
      `}</style>

      <div className="login-left">
        <div className="logo-mark" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none" style={{ display: 'inline-block' }}>
  <rect width="28" height="28" rx="6" fill="#0d1117" stroke="#238636" stroke-width="1.5"/>
  <line x1="0" y1="9" x2="6" y2="9" stroke="#1a4731" stroke-width="1.2"/>
  <line x1="22" y1="9" x2="28" y2="9" stroke="#1a4731" stroke-width="1.2"/>
  <line x1="0" y1="19" x2="6" y2="19" stroke="#1a4731" stroke-width="1.2"/>
  <line x1="22" y1="19" x2="28" y2="19" stroke="#1a4731" stroke-width="1.2"/>
  <circle cx="6" cy="9" r="1.8" fill="#238636"/>
  <circle cx="22" cy="9" r="1.8" fill="#238636"/>
  <circle cx="6" cy="19" r="1.8" fill="#238636"/>
  <circle cx="22" cy="19" r="1.8" fill="#238636"/>
  <rect x="6" y="5" width="16" height="18" rx="4" fill="#0e4429" stroke="#238636" stroke-width="1"/>
  <text x="14" y="17" font-family="'Courier New', monospace" font-size="11" font-weight="700" fill="#3fb950" text-anchor="middle">D</text>
</svg>
          Driftless
        </div>

        <div className="form-area">
          <h1 className="form-headline">Welcome back.</h1>
          <p className="form-sub">
            Connect your GitHub account to get started. No password needed — we use GitHub OAuth so you never share credentials with us.
          </p>

          <button className="github-btn" onClick={() => window.location.href = 'https://driftless.onrender.com/auth/github'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>

          <div className="security-note">
            <div className="security-dot" />
            <span className="security-text">Read-only access · We never store your code · No write permissions</span>
          </div>

          <div className="divider" />

          <div className="features-list">
            {[
              { icon: '🔍', text: 'Scans your repos for real CVEs using npm audit and pip-audit' },
              { icon: '🧠', text: 'Gemini AI reasons over findings and prioritizes what matters' },
              { icon: '📬', text: 'Weekly digest every Sunday before you open your laptop' },
              { icon: '📊', text: 'Health score from 0–100 for every repository' },
            ].map((f, i) => (
              <div className="feature-item" key={i}>
                <span className="feature-icon">{f.icon}</span>
                <span className="feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-note">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>

      <div className="login-right">
        <div className="right-grid" />
        <div className="right-glow" />
        <div className="right-content">
          <h2 className="right-title">
            One report.<br />Every <em>Sunday.</em><br />No noise.
          </h2>
          <p className="right-sub">
            Connect your repos once. Get a prioritized security digest every week before you open your laptop.
          </p>
          <div className="right-stats">
            {[
              { num: '100', unit: '/100', label: 'Best score possible' },
              { num: '5', unit: ' max', label: 'Findings per report' },
              { num: '0', unit: ' bs', label: 'Noise filtered out' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="right-stat-num">{s.num}<span>{s.unit}</span></div>
                <div className="right-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}