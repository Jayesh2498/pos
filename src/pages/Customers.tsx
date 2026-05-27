import { useState } from 'react'
import { Search, Users, Loader2 } from 'lucide-react'
import { useCustomers, type Customer } from '@/hooks/use-customers'
import CustomerList from '@/components/customers/CustomerList'
import CustomerDetail from '@/components/customers/CustomerDetail'

export default function Customers() {
  const {
    customers, filtered, loading,
    search, setSearch,
    fetchOrders, updateCustomer,
  } = useCustomers()

  // Store only the ID — always look up live data from the list
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = customers.find(c => c.id === selectedId) ?? null

  async function handleUpdate(
    id: string,
    updates: Partial<Pick<Customer, 'name' | 'email' | 'phone'>>
  ) {
    const fresh = await updateCustomer(id, updates)
    return fresh !== null
  }

  return (
    <div className="cust-layout">
      {/* ── Left panel: List ── */}
      <div className="cust-left">
        <div className="cust-panel-header">
          <div className="flex items-center gap-2">
            <Users size={15} strokeWidth={2} className="text-purple-500" />
            <h2 className="cust-panel-title">Customers</h2>
            {!loading && (
              <span className="cust-count-badge">{filtered.length}</span>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="cust-search-wrap">
            <Search size={14} className="cust-search-icon" />
            <input
              className="cust-search-input"
              placeholder="Search name, phone or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="cust-list-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : (
            <CustomerList
              customers={filtered}
              selectedId={selectedId}
              onSelect={c => setSelectedId(c.id)}
            />
          )}
        </div>
      </div>

      {/* ── Right panel: Detail ── */}
      <div className="cust-right">
        {selected ? (
          <CustomerDetail
            customer={selected}
            onFetchOrders={fetchOrders}
            onUpdate={handleUpdate}
          />
        ) : (
          <div className="cust-detail-empty">
            <div className="pos-empty-icon pos-empty-icon--purple mx-auto mb-3">
              <Users size={24} strokeWidth={1.8} />
            </div>
            <p className="text-sm font-medium text-gray-500">Select a customer</p>
            <p className="text-xs text-gray-400 mt-1">
              Click any customer to view their profile and order history.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
