import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import RubiksCube from '../components/RubiksCube'

export default function Landing() {
  const navigate = useNavigate()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)

  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#010409',
      fontFamily: "'DM Sans', sans-serif",
      overflowX: 'hidden',
      color: 'white'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav { 
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          border-bottom: 1px solid #21262d;
          backdrop-filter: blur(20px);
          background: rgba(1,4,9,0.85);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'DM Serif Display', serif;
          font-size: 22px; letter-spacing: -0.5px; color: white;
        }
        .logo-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #3fb950; box-shadow: 0 0 12px #3fb950;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
        .nav-right { display: flex; align-items: center; gap: 16px; }
        .btn-ghost {
          background: none; border: none; color: #8b949e;
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          cursor: pointer; padding: 8px 16px; border-radius: 8px; transition: color 0.2s;
        }
        .btn-ghost:hover { color: #e6edf3; }
        .btn-primary {
          background: #e6edf3; color: #010409; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
        }
        .btn-primary:hover { background: white; transform: translateY(-1px); }
        .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 120px 48px 80px; position: relative; text-align: center;
        }
        .cursor-glow {
          position: fixed; pointer-events: none; z-index: 0;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(63,185,80,0.06) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          transition: left 0.3s ease, top 0.3s ease;
        }
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 100px;
          border: 1px solid rgba(63,185,80,0.3);
          background: rgba(63,185,80,0.08);
          font-size: 12px; color: #8b949e;
          margin-bottom: 32px; letter-spacing: 0.5px; text-transform: uppercase;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #3fb950; animation: pulse 2s ease-in-out infinite;
        }
        .hero-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(52px, 7vw, 96px);
          line-height: 1.0; letter-spacing: -2px;
          margin-bottom: 24px; max-width: 900px;
        }
        .hero-title em { font-style: italic; color: #3fb950; }
        .hero-sub {
          font-size: 18px; line-height: 1.7; color: #8b949e;
          max-width: 520px; margin: 0 auto 48px; font-weight: 300;
        }
        .hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-cta-primary {
          background: #238636; color: white; border: 1px solid #2ea043;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
          padding: 14px 28px; border-radius: 10px; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 0 32px rgba(35,134,54,0.3);
        }
        .btn-cta-primary:hover { background: #2ea043; transform: translateY(-2px); box-shadow: 0 0 48px rgba(35,134,54,0.4); }
        .btn-cta-ghost {
          background: rgba(255,255,255,0.03); border: 1px solid #21262d;
          color: #8b949e; font-family: 'DM Sans', sans-serif;
          font-size: 15px; padding: 14px 28px; border-radius: 10px; cursor: pointer; transition: all 0.2s;
        }
        .btn-cta-ghost:hover { background: #161b22; border-color: #30363d; color: #e6edf3; }
        .features { padding: 0 48px 120px; max-width: 1100px; margin: 0 auto; }
        .features-label {
          text-align: center; font-size: 11px; letter-spacing: 3px;
          text-transform: uppercase; color: #484f58; margin-bottom: 64px;
        }
        .features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: #21262d;
          border: 1px solid #21262d; border-radius: 16px; overflow: hidden;
        }
        .feature-card {
          background: #0d1117; padding: 40px 36px;
          position: relative; overflow: hidden; transition: background 0.3s;
        }
        .feature-card:hover { background: #161b22; }
        .feature-number {
          font-family: 'DM Serif Display', serif; font-size: 48px;
          color: rgba(255,255,255,0.03); position: absolute; top: 20px; right: 24px; line-height: 1;
        }
        .feature-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(63,185,80,0.1); border: 1px solid rgba(63,185,80,0.2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px; font-size: 18px;
        }
        .feature-title { font-size: 16px; font-weight: 500; margin-bottom: 10px; color: #e6edf3; letter-spacing: -0.3px; }
        .feature-desc { font-size: 14px; line-height: 1.7; color: #8b949e; font-weight: 300; }
        .stats-section {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: #21262d;
          border: 1px solid #21262d; border-radius: 16px; overflow: hidden;
        }
        .stat-item { background: #0d1117; padding: 48px 40px; text-align: center; }
        .stat-number {
          font-family: 'DM Serif Display', serif; font-size: 56px;
          color: #e6edf3; letter-spacing: -2px; line-height: 1; margin-bottom: 8px;
        }
        .stat-number span { color: #3fb950; }
        .stat-label { font-size: 13px; color: #484f58; text-transform: uppercase; letter-spacing: 1.5px; }
        .how-section { padding: 0 48px 120px; max-width: 1100px; margin: 0 auto; }
        .section-label { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #484f58; margin-bottom: 16px; }
        .section-title { font-family: 'DM Serif Display', serif; font-size: 48px; letter-spacing: -1.5px; line-height: 1.1; color: #e6edf3; }
        .section-title em { font-style: italic; color: #3fb950; }
        .steps {
          display: flex; flex-direction: column; gap: 1px;
          background: #21262d;
          border: 1px solid #21262d; border-radius: 16px; overflow: hidden;
          margin-top: 48px;
        }
        .step { background: #0d1117; padding: 36px 40px; display: flex; align-items: flex-start; gap: 32px; transition: background 0.2s; }
        .step:hover { background: #161b22; }
        .step-num { font-family: 'DM Serif Display', serif; font-size: 32px; color: rgba(63,185,80,0.25); flex-shrink: 0; line-height: 1; margin-top: 4px; }
        .step-title { font-size: 16px; font-weight: 500; color: #e6edf3; margin-bottom: 6px; letter-spacing: -0.3px; }
        .step-desc { font-size: 14px; line-height: 1.7; color: #8b949e; font-weight: 300; }
        .step-tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; letter-spacing: 0.5px; flex-shrink: 0; align-self: center; }
        .cta-section { padding: 0 48px 120px; max-width: 1100px; margin: 0 auto; }
        .cta-box {
          background: #0d1117; border: 1px solid #21262d;
          border-radius: 20px; padding: 80px 60px; text-align: center; position: relative; overflow: hidden;
        }
        .cta-box::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 400px; height: 1px;
          background: linear-gradient(to right, transparent, rgba(63,185,80,0.4), transparent);
        }
        .cta-title { font-family: 'DM Serif Display', serif; font-size: 52px; letter-spacing: -2px; line-height: 1.1; margin-bottom: 20px; color: #e6edf3; }
        .cta-title em { font-style: italic; color: #3fb950; }
        .cta-sub { font-size: 16px; color: #8b949e; margin-bottom: 40px; font-weight: 300; }
        .footer {
          padding: 32px 48px; border-top: 1px solid #21262d;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-logo { font-family: 'DM Serif Display', serif; font-size: 16px; color: #484f58; }
        .footer-text { font-size: 13px; color: #484f58; }
      `}</style>

      <div className="cursor-glow" style={{ left: mousePos.x, top: mousePos.y }} />

      <nav className="nav">
        <div className="nav-logo"><svg width="20" height="20" viewBox="0 0 28 28" fill="none" style={{ display: 'inline-block' }}>
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
</svg>Driftless</div>
        <div className="nav-right">
          <button className="btn-ghost" onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}>
            How it works
          </button>
          <button className="btn-primary" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </nav>

      <section className="hero" ref={heroRef}>
        <div className="badge"><div className="badge-dot" />AI-powered codebase intelligence</div>
        <h1 className="hero-title">Your codebase is<br /><em>rotting.</em><br />You just don't know it yet.</h1>
        <p className="hero-sub">
          Driftless monitors your GitHub repositories 24/7, runs security audits, and delivers a prioritized weekly health report — every Sunday before you open your laptop.
        </p>
        <div className="hero-cta">
          <button className="btn-cta-primary" onClick={() => navigate('/login')}>
            Get started — free
          </button>
          <button className="btn-cta-ghost" onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}>
            See how it works
          </button>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px 120px' }}>
        <div className="stats-section">
          {[
            { num: '< 5', unit: 'min', label: 'To get your first report' },
            { num: '100', unit: '%', label: 'Free forever on open source' },
            { num: '0', unit: ' noise', label: 'Max 5 findings, always ranked' },
          ].map((s, i) => (
            <div className="stat-item" key={i}>
              <div className="stat-number">{s.num}<span>{s.unit}</span></div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="features">
        <div className="features-label">What Driftless does</div>
        <div className="features-grid">
          {[
            { icon: '🔍', title: 'Real Vulnerability Detection', desc: 'Clones your repo, runs npm audit and pip-audit against your actual dependencies — not estimates.', n: '01' },
            { icon: '🧠', title: 'AI Reasoning Layer', desc: "Gemini doesn't just list CVEs — it reasons about them. Is this in your auth layer? What breaks if you ignore it?", n: '02' },
            { icon: '📊', title: 'Prioritized Signal', desc: 'Maximum 5 findings per report. Ranked by real-world impact. Each with a fix command and time estimate.', n: '03' },
            { icon: '📈', title: 'Health Score', desc: 'Every repo gets a 0–100 health score. Watch it trend over time. Know exactly where you stand.', n: '04' },
            { icon: '📬', title: 'Weekly Digest', desc: 'One email every Sunday morning. Before you open Slack. Before the sprint starts. No dashboard required.', n: '05' },
            { icon: '🔐', title: 'GitHub OAuth', desc: "Connect in one click. We never store your code — just the audit results and your health score history.", n: '06' },
          ].map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-number">{f.n}</div>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px 60px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 320, height: 320 }}>
          <RubiksCube />
        </div>
      </div>

      <section className="how-section" id="how">
        <div className="section-label">The process</div>
        <h2 className="section-title">From zero to<br /><em>full visibility</em> in minutes</h2>
        <div className="steps">
          {[
            { n: '01', title: 'Connect your GitHub', desc: 'One-click OAuth. We request read access to your repos. No write permissions, ever.', tag: '30 seconds', tagColor: '#3fb950' },
            { n: '02', title: 'We clone and audit', desc: 'Driftless clones each repo into a sandboxed environment, runs npm audit and pip-audit, then discards the code.', tag: 'Automatic', tagColor: '#58a6ff' },
            { n: '03', title: 'Gemini reasons over the results', desc: "Raw vulnerability data goes to Gemini 2.5 Flash. It understands context, prioritizes risk, and writes plain-English explanations.", tag: 'AI-powered', tagColor: '#a371f7' },
            { n: '04', title: 'You get a prioritized report', desc: 'Max 5 findings. Each with a severity badge, explanation, copy-paste fix command, and time estimate. No noise.', tag: 'Actionable', tagColor: '#d29922' },
          ].map((s, i) => (
            <div className="step" key={i}>
              <div className="step-num">{s.n}</div>
              <div style={{ flex: 1 }}>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
              <div className="step-tag" style={{ background: s.tagColor + '15', color: s.tagColor, border: `1px solid ${s.tagColor}30` }}>
                {s.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-title">Stop flying<br /><em>blind.</em></h2>
          <p className="cta-sub">Connect your GitHub in 30 seconds. Your first report is ready in minutes.</p>
          <button className="btn-cta-primary" onClick={() => navigate('/login')}>
            Get started — free
          </button>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">Driftless</div>
        <div className="footer-text">Built by paramvarsha12 · 2026</div>
      </footer>
    </div>
  )
}