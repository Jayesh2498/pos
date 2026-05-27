import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, ClipboardList, Package, Tag, Users,
  BarChart3, Settings, LogOut, Home, Sun, Moon,
} from 'lucide-react'
import { useActiveStore } from '@/lib/active-store'
import { useStore } from '@/hooks/use-store'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'

const NAV_ITEMS = [
  { to: '/pos',              label: 'Checkout',   icon: ShoppingCart, end: true },
  { to: '/pos/orders',       label: 'Orders',     icon: ClipboardList },
  { to: '/pos/products',     label: 'Products',   icon: Package },
  { to: '/pos/categories',   label: 'Categories', icon: Tag },
  { to: '/pos/customers',    label: 'Customers',  icon: Users },
  { to: '/pos/dashboard',    label: 'Dashboard',  icon: BarChart3 },
  { to: '/pos/settings',     label: 'Settings',   icon: Settings },
]

const MOBILE_NAV = [
  { to: '/pos',           label: 'Checkout', icon: ShoppingCart, end: true },
  { to: '/pos/orders',    label: 'Orders',   icon: ClipboardList },
  { to: '/pos/products',  label: 'Products', icon: Package },
  { to: '/pos/customers', label: 'Customers',icon: Users },
  { to: '/pos/settings',  label: 'Settings', icon: Settings },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const { clearStoreId } = useActiveStore()
  const { store } = useStore()
  const { user } = useAuth()
  const { isDark, setMode } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    clearStoreId()
    navigate('/login', { replace: true })
  }

  function handleSwitchStore() {
    clearStoreId()
    navigate('/', { replace: true })
  }

  const storeColor = store?.color ?? '#7C3AED'
  const storeIcon  = store?.icon  ?? '🏪'

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="app-sidebar">
        {/* Brand */}
        <div className="app-sidebar-brand">
          <div
            className="app-sidebar-brand-icon"
            style={{ background: storeColor }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{storeIcon}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="app-sidebar-store-name">{store?.store_name ?? 'Retail POS'}</p>
            <p className="app-sidebar-store-type">{store?.store_type ?? 'Store'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="app-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `app-nav-item ${isActive ? 'app-nav-item--active' : ''}`
              }
            >
              <span className="app-nav-icon"><Icon size={16} strokeWidth={2} /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: email + actions */}
        <div className="app-sidebar-footer">
          {user?.email && (
            <p className="app-sidebar-email" title={user.email}>{user.email}</p>
          )}
          <button className="app-sidebar-footer-btn" onClick={() => setMode(isDark ? 'light' : 'dark')}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button className="app-sidebar-footer-btn" onClick={handleSwitchStore}>
            <Home size={14} />
            <span>Switch store</span>
          </button>
          <button className="app-sidebar-footer-btn app-sidebar-footer-btn--danger" onClick={handleLogout}>
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────── */}
      <nav className="app-mobile-nav">
        <div className="app-mobile-nav-inner">
          {MOBILE_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `app-mobile-nav-item ${isActive ? 'app-mobile-nav-item--active' : ''}`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
