import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'

export interface Customer {
  id: string
  store_id: string
  crm_contact_id: string | null
  name: string
  phone: string | null
  email: string | null
  total_orders: number
  total_spent: number
  last_order_at: string | null
  created_at: string
  created_by: string | null
}

export interface CustomerOrder {
  id: string
  order_number: string
  total_amount: number
  payment_method: string
  order_status: string
  created_at: string
}

// Shared demo stores — customers scoped by created_by
const DEMO_STORE_IDS = new Set([
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
])

export function useCustomers() {
  const { storeId } = useActiveStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetch = useCallback(async (silent = false) => {
    if (!storeId) { setCustomers([]); setLoading(false); return }
    if (!silent) setLoading(true)

    // On shared demo stores, only show this user's customers
    let userId: string | null = null
    if (DEMO_STORE_IDS.has(storeId)) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    }

    let query = supabase
      .from('customers')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('created_by', userId)
    }

    const { data, error } = await query
    if (!error) setCustomers((data ?? []) as Customer[])
    setLoading(false)
  }, [storeId])

  useEffect(() => { fetch() }, [fetch])

  // Deduplicate: same phone+name pair → merge (catches exact duplicates only)
  const deduped: Customer[] = (() => {
    const keyOf = (c: Customer) => {
      const phone = c.phone ? c.phone.replace(/\D/g, '') : ''
      const name = c.name.trim().toLowerCase()
      return phone ? `p:${phone}|n:${name}` : `n:${name}`
    }
    const map = new Map<string, Customer>()
    for (const c of customers) {
      const k = keyOf(c)
      if (!map.has(k)) {
        map.set(k, { ...c })
      } else {
        const existing = map.get(k)!
        // Merge: sum totals, take latest last_order_at, keep more recent entry's core data
        map.set(k, {
          ...existing,
          total_orders: existing.total_orders + c.total_orders,
          total_spent: Math.round((existing.total_spent + c.total_spent) * 100) / 100,
          last_order_at: existing.last_order_at && c.last_order_at
            ? (existing.last_order_at > c.last_order_at ? existing.last_order_at : c.last_order_at)
            : (existing.last_order_at ?? c.last_order_at),
        })
      }
    }
    return Array.from(map.values())
  })()

  const filtered = deduped.filter(c => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    )
  })

  async function fetchOrders(customerId: string, phone?: string | null): Promise<CustomerOrder[]> {
    const cols = 'id, order_number, total_amount, payment_method, order_status, created_at'

    const { data: byId } = await supabase
      .from('orders')
      .select(cols)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50)

    const all: CustomerOrder[] = [...((byId ?? []) as CustomerOrder[])]

    if (phone) {
      const { data: byPhone } = await supabase
        .from('orders')
        .select(cols)
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false })
        .limit(50)
      const seen = new Set(all.map(o => o.id))
      for (const o of (byPhone ?? []) as CustomerOrder[]) {
        if (!seen.has(o.id)) all.push(o)
      }
    }

    return all
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50)
  }

  async function updateCustomer(
    id: string,
    updates: Partial<Pick<Customer, 'name' | 'email' | 'phone'>>
  ): Promise<Customer | null> {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('updateCustomer error:', error)
      await fetch(true)
      return null
    }
    const fresh = data as Customer
    setCustomers(prev => prev.map(c => c.id === id ? fresh : c))
    return fresh
  }

  return {
    customers: deduped, filtered, loading,
    search, setSearch,
    fetchOrders, updateCustomer,
    refetch: fetch,
  }
}
