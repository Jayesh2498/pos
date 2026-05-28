import { useState } from 'react'
import { Search, ClipboardList, Loader2, TrendingUp, ShoppingBag, DollarSign, ArrowLeft } from 'lucide-react'
import { useOrders, type Order, type DateFilter, type StatusFilter } from '@/hooks/use-orders'
import OrderList from '@/components/orders/OrderList'
import OrderDetail from '@/components/orders/OrderDetail'
import { useStore } from '@/hooks/use-store'
import { currencySymbol } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

const DATE_OPTS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d',    label: 'Last 7 days' },
  { value: '30d',   label: 'Last 30 days' },
  { value: 'all',   label: 'All time' },
]

const STATUS_OPTS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'open',      label: 'Open' },
  { value: 'voided',    label: 'Voided' },
  { value: 'refunded',  label: 'Refunded' },
]

export default function Orders() {
  const {
    filtered, loading, stats,
    search, setSearch,
    dateFilter, setDateFilter,
    statusFilter, setStatusFilter,
    fetchOrderItems, fetchReceipt, voidOrder,
    resolveCustomer,
  } = useOrders()
  const { store } = useStore()
  const sym = currencySymbol(store?.currency ?? 'USD')
  const isMobile = useIsMobile()

  const [selected, setSelected] = useState<Order | null>(null)

  function handleSelect(o: Order) {
    setSelected(o)
  }

  function handleBack() {
    setSelected(null)
  }

  async function handleVoid(id: string) {
    await voidOrder(id)
    setSelected(prev => prev?.id === id ? { ...prev, order_status: 'voided' } : prev)
  }

  // On mobile: show detail panel when order selected, list otherwise
  const showList   = !isMobile || !selected
  const showDetail = !isMobile || !!selected

  return (
    <div className={`ord-layout${selected ? ' ord-layout--detail' : ''}`}>

      {/* ── Left panel ── */}
      {showList && (
        <div className="ord-left">

          {/* Header + stats */}
          <div className="ord-panel-header">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={15} strokeWidth={2} className="text-blue-500" />
              <h2 className="ord-panel-title">Orders</h2>
              {!loading && <span className="ord-count-badge">{filtered.length}</span>}
            </div>

            {/* Mini stats */}
            <div className="ord-mini-stats">
              <div className="ord-mini-stat">
                <ShoppingBag size={12} className="text-blue-400" />
                <span>{stats.count}</span>
              </div>
              <div className="ord-mini-stat">
                <DollarSign size={12} className="text-green-500" />
                <span>{sym}{stats.total.toFixed(2)}</span>
              </div>
              <div className="ord-mini-stat">
                <TrendingUp size={12} className="text-purple-400" />
                <span>avg {sym}{stats.avgOrder.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="ord-filters">
            {/* Date pills */}
            <div className="ord-date-pills">
              {DATE_OPTS.map(d => (
                <button
                  key={d.value}
                  className={`ord-date-pill ${dateFilter === d.value ? 'ord-date-pill--active' : ''}`}
                  onClick={() => setDateFilter(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="ord-search-wrap">
              <Search size={13} className="ord-search-icon" />
              <input
                className="ord-search-input"
                placeholder="Order # or customer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select
              className="ord-status-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            >
              {STATUS_OPTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* List */}
          <div className="ord-list-scroll">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : (
              <OrderList
                orders={filtered}
                selectedId={selected?.id ?? null}
                onSelect={handleSelect}
                resolveCustomer={resolveCustomer}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Right panel ── */}
      {showDetail && (
        <div className="ord-right">
          {selected ? (
            <>
              {/* Mobile back button */}
              {isMobile && (
                <button className="ord-mobile-back" onClick={handleBack}>
                  <ArrowLeft size={15} /> Back to Orders
                </button>
              )}
              <OrderDetail
                key={selected.id}
                order={selected}
                onFetchItems={fetchOrderItems}
                onFetchReceipt={fetchReceipt}
                onVoid={handleVoid}
                resolveCustomer={resolveCustomer}
              />
            </>
          ) : (
            <div className="ord-detail-empty">
              <div className="pos-empty-icon pos-empty-icon--blue mx-auto mb-3">
                <ClipboardList size={24} strokeWidth={1.8} />
              </div>
              <p className="text-sm font-medium text-gray-500">Select an order</p>
              <p className="text-xs text-gray-400 mt-1">Click any order to view its details and receipt.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
