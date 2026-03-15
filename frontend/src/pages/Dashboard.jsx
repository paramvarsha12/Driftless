import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { mockReport } from '../store/mockData'
import { getToken, setToken, fetchRepos, runAnalysis } from '../store/api'
import {
  LayoutDashboard, FolderOpen, FileText, Settings,
  Shield, Clock, Archive, X, Loader2, Activity,
  AlertTriangle, CheckCircle2, GitBranch, Star, Circle
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

function Sidebar({ navigate, user, currentPath }) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Reports', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]
  return (
    <div style={{
      width: 240, display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 10,
      backgroundColor: '#0d1117', borderRight: '1px solid #21262d'
    }}>
      <div style={{ padding: '16px 16px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, backgroundColor: '#238636',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Activity size={14} color="white" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3', letterSpacing: '-0.3px' }}>Driftless</span>
      </div>

      <nav style={{ flex: 1, padding: '8px 8px' }}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = currentPath === path
          return (
            <button key={label} onClick={() => navigate(path)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', borderRadius: 6, fontSize: 14, fontWeight: 400,
              border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
              backgroundColor: active ? '#161b22' : 'transparent',
              color: active ? '#e6edf3' : '#8b949e',
              transition: 'all 0.15s'
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#161b22'; e.currentTarget.style.color = '#e6edf3' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b949e' }}}
            >
              <Icon size={16} />{label}
            </button>
          )
        })}
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

function StatCard({ label, value, valueColor, icon: Icon, iconColor }) {
  return (
    <div style={{
      backgroundColor: '#0d1117', border: '1px solid #21262d',
      borderRadius: 8, padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#8b949e', fontWeight: 500 }}>{label}</span>
        {Icon && <Icon size={14} color={iconColor || '#8b949e'} />}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: valueColor || '#e6edf3', letterSpacing: '-1px' }}>{value}</div>
    </div>
  )
}

function RepoCard({ repo, onSelect, onAnalyze, analyzing, navigate, analysisResult }) {
  const healthScore = analysisResult?.healthScore ?? repo.healthScore ?? 0
  const analyzed = !!analysisResult
  const color = getHealthColor(healthScore)

  return (
    <div onClick={() => onSelect(repo)} style={{
      backgroundColor: '#0d1117', border: '1px solid #21262d',
      borderRadius: 8, padding: '16px', cursor: 'pointer',
      transition: 'border-color 0.15s',
      display: 'flex', flexDirection: 'column'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#388bfd'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#21262d'}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOpen size={15} color="#8b949e" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#58a6ff' }}>{repo.name}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: '#8b949e',
          padding: '2px 8px', borderRadius: 20,
          border: '1px solid #21262d', backgroundColor: '#161b22'
        }}>
          <Circle size={7} fill={analyzed ? color : '#484f58'} color={analyzed ? color : '#484f58'} />
          {analyzed ? `${healthScore}/100` : 'Not analyzed'}
        </div>
      </div>

      {/* Language + last analyzed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {repo.language && repo.language !== 'Unknown' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Circle size={10} fill="#f0883e" color="#f0883e" />
            <span style={{ fontSize: 12, color: '#8b949e' }}>{repo.language}</span>
          </div>
        )}
        <span style={{ fontSize: 12, color: '#484f58' }}>
          {repo.lastAnalyzed || 'Never analyzed'}
        </span>
      </div>

      {/* Health bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#8b949e' }}>Health score</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: analyzed ? color : '#484f58' }}>
            {analyzed ? `${healthScore}%` : '—'}
          </span>
        </div>
        <div style={{ height: 4, backgroundColor: '#21262d', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${healthScore}%`,
            backgroundColor: color, borderRadius: 4,
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Findings badges */}
      {analysisResult?.findings?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {analysisResult.findings.slice(0, 3).map((f, i) => (
            <span key={i} style={{
              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
              backgroundColor: getSeverityColor(f.severity) + '20',
              color: getSeverityColor(f.severity), textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {f.severity}
            </span>
          ))}
        </div>
      )}

      {/* Buttons */}
<div style={{ display: 'flex', gap: 8, borderTop: '1px solid #21262d', paddingTop: 12, marginTop: 'auto' }}>        {analysisResult ? (
          <button onClick={e => { e.stopPropagation(); navigate(`/report/${repo.id}`) }} style={{
            flex: 1, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
            backgroundColor: '#0d2a3d', color: '#58a6ff', border: '1px solid #1f6feb60',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#112d42'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0d2a3d'}
          >
            View Report
          </button>
        ) : (
          <button onClick={e => { e.stopPropagation(); onAnalyze(repo) }} disabled={analyzing} style={{
            flex: 1, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
            backgroundColor: '#238636', color: 'white',
            border: '1px solid #2ea043', cursor: 'pointer', transition: 'all 0.15s',
            opacity: analyzing ? 0.5 : 1
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2ea043' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#238636' }}
          >
            {analyzing ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />Analyzing
              </span>
            ) : 'Analyze Now'}
          </button>
        )}
      </div>
    </div>
  )
}

function SlidePanel({ repo, onClose, analysisResult }) {
  if (!repo) return null
  const findings = analysisResult?.findings || mockReport.findings
  const healthScore = analysisResult?.healthScore ?? repo.healthScore ?? 0
  const color = getHealthColor(healthScore)

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
      }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, height: '100%', width: 360,
        zIndex: 30, overflowY: 'auto',
        backgroundColor: '#0d1117', borderLeft: '1px solid #21262d'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', position: 'sticky', top: 0,
          backgroundColor: '#0d1117', borderBottom: '1px solid #21262d'
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3' }}>{repo.name}</div>
            <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>{repo.full_name || repo.fullName}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#8b949e', padding: 4, borderRadius: 4
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Score */}
          <div style={{
            backgroundColor: '#161b22', border: '1px solid #21262d',
            borderRadius: 8, padding: 20, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <HealthCircle score={healthScore} size={64} />
            <div>
              <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 4 }}>Health Score</div>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>
                {healthScore > 80 ? 'Healthy' : healthScore >= 60 ? 'Needs Attention' : 'Critical'}
              </div>
            </div>
          </div>

          {/* Findings */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Top Issues
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {findings.slice(0, 3).map((f, i) => (
                <div key={i} style={{
                  backgroundColor: '#161b22', border: '1px solid #21262d',
                  borderRadius: 6, padding: '10px 12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      backgroundColor: getSeverityColor(f.severity) + '20',
                      color: getSeverityColor(f.severity), textTransform: 'uppercase'
                    }}>{f.severity}</span>
                    <span style={{ fontSize: 11, color: '#484f58' }}>{f.urgency}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>{f.title}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => window.location.href = `/report/${repo.id}`} style={{
            width: '100%', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            backgroundColor: '#238636', color: 'white', border: '1px solid #2ea043',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <FileText size={13} />View Full Report
          </button>
        </div>
      </div>
    </>
  )
}

export default function Dashboard() {
  const [repos, setRepos] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [analyzingRepo, setAnalyzingRepo] = useState(null)
  const [analysisResults, setAnalysisResults] = useState({})
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      setToken(urlToken)
      window.history.replaceState({}, '', '/dashboard')
    }
    const token = urlToken || getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ username: payload.username, avatar: `https://github.com/${payload.username}.png` })
      } catch (e) { console.error('Failed to decode token', e) }
    }
    const storedResults = JSON.parse(localStorage.getItem('driftless_results') || '{}')
    setAnalysisResults(storedResults)
    const loadRepos = async () => {
      try {
        const data = await fetchRepos()
        const mapped = data.map((r) => ({
          id: String(r.id),
          name: r.name,
          fullName: r.full_name,
          full_name: r.full_name,
          language: r.language || 'Unknown',
          isProduction: false,
          healthScore: storedResults[String(r.id)]?.healthScore || 0,
          lastAnalyzed: storedResults[String(r.id)] ? 'Previously analyzed' : 'Not yet analyzed',
          security: 'healthy', currency: 'healthy', decay: 'healthy',
          updated_at: r.updated_at
        }))
        setRepos(mapped)
        localStorage.setItem('driftless_repos', JSON.stringify(mapped))
      } catch (err) {
        setError('Failed to load repos. Please re-authenticate.')
      } finally {
        setLoading(false)
      }
    }
    loadRepos()
  }, [])

  const handleAnalyze = async (repo) => {
    setAnalyzingRepo(repo.id)
    try {
      const result = await runAnalysis(repo.full_name || repo.fullName)
      setAnalysisResults(prev => ({ ...prev, [repo.id]: result }))
      setRepos(prev => prev.map(r =>
        r.id === repo.id ? { ...r, healthScore: result.healthScore, lastAnalyzed: 'Just now' } : r
      ))
      const storedResults = JSON.parse(localStorage.getItem('driftless_results') || '{}')
      storedResults[repo.id] = result
      localStorage.setItem('driftless_results', JSON.stringify(storedResults))
    } catch (err) {
      console.error('Analysis failed', err)
    } finally {
      setAnalyzingRepo(null)
    }
  }

  const criticalCount = Object.values(analysisResults)
    .flatMap(r => r.findings || [])
    .filter(f => f.severity === 'critical').length

  const avgHealth = repos.length
    ? Math.round(repos.reduce((sum, r) => sum + (r.healthScore || 0), 0) / repos.length)
    : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#010409' }}>
      <style>{`
        @keyframes helix-rotate { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        @keyframes fade-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes dot-left {
          0%   { transform: translateX(0px);  opacity: 1;   width: 8px; height: 8px; }
          25%  { transform: translateX(16px); opacity: 0.5; width: 5px; height: 5px; }
          50%  { transform: translateX(0px);  opacity: 0.2; width: 3px; height: 3px; }
          75%  { transform: translateX(-16px);opacity: 0.5; width: 5px; height: 5px; }
          100% { transform: translateX(0px);  opacity: 1;   width: 8px; height: 8px; }
        }
        @keyframes dot-right {
          0%   { transform: translateX(0px);  opacity: 0.2; width: 3px; height: 3px; }
          25%  { transform: translateX(-16px);opacity: 0.5; width: 5px; height: 5px; }
          50%  { transform: translateX(0px);  opacity: 1;   width: 8px; height: 8px; }
          75%  { transform: translateX(16px); opacity: 0.5; width: 5px; height: 5px; }
          100% { transform: translateX(0px);  opacity: 0.2; width: 3px; height: 3px; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <div style={{ position: 'relative', width: 56, height: 100 }}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{
              position: 'absolute', top: i * 12, left: 0, width: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20
            }}>
              <div style={{
                borderRadius: '50%',
                backgroundColor: '#8b949e',
                animation: `dot-left 1.6s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
                width: 8, height: 8
              }} />
              <div style={{
                width: 16, height: 1,
                background: 'linear-gradient(to right, rgba(139,148,158,0.3), rgba(139,148,158,0.05), rgba(139,148,158,0.3))'
              }} />
              <div style={{
                borderRadius: '50%',
                backgroundColor: '#8b949e',
                animation: `dot-right 1.6s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
                width: 3, height: 3
              }} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 6, letterSpacing: '-0.3px' }}>Driftless</p>
          <p style={{ fontSize: 12, color: '#8b949e', animation: 'fade-pulse 1.6s ease-in-out infinite' }}>Loading repositories...</p>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#010409' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#e6edf3', marginBottom: 12 }}>{error}</p>
        <button onClick={() => window.location.href = 'http://localhost:8000/auth/github'}
          style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: '#238636', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}>
          Login with GitHub
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#010409', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <Sidebar navigate={navigate} user={user} currentPath="/dashboard" />

      <div style={{ flex: 1, marginLeft: 240, padding: '32px 32px', maxWidth: 'calc(100% - 240px)' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #21262d' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#e6edf3', marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#8b949e' }}>
            Monitoring {repos.length} repositories · Welcome back, <span style={{ color: '#e6edf3' }}>{user?.username || '...'}</span>
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Repos Monitored" value={repos.length} icon={FolderOpen} />
          <StatCard label="Critical Issues" value={criticalCount} valueColor={criticalCount > 0 ? '#f85149' : '#3fb950'} icon={AlertTriangle} iconColor={criticalCount > 0 ? '#f85149' : '#3fb950'} />
          <StatCard label="Analyses Run" value={Object.keys(analysisResults).length} icon={Activity} iconColor="#388bfd" />
          <StatCard label="Avg Health" value={avgHealth ? `${avgHealth}` : '—'} valueColor={avgHealth ? getHealthColor(avgHealth) : '#8b949e'} icon={CheckCircle2} iconColor={avgHealth ? getHealthColor(avgHealth) : '#8b949e'} />
        </div>

        {/* Repo grid header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>Repositories</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}>
            <CheckCircle2 size={12} color="#3fb950" />
            All systems monitored
          </div>
        </div>

        {/* Repo grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {repos.map(repo => (
            <RepoCard key={repo.id} repo={repo}
              onSelect={setSelectedRepo}
              onAnalyze={handleAnalyze}
              analyzing={analyzingRepo === repo.id}
              navigate={navigate}
              analysisResult={analysisResults[repo.id]}
            />
          ))}
        </div>
      </div>

      <SlidePanel
        repo={selectedRepo}
        onClose={() => setSelectedRepo(null)}
        analysisResult={selectedRepo ? analysisResults[selectedRepo.id] : null}
      />
    </div>
  )
}