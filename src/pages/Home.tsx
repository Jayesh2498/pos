import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart, ArrowRight, Trash2, X, Store, Check, LogOut, Sun, Moon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import type { Store as StoreType } from '@/types/pos'

const STORE_TYPES = [
  { label: 'Cafe / Coffee Shop', icon: '☕' },
  { label: 'Restaurant',         icon: '🍽️' },
  { label: 'Retail Store',       icon: '🛍️' },
  { label: 'Bakery',             icon: '🥐' },
  { label: 'Bar / Pub',          icon: '🍺' },
  { label: 'Food Truck',         icon: '🚚' },
  { label: 'Pharmacy',           icon: '💊' },
  { label: 'Electronics',        icon: '📱' },
  { label: 'Clothing',           icon: '👕' },
  { label: 'Other',              icon: '🏪' },
]

const CURRENCIES = [
  { code: 'USD', sym: '$' }, { code: 'EUR', sym: '€' }, { code: 'GBP', sym: '£' },
  { code: 'INR', sym: '₹' }, { code: 'AED', sym: 'د.إ' }, { code: 'SGD', sym: 'S$' },
  { code: 'AUD', sym: 'A$' }, { code: 'CAD', sym: 'C$' }, { code: 'JPY', sym: '¥' },
]

const PALETTE = [
  '#7C3AED', '#0EA5E9', '#F59E0B', '#EF4444',
  '#10B981', '#F97316', '#8B5CF6', '#06B6D4',
]

// All 6 demo stores — only visible to the demo account
const ALL_DEMO_IDS = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
]

// Cafe demo only — shown to all regular new users as a read-only reference
const SUPERCAFE_DEMO_ID = '00000000-0000-0000-0000-000000000001'

// Full set used for "is demo" guard (no deleting any demo store)
const DEMO_IDS = ALL_DEMO_IDS

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000099'

// ── New Profile Modal ──────────────────────────────────────────────
function NewProfileModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (store: StoreType) => void
}) {
  const [name, setName]         = useState('')
  const [type, setType]         = useState(STORE_TYPES[0])
  const [currency, setCurrency] = useState(CURRENCIES[3]) // default INR
  const [color, setColor]       = useState(PALETTE[0])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const { setStoreId }          = useActiveStore()
  const { user }                = useAuth()
  const navigate                = useNavigate()

  async function create() {
    if (!name.trim()) { setError('Store name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('stores').insert({
      store_name: name.trim(),
      currency: currency.code,
      tax_type: 'exclusive',
      tax_value: 0,
      inventory_enabled: true,
      icon: type.icon,
      color,
      store_type: type.label,
      owner_id: user?.id ?? null,
    }).select().single()

    if (err || !data) {
      setError(err?.message ?? 'Failed to create store')
      setSaving(false)
      return
    }
    setStoreId(data.id)
    onCreated(data as StoreType)
    navigate('/setup')
  }

  return (
    <div className="lp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="lp-modal">
        <div className="lp-modal-header">
          <div className="lp-modal-icon" style={{ background: color }}>
            <Store size={20} strokeWidth={2} className="text-white" />
          </div>
          <div>
            <h2 className="lp-modal-title">New Store Profile</h2>
            <p className="lp-modal-sub">You can change everything later in Settings</p>
          </div>
          <button className="lp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="lp-modal-body">
          <div className="lp-mfield">
            <label className="lp-mlabel">Store name <span className="text-red-500">*</span></label>
            <input
              className={`lp-minput ${error ? 'lp-minput--error' : ''}`}
              placeholder="e.g. My Coffee Shop"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && create()}
              autoFocus
            />
            {error && <p className="lp-merror">{error}</p>}
          </div>

          <div className="lp-mfield">
            <label className="lp-mlabel">Store type</label>
            <div className="lp-type-grid">
              {STORE_TYPES.map(t => (
                <button
                  key={t.label}
                  className={`lp-type-btn ${type.label === t.label ? 'lp-type-btn--active' : ''}`}
                  style={type.label === t.label ? { borderColor: color, background: color + '15' } : {}}
                  onClick={() => setType(t)}
                >
                  <span className="text-lg leading-none">{t.icon}</span>
                  <span className="lp-type-btn-label">{t.label.replace(' / ', '/\n')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lp-mfield">
            <label className="lp-mlabel">Currency</label>
            <div className="lp-currency-grid">
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  className={`lp-currency-btn ${currency.code === c.code ? 'lp-currency-btn--active' : ''}`}
                  style={currency.code === c.code ? { borderColor: color, background: color + '15' } : {}}
                  onClick={() => setCurrency(c)}
                >
                  <span className="lp-currency-sym">{c.sym}</span>
                  <span className="lp-currency-code">{c.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lp-mfield">
            <label className="lp-mlabel">Theme colour</label>
            <div className="lp-palette">
              {PALETTE.map(c => (
                <button
                  key={c}
                  className="lp-palette-dot"
                  style={{ background: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lp-modal-footer">
          <button className="lp-modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="lp-modal-create"
            style={{ background: !name.trim() || saving ? undefined : color }}
            disabled={!name.trim() || saving}
            onClick={create}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Create & Configure
                <ArrowRight size={15} />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Profile Card ───────────────────────────────────────────────────
function ProfileCard({ store, onSelect, onDelete, deleteConfirm }: {
  store: StoreType
  onSelect: () => void
  onDelete: () => void
  deleteConfirm: boolean
}) {
  const color  = store.color ?? '#7C3AED'
  const icon   = store.icon  ?? '🏪'
  const isDemo = DEMO_IDS.includes(store.id)

  return (
    <div className="lp-card" style={{ '--pc': color } as React.CSSProperties}>
      <div className="lp-card-glow" />
      <div className="lp-card-badges">
        {isDemo && <span className="lp-badge-demo">Demo</span>}
        {!isDemo && (
          <button
            className={`lp-card-del ${deleteConfirm ? 'lp-card-del--confirm' : ''}`}
            onClick={e => { e.stopPropagation(); onDelete() }}
            title={deleteConfirm ? 'Click again to confirm' : 'Delete profile'}
          >
            {deleteConfirm ? <><Trash2 size={11} /> Confirm?</> : <Trash2 size={12} />}
          </button>
        )}
      </div>
      <div className="lp-card-icon-wrap" style={{ background: color + '20' }}>
        <span className="text-4xl leading-none">{icon}</span>
      </div>
      <div className="lp-card-info">
        <p className="lp-card-name">{store.store_name}</p>
        <p className="lp-card-type">{store.store_type ?? 'Store'}</p>
        <span className="lp-card-currency" style={{ color, background: color + '15' }}>{store.currency}</span>
      </div>
      <button className="lp-card-open" style={{ background: color }} onClick={onSelect}>
        Open Store <ArrowRight size={13} />
      </button>
    </div>
  )
}

// ── Home Page ──────────────────────────────────────────────────────
export default function Home() {
  const [stores, setStores]               = useState<StoreType[]>([])
  const [loading, setLoading]             = useState(true)
  const [showModal, setShowModal]         = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const { setStoreId }                    = useActiveStore()
  const { user }                          = useAuth()
  const { setMode, isDark }               = useTheme()
  const navigate                          = useNavigate()

  // Live clock
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    if (!user) return
    loadStores()
  }, [user])

  async function loadStores() {
    if (!user) return
    setLoading(true)

    let query = supabase.from('stores').select('*').order('created_at')

    if (user.id === DEMO_USER_ID) {
      // demo account — show all 6 demo stores
      query = query.in('id', ALL_DEMO_IDS)
    } else {
      // Regular users — own stores + only the Cafe demo
      query = query.or(`owner_id.eq.${user.id},id.eq.${SUPERCAFE_DEMO_ID}`)
    }

    const { data } = await query
    setStores((data ?? []) as StoreType[])
    setLoading(false)
  }

  function handleSelect(store: StoreType) {
    setStoreId(store.id)
    navigate('/pos')
  }

  async function handleDelete(id: string) {
    if (DEMO_IDS.includes(id)) return // never delete demo stores
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }
    await supabase.from('stores').delete().eq('id', id)
    setStores(prev => prev.filter(s => s.id !== id))
    setDeleteConfirm(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="lp-root">
      <div className="lp-bg" />

      <header className="lp-header">
        {/* Brand */}
        <div className="lp-brand">
          <div className="lp-brand-icon">
            <ShoppingCart size={18} strokeWidth={2.5} />
          </div>
          <span className="lp-brand-name">Retail POS</span>
        </div>

        {/* Right controls */}
        <div className="lp-header-right">

          {/* Clock + date */}
          <div className="lp-clock">
            <span className="lp-clock-time">{timeStr}</span>
            <span className="lp-clock-date">{dateStr}</span>
          </div>

          <div className="lp-header-divider" />

          {/* Light / dark toggle */}
          <button
            className="lp-icon-btn"
            onClick={() => setMode(isDark ? 'light' : 'dark')}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>

          <div className="lp-header-divider" />

          {/* Logout */}
          <button className="lp-logout-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={15} strokeWidth={2} />
            <span>Sign out</span>
          </button>

        </div>
      </header>

      <section className="lp-hero">
        <h1 className="lp-hero-title">Your Stores</h1>
        <p className="lp-hero-sub">Select a profile to open, or create a new one</p>
      </section>

      <main className="lp-main">
        {loading ? (
          <div className="lp-loading">
            <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading stores…</span>
          </div>
        ) : (
          <div className="lp-grid">
            {stores.map(store => (
              <ProfileCard
                key={store.id}
                store={store}
                onSelect={() => handleSelect(store)}
                onDelete={() => handleDelete(store.id)}
                deleteConfirm={deleteConfirm === store.id}
              />
            ))}
            <button className="lp-new-tile" onClick={() => setShowModal(true)}>
              <div className="lp-new-tile-icon">
                <Plus size={24} strokeWidth={2} />
              </div>
              <p className="lp-new-tile-label">New Profile</p>
              <p className="lp-new-tile-sub">Set up a fresh store</p>
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <NewProfileModal
          onClose={() => setShowModal(false)}
          onCreated={store => {
            setStores(prev => [...prev, store])
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
