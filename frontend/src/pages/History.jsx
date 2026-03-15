import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getToken } from '../store/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  ChevronLeft, ChevronDown, ChevronUp, Clock, Activity,
  LayoutDashboard, FileText, Settings, Terminal, CheckCircle2, Loader2, Circle
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

function HealthCircle({ score, size = 72 }) {
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
    <div style={{
      width: 240, display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 10,
      backgroundColor: '#0d1117', borderRight: '1px solid #21262d'
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#238636', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={14} color="white" />
        </div>
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
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3' }}>{user?.username || '...'}</div>
            <div style={{ fontSize: 11, color: '#8b949e' }}>Free plan</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: 6, padding: '8px 12px' }}>
        <div style={{ fontSize: 12, color: '#e6edf3', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: getHealthColor(payload[0].value) }}>Score: {payload[0].value}</div>
      </div>
    )
  }
  return null
}

export default function History() {
  const { repoId } = useParams()
  const navigate = useNavigate()
  const [expandedFindings, setExpandedFindings] = useState(new Set([1]))
  const [showRawData, setShowRawData] = useState(false)
  const [user, setUser] = useState(null)
  const [repo, setRepo] = useState(null)
  const [report, setReport] = useState(null)
  const [allAnalyzedRepos, setAllAnalyzedRepos] = useState([])
  const [selectedRepoId, setSelectedRepoId] = useState(null)

  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ username: payload.username, avatar: `https://github.com/${payload.username}.png` })
      } catch (e) {}
    }
    const storedRepos = JSON.parse(localStorage.getItem('driftless_repos') || '[]')
    const storedResults = JSON.parse(localStorage.getItem('driftless_results') || '{}')
    const analyzed = storedRepos.filter(r => storedResults[r.id])
    setAllAnalyzedRepos(analyzed)
    const targetId = repoId && repoId !== '1' ? repoId : (analyzed[0]?.id || null)
    setSelectedRepoId(targetId)
    if (targetId) {
      setRepo(storedRepos.find(r => r.id === targetId) || null)
      setReport(storedResults[targetId] || null)
    }
  }, [repoId])

  const handleSelectRepo = (id) => {
    const storedRepos = JSON.parse(localStorage.getItem('driftless_repos') || '[]')
    const storedResults = JSON.parse(localStorage.getItem('driftless_results') || '{}')
    setSelectedRepoId(id)
    setRepo(storedRepos.find(r => r.id === id) || null)
    setReport(storedResults[id] || null)
    setExpandedFindings(new Set([1]))
  }

  const toggleFinding = (rank) => {
    setExpandedFindings(prev => {
      const next = new Set(prev)
      next.has(rank) ? next.delete(rank) : next.add(rank)
      return next
    })
  }

  if (!repo || !report) return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#010409', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Sidebar navigate={navigate} user={user} />
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          {allAnalyzedRepos.length === 0 ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3', marginBottom: 8 }}>No analyses yet</div>
              <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 20 }}>Go to the dashboard and run an analysis first.</div>
            </>
          ) : (
            <Loader2 size={24} color="#238636" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          )}
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            backgroundColor: '#238636', color: 'white', border: '1px solid #2ea043', cursor: 'pointer'
          }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  const findings = report.findings || []
  const healthScore = report.healthScore ?? 0
  const chartData = [{ week: 'Latest', score: healthScore }]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#010409', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <Sidebar navigate={navigate} user={user} />

      {/* History panel */}
      <div style={{
        width: 260, display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 240, height: '100%',
        backgroundColor: '#0d1117', borderRight: '1px solid #21262d',
        overflowY: 'auto', zIndex: 9
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #21262d' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#8b949e', background: 'none', border: 'none',
            cursor: 'pointer', marginBottom: 12, padding: 0
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'}
            onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
          >
            <ChevronLeft size={14} />Back to Dashboard
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{repo?.name}</div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>Report history</div>
        </div>

        {/* Chart */}
        <div style={{ padding: '16px', borderBottom: '1px solid #21262d' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            Health Trend
          </div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="week" tick={{ fill: '#8b949e', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#238636" strokeWidth={2}
                  dot={{ fill: '#238636', r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: '#3fb950', r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Repo list */}
        <div style={{ padding: '16px', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Analyzed Repos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {allAnalyzedRepos.map((r) => {
              const storedResults = JSON.parse(localStorage.getItem('driftless_results') || '{}')
              const result = storedResults[r.id]
              const score = result?.healthScore ?? 0
              const isSelected = selectedRepoId === r.id
              const color = getHealthColor(score)
              return (
                <button key={r.id} onClick={() => handleSelectRepo(r.id)} style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 6,
                  backgroundColor: isSelected ? '#161b22' : 'transparent',
                  border: `1px solid ${isSelected ? '#388bfd40' : '#21262d'}`,
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#161b22' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: isSelected ? '#e6edf3' : '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.name}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color, marginLeft: 8, flexShrink: 0 }}>{score}</span>
                  </div>
                  <div style={{ height: 3, backgroundColor: '#21262d', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, backgroundColor: color, borderRadius: 3 }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 500, padding: '32px', maxWidth: 'calc(100% - 500px)' }}>
        <div style={{ maxWidth: 720 }}>

          {/* Header */}
          <div style={{
            backgroundColor: '#0d1117', border: '1px solid #21262d',
            borderRadius: 8, padding: '20px 24px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <HealthCircle score={healthScore} size={64} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 4 }}>{repo.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: getHealthColor(healthScore) }}>
                    {healthScore > 80 ? 'Healthy' : healthScore >= 60 ? 'Needs Attention' : 'Critical'}
                  </span>
                  <span style={{ color: '#30363d' }}>·</span>
                  <span style={{ fontSize: 12, color: '#8b949e' }}>{report.generatedAt || new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <button onClick={() => navigate(`/report/${repo.id}`)} style={{
              padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              backgroundColor: '#0d2a3d', color: '#58a6ff', border: '1px solid #1f6feb60',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#112d42'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0d2a3d'}
            >
              Full Report
            </button>
          </div>

          {/* Summary */}
          <div style={{
            backgroundColor: '#0d1117', border: '1px solid #21262d',
            borderRadius: 8, padding: '16px 20px', marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: '#238636', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={11} color="white" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Agent Summary</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: '#8b949e', fontStyle: 'italic' }}>"{report.summary}"</p>
          </div>

          {/* Findings */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>Findings</span>
              <span style={{ fontSize: 12, color: '#8b949e' }}>{findings.length} items</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {findings.map((finding, i) => {
                const key = finding.rank ?? i
                const isExpanded = expandedFindings.has(key)
                const sc = getSeverityColor(finding.severity)
                return (
                  <div key={key} style={{
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
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {finding.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          backgroundColor: '#161b22', color: '#8b949e', border: '1px solid #21262d'
                        }}>{finding.urgency}</span>
                        {isExpanded ? <ChevronUp size={14} color="#8b949e" /> : <ChevronDown size={14} color="#8b949e" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', borderTop: '1px solid #21262d' }}>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#8b949e', marginBottom: 16 }}>{finding.explanation}</p>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Terminal size={12} color="#3fb950" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fix</span>
                          </div>
                          <div style={{ borderRadius: 6, padding: '10px 14px', backgroundColor: '#161b22', border: '1px solid #21262d' }}>
                            <code style={{ fontSize: 12, color: '#3fb950', fontFamily: 'monospace' }}>{finding.fix}</code>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={12} color="#8b949e" />
                            <span style={{ fontSize: 12, color: '#8b949e' }}>
                              Estimated: <span style={{ color: '#e6edf3' }}>{finding.estimatedTime}</span>
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
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
          <div style={{ backgroundColor: '#0d1117', border: '1px solid #21262d', borderRadius: 8, overflow: 'hidden' }}>
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
        </div>
      </div>
    </div>
  )
}