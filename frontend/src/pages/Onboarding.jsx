import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockRepos, mockUser } from '../store/mockData'
import { ChevronLeft, ChevronRight, Activity, Github, Check } from 'lucide-react'

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
      style={{ backgroundColor: enabled ? '#6366F1' : '#1E293B', border: '1px solid', borderColor: enabled ? '#6366F1' : '#334155' }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200 shadow-sm"
        style={{ left: enabled ? '22px' : '2px' }}
      />
    </button>
  )
}

const stepInfo = [
  { num: 1, label: 'Select repos' },
  { num: 2, label: 'Mark production' },
  { num: 3, label: 'Confirm email' },
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [selectedRepos, setSelectedRepos] = useState(mockRepos.map(r => r.id)) // all selected by default
  const [productionRepos, setProductionRepos] = useState([])
  const [email, setEmail] = useState(mockUser.email)
  const navigate = useNavigate()

  const toggleRepo = (id) => setSelectedRepos(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  )

  const toggleProduction = (id) => setProductionRepos(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#0A0805' }}>

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #C2410C30 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, #6366F115 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, #92400E08 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-[#6366F1] flex items-center justify-center"
            style={{ boxShadow: '0 0 20px #6366F140' }}>
            <Activity size={15} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Driftless</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#0F0C0A', border: '1px solid #2D1A0E' }}>

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-8">
            {stepInfo.map(({ num, label }, i) => (
              <div key={num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
                    style={{
                      backgroundColor: step > num ? '#6366F1' : step === num ? '#6366F1' : '#1A1008',
                      border: `2px solid ${step >= num ? '#6366F1' : '#2D1A0E'}`,
                      color: step >= num ? 'white' : '#4A3520'
                    }}
                  >
                    {step > num ? <Check size={12} /> : num}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:block"
                    style={{ color: step >= num ? '#94A3B8' : '#3D2A18' }}>{label}</span>
                </div>
                {i < stepInfo.length - 1 && (
                  <div className="w-16 h-px mx-2 mb-4 transition-all duration-300"
                    style={{ backgroundColor: step > num ? '#6366F1' : '#2D1A0E' }} />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Select repositories</h2>
                <p className="text-sm" style={{ color: '#6B4A30' }}>Choose which repos Driftless should monitor</p>
              </div>
              <div className="space-y-2">
                {mockRepos.map(repo => (
                  <div key={repo.id}
                    className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-150"
                    style={{
                      backgroundColor: selectedRepos.includes(repo.id) ? '#1A0F06' : '#0D0A07',
                      border: `1px solid ${selectedRepos.includes(repo.id) ? '#C2410C40' : '#1E1208'}`,
                    }}
                    onClick={() => toggleRepo(repo.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#1E1208', border: '1px solid #2D1A0E' }}>
                        <Github size={14} style={{ color: '#6B4A30' }} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{repo.name}</div>
                        <div className="text-xs" style={{ color: '#4A3520' }}>{repo.fullName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: '#1E1208', color: '#6B4A30', border: '1px solid #2D1A0E' }}>
                        {repo.language}
                      </span>
                      <Toggle enabled={selectedRepos.includes(repo.id)} onToggle={() => toggleRepo(repo.id)} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: '#3D2A18' }}>
                {selectedRepos.length} of {mockRepos.length} repositories selected
              </p>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Mark production repos</h2>
                <p className="text-sm" style={{ color: '#6B4A30' }}>Production repos get priority in your weekly report</p>
              </div>
              <div className="space-y-2">
                {mockRepos.filter(r => selectedRepos.includes(r.id)).map(repo => (
                  <div key={repo.id}
                    className="flex items-center justify-between p-4 rounded-xl transition-all duration-150"
                    style={{
                      backgroundColor: productionRepos.includes(repo.id) ? '#1A0F06' : '#0D0A07',
                      border: `1px solid ${productionRepos.includes(repo.id) ? '#C2410C40' : '#1E1208'}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#1E1208', border: '1px solid #2D1A0E' }}>
                        <Github size={14} style={{ color: '#6B4A30' }} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{repo.name}</div>
                        <div className="text-xs" style={{ color: '#4A3520' }}>{repo.language}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {productionRepos.includes(repo.id) && (
                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                          style={{ backgroundColor: '#C2410C20', color: '#FB923C', border: '1px solid #C2410C40' }}>
                          Production
                        </span>
                      )}
                      <Toggle enabled={productionRepos.includes(repo.id)} onToggle={() => toggleProduction(repo.id)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#1A0F06', border: '1px solid #2D1A0E' }}>
                <p className="text-xs" style={{ color: '#6B4A30' }}>
                  💡 Production repos with critical CVEs will always appear first in your Sunday digest.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Confirm your email</h2>
                <p className="text-sm" style={{ color: '#6B4A30' }}>We'll send your Sunday morning health digest here</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: '#4A3520' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all"
                    style={{ backgroundColor: '#0D0A07', border: '1px solid #2D1A0E', caretColor: '#FB923C' }}
                    onFocus={e => e.target.style.borderColor = '#C2410C'}
                    onBlur={e => e.target.style.borderColor = '#2D1A0E'}
                  />
                </div>

                {/* Summary */}
                <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#0D0A07', border: '1px solid #1E1208' }}>
                  <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#4A3520' }}>Summary</p>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B4A30' }}>Repos monitored</span>
                    <span className="text-white font-medium">{selectedRepos.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B4A30' }}>Production repos</span>
                    <span className="text-white font-medium">{productionRepos.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B4A30' }}>Digest schedule</span>
                    <span className="text-white font-medium">Every Sunday, 8:00 AM</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ color: '#4A3520' }}
              onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
              onMouseLeave={e => e.currentTarget.style.color = '#4A3520'}
            >
              <ChevronLeft size={15} />
              {step === 1 ? 'Back to login' : 'Back'}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{ backgroundColor: '#C2410C', boxShadow: '0 0 20px #C2410C30' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B91C1C'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C2410C'}
              >
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{ backgroundColor: '#C2410C', boxShadow: '0 0 20px #C2410C30' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B91C1C'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C2410C'}
              >
                Start Monitoring →
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#2D1A0E' }}>
          Connected as <span style={{ color: '#4A3520' }}>{mockUser.username}</span> via GitHub
        </p>
      </div>
    </div>
  )
}