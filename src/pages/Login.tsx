import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Eye, EyeOff, Loader2, Zap, BarChart3, Package, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const FEATURES = [
  { icon: Zap,       label: 'Lightning-fast checkout' },
  { icon: BarChart3, label: 'Real-time sales analytics' },
  { icon: Package,   label: 'Smart inventory tracking' },
  { icon: Users,     label: 'Customer management' },
]

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (err) {
      if (err.message.includes('Invalid login')) setError('Incorrect email or password')
      else setError(err.message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="auth-root">
      <div className="auth-bg" />

      <div className="auth-wrap">
        {/* ── Left panel (desktop only) ── */}
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-left-brand">
              <div className="auth-brand-icon">
                <ShoppingCart size={22} strokeWidth={2.5} />
              </div>
              <span className="auth-brand-name">Retail POS</span>
            </div>
            <h2 className="auth-left-title">Your complete<br />point-of-sale solution</h2>
            <p className="auth-left-sub">Everything you need to run your business, beautifully designed and ready to use.</p>
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

        {/* ── Right panel — card ── */}
        <div className="auth-card">
          {/* Mobile brand */}
          <div className="auth-brand auth-brand--mobile">
            <div className="auth-brand-icon">
              <ShoppingCart size={18} strokeWidth={2.5} />
            </div>
            <span className="auth-brand-name">Retail POS</span>
          </div>

          <div className="auth-heading">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Sign in to continue to your store</p>
          </div>

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
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  disabled={loading}
                />
                <button type="button" className="auth-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          {/* Demo box */}
          <div className="auth-demo-box">
            <p className="auth-demo-label">Try the demo</p>
            <div className="auth-demo-row">
              <span className="auth-demo-cred">demo@retailpos.com</span>
              <span className="auth-demo-dot">·</span>
              <span className="auth-demo-cred">pos12345</span>
            </div>
            <button
              className="auth-demo-fill"
              type="button"
              onClick={() => { setEmail('demo@retailpos.com'); setPassword('pos12345'); setError('') }}
            >
              Auto-fill &amp; sign in
            </button>
          </div>

          <p className="auth-footer-link">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
