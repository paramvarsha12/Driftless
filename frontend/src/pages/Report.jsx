import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getToken, chatWithAgent } from '../store/api'
import {
  ChevronLeft, ChevronDown, ChevronUp, Clock, Activity,
  LayoutDashboard, FileText, Settings,
  CheckCircle2, Terminal, Loader2, Circle, Printer, X
} from 'lucide-react'

const getHealthColor = (score) => {
  if (score > 80) return '#3fb950'
  if (score >= 60) return '#d29922'
  return '#f85149'
}

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return '#f85149'
    case 'high': return '#ff7b72'
    case 'medium': return '#d29922'
    case 'low': return '#3fb950'
    default: return '#8b949e'
  }
}

function HealthCircle({ score, size = 96 }) {
  const radius = size * 0.44
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = getHealthColor(score)
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} stroke="#21262d" strokeWidth={size*0.08} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={size*0.08} fill="none"
          strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontWeight: 700, color: 'white', fontSize: size * 0.22 }}>{score}</span>
      </div>
    </div>
  )
}

function Sidebar({ navigate, user }) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Reports', path: '/history', active: true },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]
  return (
    <div className="no-print" style={{
      width: 240, display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 10,
      backgroundColor: '#0d1117', borderRight: '1px solid #21262d'
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="28" height="28" rx="6" fill="#0d1117" stroke="#21262d" stroke-width="1"/>
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
        <span style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3', letterSpacing: '-0.3px' }}>Driftless</span>
      </div>
      <nav style={{ flex: 1, padding: '8px' }}>
        {navItems.map(({ icon: Icon, label, path, active }) => (
          <button key={label} onClick={() => navigate(path)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 12px', borderRadius: 6, fontSize: 14,
            border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
            backgroundColor: active ? '#161b22' : 'transparent',
            color: active ? '#e6edf3' : '#8b949e', transition: 'all 0.15s'
          }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#161b22'; e.currentTarget.style.color = '#e6edf3' }}}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b949e' }}}
          >
            <Icon size={16} />{label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #21262d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.avatar
            ? <img src={user.avatar} alt={user.username} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #30363d' }} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#238636', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              </div>
          }
          <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3' }}>{user?.username || '...'}</div>
        </div>
      </div>
    </div>
  )
}

function ReportChat({ report, repo, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Driftless agent for ${repo?.name}. This repo scored ${report?.healthScore}/100 with ${report?.findings?.length || 0} finding(s). Ask me anything about the findings, fixes, or priorities.`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const repoContext = {
        repo_name: repo?.name,
        healthScore: report?.healthScore,
        summary: report?.summary,
        findings: report?.findings || []
      }
      const history = messages.slice(-8)
      const data = await chatWithAgent(repoContext, userMsg.content, history)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'Which finding is most urgent?',
    'How long will all fixes take?',
    'Explain the top vulnerability',
    'What should I fix first?'
  ]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, height: '100%', width: 400, zIndex: 50,
        backgroundColor: '#0d1117', borderLeft: '1px solid #21262d',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#238636', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={13} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>Ask the Agent</div>
              <div style={{ fontSize: 11, color: '#8b949e' }}>{repo?.name} · {report?.healthScore}/100</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                backgroundColor: msg.role === 'user' ? '#238636' : '#161b22',
                border: msg.role === 'user' ? '1px solid #2ea043' : '1px solid #21262d',
                fontSize: 13, lineHeight: 1.6,
                color: msg.role === 'user' ? 'white' : '#c9d1d9',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', backgroundColor: '#161b22', border: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={12} color="#8b949e" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 12, color: '#8b949e' }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && (
          <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 11,
                backgroundColor: '#161b22', color: '#8b949e',
                border: '1px solid #21262d', cursor: 'pointer'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#388bfd'; e.currentTarget.style.color = '#58a6ff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#21262d'; e.currentTarget.style.color = '#8b949e' }}
              >{s}</button>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 20px', borderTop: '1px solid #21262d', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask about findings, fixes, priorities..."
              rows={2}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13,
                backgroundColor: '#161b22', color: '#e6edf3',
                border: '1px solid #30363d', outline: 'none', resize: 'none',
                fontFamily: 'inherit', lineHeight: 1.5, transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = '#388bfd'}
              onBlur={e => e.target.style.borderColor = '#30363d'}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading} style={{
              width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
              backgroundColor: input.trim() && !loading ? '#238636' : '#21262d',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.15s'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#484f58', marginTop: 6 }}>Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </>
  )
}

export default function Report() {
  const { repoId } = useParams()
  const navigate = useNavigate()
  const [expandedFindings, setExpandedFindings] = useState(new Set([0,1,2,3,4]))
  const [showRawData, setShowRawData] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [user, setUser] = useState(null)
  const [repo, setRepo] = useState(null)
  const [report, setReport] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ username: payload.username, avatar: `https://github.com/${payload.username}.png` })
      } catch (e) {}
    }
    const storedRepos = JSON.parse(localStorage.getItem('driftless_repos') || '[]')
    const foundRepo = storedRepos.find(r => r.id === repoId)
    setRepo(foundRepo || { id: repoId, name: repoId, fullName: repoId })
    const storedResults = JSON.parse(localStorage.getItem('driftless_results') || '{}')
    setReport(storedResults[repoId] || null)
  }, [repoId])

  const handleReanalyze = async () => {
    if (!repo) return
    setAnalyzing(true)
    try {
      const { runAnalysis } = await import('../store/api')
      const result = await runAnalysis(repo.fullName || repo.full_name)
      setReport(result)
      const storedResults = JSON.parse(localStorage.getItem('driftless_results') || '{}')
      storedResults[repoId] = result
      localStorage.setItem('driftless_results', JSON.stringify(storedResults))
    } catch (err) {
      console.error('Analysis failed', err)
    } finally {
      setAnalyzing(false)
    }
  }

  const handlePrint = () => {
    if (report?.findings) {
      setExpandedFindings(new Set(report.findings.map((_, i) => i)))
    }
    setTimeout(() => window.print(), 400)
  }

  const toggleFinding = (rank) => {
    setExpandedFindings(prev => {
      const next = new Set(prev)
      next.has(rank) ? next.delete(rank) : next.add(rank)
      return next
    })
  }

  if (!repo) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#010409' }}>
      <Loader2 size={24} color="#238636" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!report) return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#010409', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Sidebar navigate={navigate} user={user} />
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e6edf3', marginBottom: 8 }}>{repo.name}</div>
          <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 24 }}>This repository hasn't been analyzed yet.</div>
          <button onClick={handleReanalyze} disabled={analyzing} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            backgroundColor: '#238636', color: 'white', border: '1px solid #2ea043',
            cursor: 'pointer', opacity: analyzing ? 0.7 : 1
          }}>
            {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analyzing...</> : 'Run First Analysis'}
          </button>
        </div>
      </div>
    </div>
  )

  const healthScore = report.healthScore ?? 0
  const healthLabel = healthScore > 80 ? 'Healthy' : healthScore >= 60 ? 'Needs Attention' : 'Critical'
  const findings = report.findings || []
  const color = getHealthColor(healthScore)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#010409', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          @page { margin: 2cm 2.5cm; size: A4 portrait; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; font-family: 'EB Garamond', 'Perpetua', Georgia, 'Times New Roman', serif !important; font-size: 12pt !important; color: #1a1a1a !important; }
          .no-print { display: none !important; }
          .print-content { margin-left: 0 !important; padding: 0 !important; max-width: 100% !important; background: white !important; }
          .print-page-header { display: flex !important; align-items: flex-start !important; justify-content: space-between !important; padding-bottom: 16pt !important; margin-bottom: 24pt !important; border-bottom: 2px solid #1a1a1a !important; }
          .print-logo-label { font-size: 8pt !important; letter-spacing: 3px !important; text-transform: uppercase !important; color: #238636 !important; margin-bottom: 6pt !important; font-weight: 600 !important; }
          .print-repo-name { font-size: 28pt !important; font-weight: 700 !important; color: #1a1a1a !important; line-height: 1.1 !important; margin-bottom: 4pt !important; }
          .print-date { font-size: 10pt !important; color: #666 !important; font-style: italic !important; }
          .print-score-num { font-size: 56pt !important; font-weight: 700 !important; color: ${color} !important; line-height: 1 !important; text-align: right !important; }
          .print-score-sub { font-size: 10pt !important; color: #666 !important; text-align: right !important; }
          .print-health-badge { font-size: 13pt !important; font-weight: 600 !important; color: ${color} !important; text-align: right !important; }
          .print-summary-card { background: white !important; border: 1px solid #d0d7de !important; border-left: 4px solid #238636 !important; border-radius: 0 !important; padding: 16pt 18pt !important; margin-bottom: 20pt !important; break-inside: avoid !important; }
          .print-section-label { font-size: 8pt !important; text-transform: uppercase !important; letter-spacing: 2.5px !important; color: #666 !important; margin-bottom: 8pt !important; padding-bottom: 5pt !important; border-bottom: 1px solid #e0e0e0 !important; font-weight: 600 !important; }
          .print-summary-text { font-size: 12pt !important; line-height: 1.9 !important; color: #2a2a2a !important; font-style: italic !important; }
          .print-findings-header { font-size: 8pt !important; text-transform: uppercase !important; letter-spacing: 2.5px !important; color: #666 !important; margin-bottom: 12pt !important; padding-bottom: 5pt !important; border-bottom: 1px solid #e0e0e0 !important; font-weight: 600 !important; }
          .print-finding-card { background: white !important; border: 1px solid #d0d7de !important; border-radius: 0 !important; padding: 12pt 14pt !important; margin-bottom: 10pt !important; break-inside: avoid !important; }
          .print-finding-title-text { font-size: 13pt !important; font-weight: 600 !important; color: #1a1a1a !important; line-height: 1.4 !important; }
          .print-finding-explanation { font-size: 11pt !important; line-height: 1.75 !important; color: #333 !important; margin: 8pt 0 !important; }
          .print-fix-label { font-size: 8pt !important; text-transform: uppercase !important; letter-spacing: 1.5px !important; color: #888 !important; margin-bottom: 4pt !important; font-weight: 600 !important; }
          .print-fix-code { font-family: 'Courier New', monospace !important; font-size: 10pt !important; background: #f6f8fa !important; border: 1px solid #d0d7de !important; padding: 7pt 10pt !important; display: block !important; color: #116329 !important; word-break: break-all !important; border-radius: 0 !important; }
          .print-meta-text { font-size: 10pt !important; color: #666 !important; font-style: italic !important; }
          .print-footer-bar { display: flex !important; justify-content: space-between !important; padding-top: 10pt !important; margin-top: 28pt !important; border-top: 1px solid #ccc !important; }
          .print-footer-text { font-size: 8.5pt !important; color: #999 !important; font-style: italic !important; }
          button { display: none !important; }
        }
      `}</style>

      <Sidebar navigate={navigate} user={user} />

      <div className="print-content" style={{ flex: 1, marginLeft: 240, padding: '32px', maxWidth: 'calc(100% - 240px)' }}>
        <div style={{ maxWidth: 760 }}>

          <button className="no-print" onClick={() => navigate('/dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: '#8b949e', background: 'none', border: 'none',
            cursor: 'pointer', marginBottom: 24, padding: 0
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'}
            onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
          >
            <ChevronLeft size={15} />Back to Dashboard
          </button>

          {/* Print only header */}
          <div className="print-page-header" style={{ display: 'none' }}>
            <div>
              <div className="print-logo-label">Driftless — Codebase Health Report</div>
              <div className="print-repo-name">{repo.name}</div>
              <div className="print-date">Generated on {report.generatedAt || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div>
              <div className="print-score-num">{healthScore}</div>
              <div className="print-score-sub">out of 100</div>
              <div className="print-health-badge">{healthLabel}</div>
            </div>
          </div>

          {/* Screen header */}
          <div style={{
            backgroundColor: '#0d1117', border: '1px solid #21262d',
            borderRadius: 8, padding: '20px 24px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <HealthCircle score={healthScore} size={72} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3', marginBottom: 6 }}>{repo.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color }}>{healthLabel}</span>
                  <span style={{ color: '#30363d' }}>·</span>
                  <span style={{ fontSize: 12, color: '#8b949e' }}>{report.generatedAt || new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Security', 'Currency', 'Decay'].map(label => (
                  <div key={label} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 12px', borderRadius: 6,
                    backgroundColor: '#161b22', border: '1px solid #21262d'
                  }}>
                    <Circle size={7} fill="#3fb950" color="#3fb950" />
                    <span style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setChatOpen(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  backgroundColor: '#238636', color: 'white',
                  border: '1px solid #2ea043', cursor: 'pointer'
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2ea043'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#238636'}
                >
                  <Activity size={12} />Ask Agent
                </button>
                <button onClick={handlePrint} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  backgroundColor: 'transparent', color: '#8b949e',
                  border: '1px solid #30363d', cursor: 'pointer'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b949e'; e.currentTarget.style.color = '#e6edf3' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e' }}
                >
                  <Printer size={12} />Print / Save PDF
                </button>
                <button onClick={handleReanalyze} disabled={analyzing} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  backgroundColor: 'transparent', color: '#8b949e',
                  border: '1px solid #30363d', cursor: 'pointer', opacity: analyzing ? 0.6 : 1
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b949e'; e.currentTarget.style.color = '#e6edf3' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e' }}
                >
                  {analyzing
                    ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />Analyzing...</>
                    : <>↻ Re-analyze</>}
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="print-summary-card" style={{
            backgroundColor: '#0d1117', border: '1px solid #21262d',
            borderRadius: 8, padding: '16px 20px', marginBottom: 16
          }}>
            <div className="print-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="no-print" style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: '#238636', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={11} color="white" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Agent Summary</span>
            </div>
            <p className="print-summary-text" style={{ fontSize: 13, lineHeight: 1.7, color: '#8b949e', fontStyle: 'italic' }}>
              "{report.summary}"
            </p>
          </div>

          {/* Findings */}
          <div style={{ marginBottom: 16 }}>
            <div className="print-findings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>Findings</span>
              <span className="no-print" style={{ fontSize: 12, color: '#8b949e' }}>{findings.length} items · click to expand</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {findings.map((finding, i) => {
                const key = finding.rank ?? i
                const isExpanded = expandedFindings.has(key)
                const sc = getSeverityColor(finding.severity)
                return (
                  <div key={key} className="print-finding-card" style={{
                    backgroundColor: '#0d1117',
                    border: `1px solid ${isExpanded ? '#388bfd40' : '#21262d'}`,
                    borderRadius: 8, overflow: 'hidden'
                  }}>
                    <button onClick={() => toggleFinding(key)} style={{
                      width: '100%', padding: '12px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: isExpanded ? '#161b22' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left'
                    }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#161b22' }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: '#484f58', flexShrink: 0 }}>#{finding.rank ?? i+1}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          backgroundColor: sc + '20', color: sc,
                          textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0
                        }}>{finding.severity}</span>
                        <span className="print-finding-title-text" style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {finding.title}
                        </span>
                      </div>
                      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, backgroundColor: '#161b22', color: '#8b949e', border: '1px solid #21262d' }}>{finding.urgency}</span>
                        {isExpanded ? <ChevronUp size={14} color="#8b949e" /> : <ChevronDown size={14} color="#8b949e" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', borderTop: '1px solid #21262d' }}>
                        <p className="print-finding-explanation" style={{ fontSize: 13, lineHeight: 1.7, color: '#8b949e', marginBottom: 16 }}>
                          {finding.explanation}
                        </p>
                        <div style={{ marginBottom: 16 }}>
                          <div className="print-fix-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Terminal size={12} color="#3fb950" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fix</span>
                          </div>
                          <div style={{ borderRadius: 6, padding: '10px 14px', backgroundColor: '#161b22', border: '1px solid #21262d' }}>
                            <code className="print-fix-code" style={{ fontSize: 12, color: '#3fb950', fontFamily: 'monospace' }}>{finding.fix}</code>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="print-meta-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={12} color="#8b949e" />
                            <span style={{ fontSize: 12, color: '#8b949e' }}>
                              Estimated: <span style={{ color: '#e6edf3' }}>{finding.estimatedTime}</span>
                            </span>
                          </div>
                          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <CheckCircle2 size={12} color="#8b949e" />
                            <span style={{ fontSize: 12, color: '#8b949e' }}>Mark resolved</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Raw Data */}
          <div className="no-print" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setShowRawData(!showRawData)} style={{
              width: '100%', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer'
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#161b22'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={13} color="#8b949e" />
                <span style={{ fontSize: 13, color: '#8b949e' }}>Raw Audit Data</span>
              </div>
              {showRawData ? <ChevronUp size={14} color="#8b949e" /> : <ChevronDown size={14} color="#8b949e" />}
            </button>
            {showRawData && (
              <div style={{ padding: 16, borderTop: '1px solid #21262d', backgroundColor: '#010409' }}>
                <pre style={{ fontSize: 11, color: '#8b949e', fontFamily: 'monospace', overflow: 'auto', lineHeight: 1.6 }}>
                  {JSON.stringify(report, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Print footer */}
          <div className="print-footer-bar" style={{ display: 'none' }}>
            <span className="print-footer-text">Driftless · AI-powered codebase health monitoring</span>
            <span className="print-footer-text">{repo.name} · {new Date().toLocaleDateString('en-GB')}</span>
          </div>

        </div>
      </div>

      {chatOpen && <ReportChat report={report} repo={repo} onClose={() => setChatOpen(false)} />}
    </div>
  )
}