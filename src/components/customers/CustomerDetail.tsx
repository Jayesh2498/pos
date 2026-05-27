import { useState, useEffect } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import type { Customer, CustomerOrder } from '@/hooks/use-customers'
import { currencySymbol } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'

interface Props {
  customer: Customer
  onFetchOrders: (customerId: string, phone?: string | null) => Promise<CustomerOrder[]>
  onUpdate: (id: string, updates: Partial<Pick<Customer, 'name' | 'email' | 'phone'>>) => Promise<boolean>
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function CustomerDetail({ customer, onFetchOrders, onUpdate }: Props) {
  const { store } = useStore()
  const sym = currencySymbol(store?.currency ?? 'USD')

  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(customer.name)
  const [editEmail, setEditEmail] = useState(customer.email ?? '')
  const [editPhone, setEditPhone] = useState(customer.phone ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEditName(customer.name)
    setEditEmail(customer.email ?? '')
    setEditPhone(customer.phone ?? '')
    setEditing(false)
    setLoadingOrders(true)
    onFetchOrders(customer.id, customer.phone).then(data => {
      setOrders(data)
      setLoadingOrders(false)
    })
  }, [customer.id])

  async function handleSave() {
    setSaving(true)
    await onUpdate(customer.id, { name: editName, email: editEmail || null, phone: editPhone || null } as Partial<Pick<Customer, 'name' | 'email' | 'phone'>>)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="cust-detail">
      {/* Header */}
      <div className="cust-detail-header">
        <div className="cust-detail-avatar">{initials(customer.name)}</div>
        <div>
          <h2 className="cust-detail-name">{customer.name}</h2>
          <p className="cust-detail-meta">
            {customer.phone ?? customer.email ?? 'No contact info'}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="prd-btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? <X size={13} /> : 'Edit'}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="cust-detail-card" style={{ marginBottom: 16 }}>
          <p className="cust-detail-card-title">Edit Contact</p>
          <div className="cust-edit-field">
            <label className="cust-edit-label">Name</label>
            <input className="cust-edit-input" value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div className="cust-edit-field">
            <label className="cust-edit-label">Phone</label>
            <input className="cust-edit-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
          </div>
          <div className="cust-edit-field">
            <label className="cust-edit-label">Email</label>
            <input className="cust-edit-input" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="pos-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="cust-detail-card">
        <p className="cust-detail-card-title">Overview</p>
        <div className="cust-detail-row"><span>Total orders</span><span>{customer.total_orders}</span></div>
        <div className="cust-detail-row"><span>Total spent</span><span>{sym}{customer.total_spent.toFixed(2)}</span></div>
        {customer.last_order_at && (
          <div className="cust-detail-row">
            <span>Last order</span>
            <span>{new Date(customer.last_order_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="cust-detail-card">
        <p className="cust-detail-card-title">Order History</p>
        {loadingOrders ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No orders yet</p>
        ) : (
          orders.map(o => (
            <div key={o.id} className="cust-order-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'monospace', fontSize: 12, margin: 0, color: 'var(--color-text-primary)', fontWeight: 600 }}>{o.order_number}</p>
                <p style={{ fontSize: 11, margin: 0, color: 'var(--color-text-secondary)' }}>{new Date(o.created_at).toLocaleString()}</p>
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>{sym}{o.total_amount.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
