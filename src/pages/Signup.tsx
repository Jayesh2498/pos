import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Eye, EyeOff, Loader2, Zap, BarChart3, Package, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const FEATURES = [
  { icon: Zap,       label: 'Lightning-fast checkout' },
  { icon: BarChart3, label: 'Real-time sales analytics' },
  { icon: Package,   label: 'Smart inventory tracking' },
  { icon: Users,     label: 'Customer management' },
]

export default function Signup() {
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [showCfm, setShowCfm]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [step, setStep]         = useState<'form' | 'creating'>('form')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password || !confirm) { setError('Please fill in all fields'); return }
    if (password !== confirm)  { setError('Passwords do not match'); return }
    if (password.length < 6)   { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    setStep('creating')

    const { data: authData, error: signupErr } = await supabase.auth.signUp({ email: email.trim(), password })

    if (signupErr || !authData.user) {
      const msg = signupErr?.message ?? 'Signup failed'
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('An account with this email already exists')
      } else if (msg.includes('password')) {
        setError('Password is too weak. Use at least 6 characters')
      } else {
        setError(msg)
      }
      setLoading(false)
      setStep('form')
      return
    }

    localStorage.setItem('pos_active_store_id', '00000000-0000-0000-0000-000000000001')
    navigate('/', { replace: true })
  }

  return (
    <div className="auth-root">
      <div className="auth-bg" />

      <div className="auth-wrap">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-left-brand">
              <div className="auth-brand-icon">
                <ShoppingCart size={22} strokeWidth={2.5} />
              </div>
              <span className="auth-brand-name">Retail POS</span>
            </div>
            <h2 className="auth-left-title">Start selling<br />in seconds</h2>
            <p className="auth-left-sub">Create your free account and get instant access to a fully loaded demo store.</p>
            <ul className="auth-features">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="auth-feature-item">
                  <span className="auth-feature-icon"><Icon size={14} strokeWidth={2.5} /></span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-brand auth-brand--mobile">
            <div className="auth-brand-icon">
              <ShoppingCart size={18} strokeWidth={2.5} />
            </div>
            <span className="auth-brand-name">Retail POS</span>
          </div>

          <div className="auth-heading">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-sub">Free forever. No credit card required.</p>
          </div>

          {step === 'creating' ? (
            <div className="auth-creating">
              <Loader2 size={36} className="animate-spin auth-creating-icon" />
              <p className="auth-creating-text">Setting up your store…</p>
              <p className="auth-creating-sub">Preparing your workspace with products and categories</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label">Email address</label>
                <input
                  className={`auth-input ${error ? 'auth-input--error' : ''}`}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  disabled={loading}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <input
                    className={`auth-input ${error ? 'auth-input--error' : ''}`}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    disabled={loading}
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Confirm password</label>
                <div className="auth-input-wrap">
                  <input
                    className={`auth-input ${error?.includes('match') ? 'auth-input--error' : ''}`}
                    type={showCfm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError('') }}
                    disabled={loading}
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowCfm(v => !v)} tabIndex={-1}>
                    {showCfm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create account →'}
              </button>
            </form>
          )}

          <p className="auth-footer-link" style={{ marginTop: step === 'creating' ? 0 : undefined }}>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
