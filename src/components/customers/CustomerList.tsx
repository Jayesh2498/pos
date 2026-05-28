import type { Customer } from '@/hooks/use-customers'

interface Props {
  customers: Customer[]
  selectedId: string | null
  onSelect: (c: Customer) => void
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function CustomerList({ customers, selectedId, onSelect }: Props) {
  if (customers.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        No customers found
      </div>
    )
  }

  return (
    <div>
      {customers.map(c => (
        <div
          key={c.id}
          className={`cust-item ${selectedId === c.id ? 'cust-item--selected' : ''}`}
          onClick={() => onSelect(c)}
        >
          <div className="cust-avatar">{initials(c.name)}</div>
          <div style={{ minWidth: 0 }}>
            <p className="cust-item-name">{c.name}</p>
            <p className="cust-item-meta">
              {c.phone ?? c.email ?? 'No contact'} · {c.total_orders} {c.total_orders === 1 ? 'order' : 'orders'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
