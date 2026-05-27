import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'

export interface Order {
  id: string
  order_number: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  order_status: string
  created_at: string
  created_by: string | null
  customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer?: { name: string; phone: string | null; email: string | null } | null
}

export interface OrderItem {
  id: string
  product_name_snapshot: string
  price_snapshot: number
  quantity: number
  line_total: number
}

export interface Receipt {
  id: string
  receipt_number: string
  receipt_url: string | null
  sent_via: string
  sent_at: string | null
  created_at: string
}

export type DateFilter   = 'today' | '7d' | '30d' | 'all'
export type StatusFilter = 'all' | 'completed' | 'voided' | 'refunded' | 'open'

// DEMO store IDs (owner_id IS NULL) — orders/customers are scoped per user
const DEMO_STORE_IDS = new Set([
  '00000000-0000-0000-0000-000000000001', // SuperCafe
  '00000000-0000-0000-0000-000000000002', // Bar
  '00000000-0000-0000-0000-000000000003', // Pharmacy
  '00000000-0000-0000-0000-000000000004', // Electronics
  '00000000-0000-0000-0000-000000000005', // Clothing
  '00000000-0000-0000-0000-000000000006', // Kirana
])

export function useOrders() {
  const { storeId } = useActiveStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const fetchOrders = useCallback(async () => {
    if (!storeId) { setOrders([]); setLoading(false); return }
    setLoading(true)

    // On shared demo stores, only show this user's orders
    let userId: string | null = null
    if (DEMO_STORE_IDS.has(storeId)) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    }

    let query = supabase
      .from('orders')
      .select('*, customer:customers(name, phone, email)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('created_by', userId)
    }

    const now = new Date()
    if (dateFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      query = query.gte('created_at', start)
    } else if (dateFilter === '7d') {
      query = query.gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
    } else if (dateFilter === '30d') {
      query = query.gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
    }

    if (statusFilter !== 'all') {
      query = query.eq('order_status', statusFilter)
    }

    const { data } = await query.limit(200)
    setOrders((data ?? []) as Order[])
    setLoading(false)
  }, [storeId, dateFilter, statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  function resolveCustomer(o: Order) {
    const name  = o.customer?.name  ?? o.customer_name  ?? null
    const phone = o.customer?.phone ?? o.customer_phone ?? null
    const email = o.customer?.email ?? null
    return { name, phone, email }
  }

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const { name, phone } = resolveCustomer(o)
    return (
      o.order_number.toLowerCase().includes(q) ||
      (name  ?? '').toLowerCase().includes(q)  ||
      (phone ?? '').includes(q)
    )
  })

  const stats = {
    count:    filtered.length,
    total:    filtered.reduce((s, o) => s + o.total_amount, 0),
    avgOrder: filtered.length
      ? filtered.reduce((s, o) => s + o.total_amount, 0) / filtered.length
      : 0,
  }

  async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId)
    return (data ?? []) as OrderItem[]
  }

  async function fetchReceipt(orderId: string): Promise<Receipt | null> {
    const { data } = await supabase.from('receipts').select('*').eq('order_id', orderId).maybeSingle()
    return data as Receipt | null
  }

  async function voidOrder(orderId: string) {
    await supabase.from('orders').update({ order_status: 'voided' }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: 'voided' } : o))
  }

  return {
    orders, filtered, loading, stats,
    search, setSearch,
    dateFilter, setDateFilter,
    statusFilter, setStatusFilter,
    fetchOrderItems, fetchReceipt, voidOrder,
    resolveCustomer,
    refetch: fetchOrders,
  }
}
