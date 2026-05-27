import type { Order } from '@/hooks/use-orders'
import { currencySymbol } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'

interface Props {
  orders: Order[]
  selectedId: string | null
  onSelect: (o: Order) => void
  resolveCustomer: (o: Order) => { name: string | null; phone: string | null; email: string | null }
}

function statusClass(s: string) {
  if (s === 'completed') return 'ord-status--completed'
  if (s === 'voided')    return 'ord-status--voided'
  if (s === 'refunded')  return 'ord-status--refunded'
  return 'ord-status--open'
}

export default function OrderList({ orders, selectedId, onSelect, resolveCustomer }: Props) {
  const { store } = useStore()
  const sym = currencySymbol(store?.currency ?? 'USD')

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        No orders found
      </div>
    )
  }

  return (
    <div>
      {orders.map(o => {
        const { name } = resolveCustomer(o)
        return (
          <div
            key={o.id}
            className={`ord-item ${selectedId === o.id ? 'ord-item--selected' : ''}`}
            onClick={() => onSelect(o)}
          >
            <div className="ord-item-top">
              <span className="ord-item-number">{o.order_number}</span>
              <span className="ord-item-total">{sym}{o.total_amount.toFixed(2)}</span>
            </div>
            <div className="ord-item-meta">
              <span className="ord-item-customer">{name ?? 'Walk-in'}</span>
              <span className={`ord-status-badge ${statusClass(o.order_status)}`}>{o.order_status}</span>
            </div>
            <div className="ord-item-date" style={{ marginTop: 4 }}>
              {new Date(o.created_at).toLocaleString()}
            </div>
          </div>
        )
      })}
    </div>
  )
}
