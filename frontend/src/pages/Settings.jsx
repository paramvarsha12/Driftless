import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, clearToken } from '../store/api'
import { Mail, Calendar, Clock, Activity, LayoutDashboard, FileText, Settings as SettingsIcon, Github, LogOut } from 'lucide-react'

function Toggle({ enabled, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      position: 'relative', width: 40, height: 22, borderRadius: 11,
      backgroundColor: enabled ? '#238636' : '#21262d',
      border: `1px solid ${enabled ? '#2ea043' : '#30363d'}`,
      cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
    }}>
      <div style={{
        position: 'absolute', top: 2, width: 16, height: 16,
        backgroundColor: 'white', borderRadius: '50%', transition: 'left 0.2s',
        left: enabled ? '20px' : '2px'
      }} />
    </button>
  )
}

function Sidebar({ navigate, user }) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Reports', path: '/history' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings', active: true },
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

function Section({ title, description, children }) {
  return (
    <div style={{ backgroundColor: '#0d1117', border: '1px solid #21262d', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #21262d' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{title}</div>
        {description && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>{description}</div>}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [repos, setRepos] = useState([])
  const [monitoringToggles, setMonitoringToggles] = useState({})
  const [productionToggles, setProductionToggles] = useState({})
  const [email, setEmail] = useState('')
  const [digestDay, setDigestDay] = useState('Sunday')
  const [digestTime, setDigestTime] = useState('08:00')

  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ username: payload.username, avatar: `https://github.com/${payload.username}.png` })
        setEmail(`${payload.username}@github.com`)
      } catch (e) {}
    }
    const storedRepos = JSON.parse(localStorage.getItem('driftless_repos') || '[]')
    setRepos(storedRepos)
    setMonitoringToggles(storedRepos.reduce((acc, r) => ({ ...acc, [r.id]: true }), {}))
    setProductionToggles(storedRepos.reduce((acc, r) => ({ ...acc, [r.id]: r.isProduction || false }), {}))
  }, [])

  const handleLogout = () => {
    clearToken()
    localStorage.removeItem('driftless_repos')
    localStorage.removeItem('driftless_results')
    navigate('/')
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    backgroundColor: '#161b22', border: '1px solid #30363d',
    borderRadius: 6, fontSize: 13, color: '#e6edf3', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s', boxSizing: 'border-box'
  }

  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#010409', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Sidebar navigate={navigate} user={user} />

      <div style={{ flex: 1, marginLeft: 240, padding: '32px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #21262d' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#e6edf3', marginBottom: 4 }}>Settings</h1>
          <p style={{ fontSize: 13, color: '#8b949e' }}>Manage your repositories, digest schedule, and account</p>
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

          {/* Left — Repos */}
          <Section title="Connected Repositories" description="Toggle monitoring and production status per repo">
            {repos.length === 0 ? (
              <p style={{ fontSize: 13, color: '#8b949e' }}>No repositories loaded. Go to the dashboard first.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {repos.map(repo => (
                  <div key={repo.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 6,
                    backgroundColor: '#161b22', border: '1px solid #21262d'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#21262d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Github size={13} color="#8b949e" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {repo.name}
                        </div>
                        {repo.language && repo.language !== 'Unknown' && (
                          <span style={{
                            fontSize: 10, padding: '1px 5px', borderRadius: 3, marginTop: 2, display: 'inline-block',
                            backgroundColor: '#21262d', color: '#8b949e', border: '1px solid #30363d'
                          }}>{repo.language}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 9, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mon</span>
                        <Toggle enabled={monitoringToggles[repo.id] ?? true}
                          onToggle={() => setMonitoringToggles(p => ({ ...p, [repo.id]: !p[repo.id] }))} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 9, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prod</span>
                        <Toggle enabled={productionToggles[repo.id] ?? false}
                          onToggle={() => setProductionToggles(p => ({ ...p, [repo.id]: !p[repo.id] }))} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Digest Settings */}
            <Section title="Digest Settings" description="Configure when and where your weekly report lands">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8b949e', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={13} color="#8b949e" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 30 }}
                      onFocus={e => e.target.style.borderColor = '#388bfd'}
                      onBlur={e => e.target.style.borderColor = '#30363d'}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8b949e', marginBottom: 6 }}>Day</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={13} color="#8b949e" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                      <select value={digestDay} onChange={e => setDigestDay(e.target.value)}
                        style={{ ...selectStyle, paddingLeft: 30 }}
                        onFocus={e => e.target.style.borderColor = '#388bfd'}
                        onBlur={e => e.target.style.borderColor = '#30363d'}
                      >
                        {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => (
                          <option key={d} value={d} style={{ backgroundColor: '#161b22' }}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8b949e', marginBottom: 6 }}>Time</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={13} color="#8b949e" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="time" value={digestTime} onChange={e => setDigestTime(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 30 }}
                        onFocus={e => e.target.style.borderColor = '#388bfd'}
                        onBlur={e => e.target.style.borderColor = '#30363d'}
                      />
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                  borderRadius: 6, backgroundColor: '#161b22', border: '1px solid #21262d'
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3fb950', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#8b949e' }}>
                    Every <span style={{ color: '#e6edf3', fontWeight: 500 }}>{digestDay}</span> at <span style={{ color: '#e6edf3', fontWeight: 500 }}>{digestTime}</span>
                  </span>
                </div>
              </div>
            </Section>

            {/* Account */}
            <Section title="Account" description="Manage your GitHub connection and session">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                  borderRadius: 6, backgroundColor: '#161b22', border: '1px solid #21262d'
                }}>
                  {user?.avatar
                    ? <img src={user.avatar} alt={user.username} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #30363d', flexShrink: 0 }} />
                    : <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#238636', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                      </div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{user?.username || '...'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Github size={11} color="#8b949e" />
                      <span style={{ fontSize: 11, color: '#8b949e' }}>Connected via GitHub</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                    backgroundColor: '#1a4731', color: '#3fb950', border: '1px solid #2ea04340', flexShrink: 0
                  }}>Active</div>
                </div>

                {/* Plan info */}
                <div style={{
                  padding: '14px', borderRadius: 6,
                  backgroundColor: '#161b22', border: '1px solid #21262d'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3' }}>Free Plan</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, backgroundColor: '#21262d', color: '#8b949e', border: '1px solid #30363d' }}>Current</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {['Up to 25 repositories', 'Weekly digest email', 'AI-powered analysis', '5 findings per report'].map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#3fb950', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#8b949e' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #21262d' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3' }}>Sign Out</div>
                    <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>Clear session and return to login</div>
                  </div>
                  <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                    backgroundColor: 'transparent', color: '#8b949e',
                    border: '1px solid #30363d', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#f85149'; e.currentTarget.style.color = '#f85149' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e' }}
                  >
                    <LogOut size={13} />Sign Out
                  </button>
                </div>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </div>
  )
}