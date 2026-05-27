import {
  DollarSign, ShoppingBag, TrendingUp, Users,
  RefreshCw, Loader2, ArrowUp, ArrowDown
} from 'lucide-react'
import { useDashboard, type DashboardRange } from '@/hooks/use-dashboard'
import { useStore } from '@/hooks/use-store'
import { formatCurrency } from '@/lib/utils'
import RevenueChart from '@/components/dashboard/RevenueChart'
import TopProducts from '@/components/dashboard/TopProducts'

const RANGE_OPTS: { value: DashboardRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d',    label: '7 days' },
  { value: '30d',   label: '30 days' },
]

export default function Dashboard() {
  const {
    stats, topProducts, hourlyData, dailyData,
    range, setRange, loading, refetch,
  } = useDashboard()
  const { store, loading: storeLoading } = useStore()

  // Don't fall back to USD — wait until the store is actually loaded
  const currency = store?.currency ?? null
  const isLoading = loading || storeLoading || !currency

  function fmt(amount: number) {
    return formatCurrency(amount, currency ?? 'USD')
  }

  // Delta label vs yesterday / prior week
  function deltaLabel(current: number, prior: number) {
    if (prior === 0) return null
    const pct = ((current - prior) / prior) * 100
    const up = pct >= 0
    return { pct: Math.abs(pct).toFixed(1), up }
  }

  const todayVsYest = stats ? deltaLabel(stats.todaySales, stats.weekSales / 7) : null

  return (
    <div className="pos-page max-w-6xl">
      {/* Header */}
      <div className="pos-page-header">
        <div>
          <h1 className="pos-page-title">Dashboard</h1>
          <p className="pos-page-subtitle">Sales analytics and store performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="dash-range-group">
            {RANGE_OPTS.map(r => (
              <button
                key={r.value}
                className={`dash-range-btn ${range === r.value ? 'dash-range-btn--active' : ''}`}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            className="prd-btn-secondary"
            onClick={refetch}
            disabled={isLoading}
            title="Refresh"
          >
            {isLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <RefreshCw size={14} />}
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="dash-stat-grid">
        <StatCard
          label={range === 'today' ? "Today's Sales" : range === '7d' ? '7-Day Sales' : '30-Day Sales'}
          value={isLoading ? null : fmt(range === 'today' ? stats?.todaySales ?? 0 : stats?.weekSales ?? 0)}
          sub={todayVsYest
            ? <span className={`dash-delta ${todayVsYest.up ? 'dash-delta--up' : 'dash-delta--down'}`}>
                {todayVsYest.up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                {todayVsYest.pct}% vs avg
              </span>
            : null}
          icon={<DollarSign size={18} strokeWidth={2} />}
          color="green"
        />
        <StatCard
          label="Orders"
          value={isLoading ? null : String(range === 'today' ? stats?.todayOrders ?? 0 : stats?.weekOrders ?? 0)}
          sub={<span className="text-xs text-gray-400">{range === 'today' ? 'today' : range === '7d' ? 'this week' : 'this month'}</span>}
          icon={<ShoppingBag size={18} strokeWidth={2} />}
          color="blue"
        />
        <StatCard
          label="Avg. Order Value"
          value={isLoading ? null : fmt(stats?.avgOrderValue ?? 0)}
          sub={<span className="text-xs text-gray-400">per completed order</span>}
          icon={<TrendingUp size={18} strokeWidth={2} />}
          color="purple"
        />
        <StatCard
          label="Total Customers"
          value={isLoading ? null : String(stats?.totalCustomers ?? 0)}
          sub={<span className="text-xs text-gray-400">all time</span>}
          icon={<Users size={18} strokeWidth={2} />}
          color="orange"
        />
      </div>

      {/* ── Charts + Top Products ── */}
      <div className="dash-bottom-grid">

        <div className="dash-card dash-card--chart">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              {range === 'today' ? 'Revenue by Hour' : 'Revenue by Day'}
            </h3>
            <p className="text-xs text-gray-400">Completed orders only</p>
          </div>
          <div className="px-5 pb-5">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 gap-2 text-gray-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading chart…
              </div>
            ) : (
              <RevenueChart
                hourly={hourlyData}
                daily={dailyData}
                range={range}
                currency={currency!}
              />
            )}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Top Products</h3>
            <p className="text-xs text-gray-400">by revenue</p>
          </div>
          <div className="px-5 pb-5">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 gap-2 text-gray-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : (
              <TopProducts products={topProducts} currency={currency!} />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string
  value: string | null
  sub?: React.ReactNode
  icon: React.ReactNode
  color: 'green' | 'blue' | 'purple' | 'orange'
}) {
  return (
    <div className="dash-stat-card">
      <div className={`dash-stat-icon dash-stat-icon--${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="dash-stat-label">{label}</p>
        {value === null ? (
          <div className="h-7 w-24 bg-gray-100 rounded-md animate-pulse mt-1" />
        ) : (
          <p className="dash-stat-value">{value}</p>
        )}
        {sub && <div className="mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}
