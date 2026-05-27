import { useEffect, useState } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import type { Order, OrderItem } from '@/hooks/use-orders'
import { currencySymbol } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'
import { buildReceiptHtml, printHtml } from '@/lib/receipt-printer'

interface Props {
  order: Order
  onFetchItems: (orderId: string) => Promise<OrderItem[]>
  onFetchReceipt: (orderId: string) => Promise<unknown>
  onVoid: (orderId: string) => Promise<void>
  resolveCustomer: (o: Order) => { name: string | null; phone: string | null; email: string | null }
}

export default function OrderDetail({ order, onFetchItems, onVoid, resolveCustomer }: Props) {
  const { store } = useStore()
  const sym = currencySymbol(store?.currency ?? 'USD')
  const [items, setItems] = useState<OrderItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [voiding, setVoiding] = useState(false)
  const [voidConfirm, setVoidConfirm] = useState(false)

  const { name, phone } = resolveCustomer(order)

  useEffect(() => {
    setLoadingItems(true)
    onFetchItems(order.id).then(data => {
      setItems(data)
      setLoadingItems(false)
    })
  }, [order.id])

  async function handleVoid() {
    if (!voidConfirm) {
      setVoidConfirm(true)
      setTimeout(() => setVoidConfirm(false), 3000)
      return
    }
    setVoiding(true)
    await onVoid(order.id)
    setVoiding(false)
    setVoidConfirm(false)
  }

  function handlePrint() {
    printHtml(buildReceiptHtml({
      storeName: store?.store_name ?? 'Store',
      orderNumber: order.order_number,
      date: new Date(order.created_at).toLocaleString(),
      paymentMethod: order.payment_method,
      customerName: name ?? 'Walk-in',
      customerPhone: phone ?? undefined,
      items: items.map(i => ({
        name: i.product_name_snapshot,
        quantity: i.quantity,
        price: i.price_snapshot,
        total: i.line_total,
      })),
      subtotal: order.subtotal,
      discountAmount: order.discount_amount,
      taxAmount: order.tax_amount,
      total: order.total_amount,
      currency: store?.currency ?? 'USD',
    }))
  }

  return (
    <div className="ord-detail">
      <div className="ord-detail-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <h2 className="ord-detail-num">{order.order_number}</h2>
          <span className={`ord-status-badge ${order.order_status === 'completed' ? 'ord-status--completed' : order.order_status === 'voided' ? 'ord-status--voided' : 'ord-status--open'}`}>
            {order.order_status}
          </span>
        </div>
        <p className="ord-detail-meta">
          {new Date(order.created_at).toLocaleString()} · {order.payment_method}
        </p>
      </div>

      {/* Customer */}
      {(name || phone) && (
        <div className="ord-detail-card">
          <p className="ord-detail-section-title">Customer</p>
          {name && <div className="ord-detail-row"><span>Name</span><span>{name}</span></div>}
          {phone && <div className="ord-detail-row"><span>Phone</span><span>{phone}</span></div>}
        </div>
      )}

      {/* Items */}
      <div className="ord-detail-card">
        <p className="ord-detail-section-title">Items</p>
        {loadingItems ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No items found</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="ord-detail-row">
              <span>{item.product_name_snapshot} ×{item.quantity}</span>
              <span>{sym}{item.line_total.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="ord-detail-card">
        <p className="ord-detail-section-title">Summary</p>
        <div className="ord-detail-row"><span>Subtotal</span><span>{sym}{order.subtotal.toFixed(2)}</span></div>
        {order.discount_amount > 0 && (
          <div className="ord-detail-row">
            <span>Discount</span>
            <span style={{ color: '#16A34A' }}>−{sym}{order.discount_amount.toFixed(2)}</span>
          </div>
        )}
        {order.tax_amount > 0 && (
          <div className="ord-detail-row"><span>Tax</span><span>{sym}{order.tax_amount.toFixed(2)}</span></div>
        )}
        <div className="ord-detail-row ord-detail-row--total">
          <span>Total</span><span>{sym}{order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="ord-print-btn" onClick={handlePrint}>
          <Printer size={14} /> Print Receipt
        </button>
        {order.order_status !== 'voided' && (
          <button className="ord-void-btn" onClick={handleVoid} disabled={voiding}>
            {voiding ? <Loader2 size={14} className="animate-spin" /> : null}
            {voidConfirm ? 'Confirm void?' : 'Void Order'}
          </button>
        )}
      </div>
    </div>
  )
}
