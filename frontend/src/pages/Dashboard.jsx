import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { mockReport } from '../store/mockData'
import { getToken, setToken, fetchRepos, runAnalysis } from '../store/api'
import {
  LayoutDashboard, FolderOpen, FileText, Settings,
  X, Loader2, Activity,
  AlertTriangle, CheckCircle2, Circle
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

function SidebarScene() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const GRID = 20
    const PIT_W = 34
    const CHARLIT = '#c9d1d9'
    const GREEN = '#238636'
    const GLIT = '#3fb950'
    const BLUE = '#58a6ff'
    const PURPLE = '#a371f7'
    const ORANGE = '#f0883e'

    const snippets = [
      'git push origin', 'merge conflict', 'pull request',
      'npm audit fix', 'dependency outdated', 'coverage: 12%',
      'build failed', 'force push', 'rebase -i HEAD',
      'needs review', 'stale branch', 'squash commits',
      'hotfix/urgent', 'null pointer', 'stack overflow',
    ]

    const W = () => canvas.width
    const H = () => canvas.height
    const GROUND = () => Math.floor(H() * 0.28)
    const CX = () => Math.floor(W() / 2)

    let t = 0
    let floaters = []
    let codeTimer = 0
    let pitScrollOffset = 0

    let charY = 0
    let charVY = 0
    let charRot = 0
    let charAlpha = 1
    let charMode = 'dig'
    let digT = 0
    let charSlipT = 0

    function resetChar() {
      charY = GROUND()
      charVY = 0
      charRot = 0
      charAlpha = 1
      charMode = 'dig'
      digT = 0
      charSlipT = 0
      floaters = []
      codeTimer = 0
      pitScrollOffset = 0
    }
    resetChar()

    function spawnFloater() {
      const txt = snippets[Math.floor(Math.random() * snippets.length)]
      const colors = [GLIT, BLUE, PURPLE, ORANGE, '#8b949e']
      floaters.push({
        text: txt,
        x: CX() + (Math.random() - 0.5) * 48,
        y: GROUND() - 10,
        vy: -0.48 - Math.random() * 0.38,
        vx: (Math.random() - 0.5) * 0.4,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 2,
      })
    }

    function drawGrid() {
      const W_ = W(), H_ = H()
      ctx.strokeStyle = '#161b22'
      ctx.lineWidth = 0.5
      for (let y = 0; y < H_; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W_, y); ctx.stroke()
      }
      for (let x = 0; x < W_; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H_); ctx.stroke()
      }
    }

    function drawScene() {
      const G = GROUND(), H_ = H(), W_ = W(), cx = CX()
      const px = cx - PIT_W / 2

      ctx.fillStyle = '#090c10'
      ctx.fillRect(0, G, W_, H_ - G)

      ctx.strokeStyle = '#0f1318'
      ctx.lineWidth = 0.5
      for (let y = G; y < H_; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W_, y); ctx.stroke()
      }
      for (let x = 0; x < W_; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, G); ctx.lineTo(x, H_); ctx.stroke()
      }

      ctx.fillStyle = '#010409'
      ctx.fillRect(px, G, PIT_W, H_ - G)

      ctx.save()
      ctx.beginPath(); ctx.rect(px, G, PIT_W, H_ - G); ctx.clip()
      ctx.strokeStyle = '#0d1117'
      ctx.lineWidth = 1
      const spacing = 16
      const off = pitScrollOffset % spacing
      for (let y = G + off; y < H_; y += spacing) {
        ctx.beginPath(); ctx.moveTo(px + 3, y); ctx.lineTo(px + PIT_W - 3, y); ctx.stroke()
      }
      ctx.restore()

      ctx.strokeStyle = '#21262d'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px, G); ctx.lineTo(px, H_)
      ctx.moveTo(px + PIT_W, G); ctx.lineTo(px + PIT_W, H_)
      ctx.stroke()

      ctx.beginPath(); ctx.moveTo(0, G); ctx.lineTo(px, G); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(px + PIT_W, G); ctx.lineTo(W_, G); ctx.stroke()

      const pulse = 0.04 + Math.abs(Math.sin(t * 0.035)) * 0.06
      ctx.fillStyle = `rgba(35,134,54,${pulse})`
      ctx.fillRect(px + 2, H_ - 18, PIT_W - 4, 18)

      ctx.fillStyle = '#1c2128'
      ctx.beginPath(); ctx.ellipse(cx - PIT_W / 2 - 13, G, 12, 6, 0, Math.PI, 0); ctx.fill()
      ctx.fillStyle = '#21262d'
      ctx.beginPath(); ctx.ellipse(cx + PIT_W / 2 + 8, G, 9, 4, 0, Math.PI, 0); ctx.fill()
    }

    function drawDigger() {
      const G = GROUND(), cx = CX()
      const arm = Math.sin(t * 0.22) * 0.55
      const lb = Math.sin(t * 0.22) * 1.2
      ctx.save()
      ctx.translate(cx, G)
      ctx.strokeStyle = CHARLIT; ctx.lineWidth = 1.8; ctx.lineCap = 'round'
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath(); ctx.ellipse(0, 2, 9, 2.5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -6); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-5, 2 + lb); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 2 - lb); ctx.stroke()
      ctx.save()
      ctx.translate(-3, -15); ctx.rotate(-0.35 + arm)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, 9); ctx.stroke()
      ctx.strokeStyle = '#6e7681'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(-8, 9); ctx.lineTo(-10, 17); ctx.stroke()
      ctx.fillStyle = '#6e7681'
      ctx.beginPath(); ctx.ellipse(-10, 19, 3.5, 2.2, -0.3, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      ctx.save()
      ctx.translate(3, -15); ctx.rotate(0.3 - arm * 0.4)
      ctx.strokeStyle = CHARLIT; ctx.lineWidth = 1.8
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, 7); ctx.stroke()
      ctx.restore()
      ctx.fillStyle = CHARLIT
      ctx.beginPath(); ctx.arc(0, -23, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#0d1117'
      ctx.beginPath(); ctx.arc(-1.5, -23.5, 0.8, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(1.5, -23.5, 0.8, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = GREEN
      ctx.beginPath(); ctx.ellipse(0, -27, 6, 2.5, 0, Math.PI, 0); ctx.fill()
      ctx.fillRect(-6, -28, 12, 2)
      ctx.restore()
    }

    function drawSlipping(slipT) {
      const G = GROUND(), cx = CX()

      if (slipT < 80) {
        // Phase 1: wobble in place — getting dizzy
        const wobble = Math.sin(slipT * 0.28) * (slipT / 80) * 5
        const sway = Math.sin(slipT * 0.15) * (slipT / 80) * 3
        ctx.save()
        ctx.translate(cx + sway, G)
        ctx.rotate(wobble * 0.045)
        ctx.strokeStyle = CHARLIT; ctx.lineWidth = 1.8; ctx.lineCap = 'round'
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)'
        ctx.beginPath(); ctx.ellipse(0, 2, 9, 2.5, 0, 0, Math.PI * 2); ctx.fill()
        // body
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -6); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-5, 2); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 2); ctx.stroke()
        // arms flailing
        const flail = Math.sin(slipT * 0.4) * 0.8
        ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(-12 - flail * 2, -4 + flail * 3); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(2, -14); ctx.lineTo(12 + flail * 2, -6 - flail * 2); ctx.stroke()
        // head
        ctx.fillStyle = CHARLIT
        ctx.beginPath(); ctx.arc(0, -23, 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = GREEN
        ctx.beginPath(); ctx.ellipse(0, -27, 6, 2.5, 0, Math.PI, 0); ctx.fill()
        ctx.fillRect(-6, -28, 12, 2)
        ctx.restore()

      } else if (slipT < 160) {
        // Phase 2: lean forward toward pit slowly
        const p = (slipT - 80) / 80
        const eased = p * p * (3 - 2 * p) // smooth ease in-out
        const tipRot = eased * 1.4
        const tipX = cx + eased * (PIT_W * 0.3)
        const tipY = G - eased * 8
        ctx.save()
        ctx.translate(tipX, tipY)
        ctx.rotate(tipRot)
        ctx.strokeStyle = CHARLIT; ctx.lineWidth = 1.8; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -6); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-5, 2); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 2); ctx.stroke()
        // arms out for balance
        ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(-14, -10); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(2, -14); ctx.lineTo(10, -4); ctx.stroke()
        ctx.fillStyle = CHARLIT
        ctx.beginPath(); ctx.arc(0, -23, 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = GREEN
        ctx.beginPath(); ctx.ellipse(0, -27, 6, 2.5, 0, Math.PI, 0); ctx.fill()
        ctx.fillRect(-6, -28, 12, 2)
        ctx.restore()

      } else {
        // Phase 3: transition to fall
        charMode = 'fall'
        charY = G
        charVY = 0.1
        charRot = 1.3
        floaters = []
        codeTimer = 0
        pitScrollOffset = 0
      }
    }

    function drawFalling() {
      const cx = CX(), H_ = H(), G = GROUND()
      ctx.save()
      ctx.globalAlpha = charAlpha
      ctx.beginPath()
      ctx.rect(cx - PIT_W / 2 + 1, G - 2, PIT_W - 2, H_ - G + 4)
      ctx.clip()
      ctx.translate(cx, charY)
      ctx.rotate(charRot)
      ctx.strokeStyle = CHARLIT; ctx.lineWidth = 1.8; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -5); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-6, 3); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(6, 1); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-2, -13); ctx.lineTo(-9, -6); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(2, -13); ctx.lineTo(8, -8); ctx.stroke()
      ctx.fillStyle = CHARLIT
      ctx.beginPath(); ctx.arc(0, -21, 4.5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = GREEN
      ctx.beginPath(); ctx.ellipse(0, -25, 5.5, 2.2, 0, Math.PI, 0); ctx.fill()
      ctx.fillRect(-5.5, -26, 11, 2)
      ctx.restore()
    }

    function drawFloaters() {
      for (const f of floaters) {
        ctx.save()
        ctx.globalAlpha = f.opacity * 0.82
        ctx.fillStyle = f.color
        ctx.font = `${f.size}px monospace`
        ctx.fillText(f.text, f.x, f.y)
        ctx.restore()
      }
    }

    function tick() {
      t++

      const zone = canvas.parentElement
      if (zone) {
        const nw = zone.clientWidth || 194
        const nh = zone.clientHeight || 400
        if (canvas.width !== nw || canvas.height !== nh) {
          canvas.width = nw
          canvas.height = nh
          resetChar()
        }
      }

      const H_ = H(), G = GROUND()

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W(), H_)
      drawGrid()
      drawScene()
      drawFloaters()

      for (const f of floaters) { f.y += f.vy; f.x += f.vx; f.opacity -= 0.007 }
      floaters = floaters.filter(f => f.opacity > 0)

      if (charMode === 'dig') {
        digT++
        codeTimer++
        if (codeTimer > 32) { spawnFloater(); codeTimer = 0 }
        drawDigger()
        if (digT > 500) {
          charMode = 'slip'
          charSlipT = 0
        }

      } else if (charMode === 'slip') {
        charSlipT++
        drawSlipping(charSlipT)

      } else {
        // fall
        charVY += 0.025
        charY += charVY
        charRot += 0.02 + charVY * 0.002
        pitScrollOffset += charVY * 0.2

        const fadeStart = H_ - (H_ - G) * 0.35
        charAlpha = charY > fadeStart
          ? Math.max(0, 1 - (charY - fadeStart) / ((H_ - G) * 0.35))
          : 1

        drawFalling()

        if (charAlpha <= 0 || charY > H_ + 10) {
          resetChar()
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    tick()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}

function Sidebar({ navigate, user, currentPath }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
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
      <nav style={{ padding: '8px' }}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = currentPath === path
          return (
            <button key={label} onClick={() => navigate(path)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', borderRadius: 6, fontSize: 14, fontWeight: 400,
              border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
              backgroundColor: active ? '#161b22' : 'transparent',
              color: active ? '#e6edf3' : '#8b949e', transition: 'all 0.15s'
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#161b22'; e.currentTarget.style.color = '#e6edf3' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b949e' }}}
            >
              <Icon size={16} />{label}
            </button>
          )
        })}
      </nav>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <SidebarScene />
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #21262d', position: 'relative' }}>
        {showUserMenu && (
          <div style={{
            position: 'absolute', bottom: 60, left: 12, right: 12,
            backgroundColor: '#161b22', border: '1px solid #30363d',
            borderRadius: 8, overflow: 'hidden', zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <button onClick={() => navigate('/settings')} style={{
              width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', fontSize: 13, textAlign: 'left'
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#21262d'; e.currentTarget.style.color = '#e6edf3' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b949e' }}
            >
              <Settings size={14} />Settings
            </button>
            <div style={{ height: 1, backgroundColor: '#21262d' }} />
            <button onClick={() => {
              localStorage.removeItem('driftless_token')
              localStorage.removeItem('driftless_results')
              localStorage.removeItem('driftless_repos')
              window.location.href = '/'
            }} style={{
              width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', color: '#f85149', fontSize: 13, textAlign: 'left'
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#21262d' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        )}
        <div onClick={() => setShowUserMenu(prev => !prev)} style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          padding: '4px 6px', borderRadius: 6, transition: 'background 0.15s'
        }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#161b22'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {user?.avatar
            ? <img src={user.avatar} alt={user.username} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #30363d' }} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#238636', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              </div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3' }}>{user?.username || '...'}</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, valueColor, icon: Icon, iconColor }) {
  return (
    <div style={{ backgroundColor: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '16px 20px' }}>
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
      transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#388bfd'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#21262d'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOpen size={15} color="#8b949e" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#58a6ff' }}>{repo.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8b949e', padding: '2px 8px', borderRadius: 20, border: '1px solid #21262d', backgroundColor: '#161b22' }}>
          <Circle size={7} fill={analyzed ? color : '#484f58'} color={analyzed ? color : '#484f58'} />
          {analyzed ? `${healthScore}/100` : 'Not analyzed'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {repo.language && repo.language !== 'Unknown' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Circle size={10} fill="#f0883e" color="#f0883e" />
            <span style={{ fontSize: 12, color: '#8b949e' }}>{repo.language}</span>
          </div>
        )}
        <span style={{ fontSize: 12, color: '#484f58' }}>{repo.lastAnalyzed || 'Never analyzed'}</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#8b949e' }}>Health score</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: analyzed ? color : '#484f58' }}>{analyzed ? `${healthScore}%` : '—'}</span>
        </div>
        <div style={{ height: 4, backgroundColor: '#21262d', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${healthScore}%`, backgroundColor: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
      </div>
      {analysisResult?.findings?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {analysisResult.findings.slice(0, 3).map((f, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, backgroundColor: getSeverityColor(f.severity) + '20', color: getSeverityColor(f.severity), textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {f.severity}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #21262d', paddingTop: 12, marginTop: 'auto' }}>
        {analysisResult ? (
          <button onClick={e => { e.stopPropagation(); navigate(`/report/${repo.id}`) }} style={{ flex: 1, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, backgroundColor: '#0d2a3d', color: '#58a6ff', border: '1px solid #1f6feb60', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#112d42'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0d2a3d'}
          >View Report</button>
        ) : (
          <button onClick={e => { e.stopPropagation(); onAnalyze(repo) }} disabled={analyzing} style={{ flex: 1, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, backgroundColor: '#238636', color: 'white', border: '1px solid #2ea043', cursor: 'pointer', opacity: analyzing ? 0.5 : 1 }}
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', right: 0, top: 0, height: '100%', width: 360, zIndex: 30, overflowY: 'auto', backgroundColor: '#0d1117', borderLeft: '1px solid #21262d' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', position: 'sticky', top: 0, backgroundColor: '#0d1117', borderBottom: '1px solid #21262d' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3' }}>{repo.name}</div>
            <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>{repo.full_name || repo.fullName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', padding: 4, borderRadius: 4 }}><X size={16} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: 8, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <HealthCircle score={healthScore} size={64} />
            <div>
              <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 4 }}>Health Score</div>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{healthScore > 80 ? 'Healthy' : healthScore >= 60 ? 'Needs Attention' : 'Critical'}</div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Issues</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {findings.slice(0, 3).map((f, i) => (
                <div key={i} style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, backgroundColor: getSeverityColor(f.severity) + '20', color: getSeverityColor(f.severity), textTransform: 'uppercase' }}>{f.severity}</span>
                    <span style={{ fontSize: 11, color: '#484f58' }}>{f.urgency}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>{f.title}</p>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => window.location.href = `/report/${repo.id}`} style={{ width: '100%', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, backgroundColor: '#238636', color: 'white', border: '1px solid #2ea043', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
    if (urlToken) { setToken(urlToken); window.history.replaceState({}, '', '/dashboard') }
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
        const mapped = data.map(r => ({
          id: String(r.id), name: r.name, fullName: r.full_name, full_name: r.full_name,
          language: r.language || 'Unknown', isProduction: false,
          healthScore: storedResults[String(r.id)]?.healthScore || 0,
          lastAnalyzed: storedResults[String(r.id)] ? 'Previously analyzed' : 'Not yet analyzed',
          security: 'healthy', currency: 'healthy', decay: 'healthy', updated_at: r.updated_at
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
      setRepos(prev => prev.map(r => r.id === repo.id ? { ...r, healthScore: result.healthScore, lastAnalyzed: 'Just now' } : r))
      const storedResults = JSON.parse(localStorage.getItem('driftless_results') || '{}')
      storedResults[repo.id] = result
      localStorage.setItem('driftless_results', JSON.stringify(storedResults))
    } catch (err) { console.error('Analysis failed', err) }
    finally { setAnalyzingRepo(null) }
  }

  const criticalCount = Object.values(analysisResults).flatMap(r => r.findings || []).filter(f => f.severity === 'critical').length
  const avgHealth = repos.length ? Math.round(repos.reduce((sum, r) => sum + (r.healthScore || 0), 0) / repos.length) : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#010409' }}>
      <style>{`
        @keyframes fade-pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes dot-left { 0%{transform:translateX(0);opacity:1;width:8px;height:8px} 25%{transform:translateX(16px);opacity:0.5;width:5px;height:5px} 50%{transform:translateX(0);opacity:0.2;width:3px;height:3px} 75%{transform:translateX(-16px);opacity:0.5;width:5px;height:5px} 100%{transform:translateX(0);opacity:1;width:8px;height:8px} }
        @keyframes dot-right { 0%{transform:translateX(0);opacity:0.2;width:3px;height:3px} 25%{transform:translateX(-16px);opacity:0.5;width:5px;height:5px} 50%{transform:translateX(0);opacity:1;width:8px;height:8px} 75%{transform:translateX(16px);opacity:0.5;width:5px;height:5px} 100%{transform:translateX(0);opacity:0.2;width:3px;height:3px} }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <div style={{ position: 'relative', width: 56, height: 100 }}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ position: 'absolute', top: i*12, left: 0, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
              <div style={{ borderRadius: '50%', backgroundColor: '#8b949e', animation: 'dot-left 1.6s ease-in-out infinite', animationDelay: `${i*0.1}s`, width: 8, height: 8 }} />
              <div style={{ width: 16, height: 1, background: 'linear-gradient(to right, rgba(139,148,158,0.3), rgba(139,148,158,0.05), rgba(139,148,158,0.3))' }} />
              <div style={{ borderRadius: '50%', backgroundColor: '#8b949e', animation: 'dot-right 1.6s ease-in-out infinite', animationDelay: `${i*0.1}s`, width: 3, height: 3 }} />
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
        <button onClick={() => window.location.href = 'https://driftless.onrender.com/auth/github'} style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: '#238636', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}>Login with GitHub</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#010409', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      <Sidebar navigate={navigate} user={user} currentPath="/dashboard" />
      <div style={{ flex: 1, marginLeft: 240, padding: '32px', maxWidth: 'calc(100% - 240px)' }}>
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #21262d' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#e6edf3', marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#8b949e' }}>Monitoring {repos.length} repositories · Welcome back, <span style={{ color: '#e6edf3' }}>{user?.username || '...'}</span></p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Repos Monitored" value={repos.length} icon={FolderOpen} />
          <StatCard label="Critical Issues" value={criticalCount} valueColor={criticalCount > 0 ? '#f85149' : '#3fb950'} icon={AlertTriangle} iconColor={criticalCount > 0 ? '#f85149' : '#8b949e'} />
          <StatCard label="Analyses Run" value={Object.keys(analysisResults).length} icon={Activity} iconColor="#388bfd" />
          <StatCard label="Avg Health" value={avgHealth ? `${avgHealth}` : '—'} valueColor={avgHealth ? getHealthColor(avgHealth) : '#8b949e'} icon={CheckCircle2} iconColor={avgHealth ? getHealthColor(avgHealth) : '#8b949e'} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>Repositories</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}>
            <CheckCircle2 size={12} color="#3fb950" />All systems monitored
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {repos.map(repo => (
            <RepoCard key={repo.id} repo={repo} onSelect={setSelectedRepo} onAnalyze={handleAnalyze}
              analyzing={analyzingRepo === repo.id} navigate={navigate} analysisResult={analysisResults[repo.id]} />
          ))}
        </div>
      </div>
      <SlidePanel repo={selectedRepo} onClose={() => setSelectedRepo(null)} analysisResult={selectedRepo ? analysisResults[selectedRepo.id] : null} />
    </div>
  )
}