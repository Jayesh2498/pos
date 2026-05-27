import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'

export interface DashboardStats {
  todaySales: number
  todayOrders: number
  avgOrderValue: number
  totalCustomers: number
  weekSales: number
  weekOrders: number
}

export interface TopProduct {
  product_name_snapshot: string
  total_qty: number
  total_revenue: number
}

export interface HourlySale {
  hour: string
  revenue: number
  orders: number
}

export interface DailySale {
  date: string
  revenue: number
  orders: number
}

export type DashboardRange = 'today' | '7d' | '30d'

export function useDashboard() {
  const { storeId } = useActiveStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [hourlyData, setHourlyData] = useState<HourlySale[]>([])
  const [dailyData, setDailyData] = useState<DailySale[]>([])
  const [range, setRange] = useState<DashboardRange>('today')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!storeId) {
      setStats({ todaySales: 0, todayOrders: 0, avgOrderValue: 0, totalCustomers: 0, weekSales: 0, weekOrders: 0 })
      setTopProducts([])
      setHourlyData([])
      setDailyData([])
      setLoading(false)
      return
    }

    setLoading(true)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(Date.now() - 6 * 86400000).toISOString()
    const monthStart = new Date(Date.now() - 29 * 86400000).toISOString()
    const rangeStart = range === 'today' ? todayStart : range === '7d' ? weekStart : monthStart

    // Parallel fetches
    const [
      { data: todayOrders },
      { data: weekOrders },
      { data: rangeOrdersData },
      { data: topProductsData },
      { count: customerCount },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('total_amount')
        .eq('store_id', storeId)
        .eq('order_status', 'completed')
        .gte('created_at', todayStart),

      supabase
        .from('orders')
        .select('total_amount')
        .eq('store_id', storeId)
        .eq('order_status', 'completed')
        .gte('created_at', weekStart),

      supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .eq('store_id', storeId)
        .eq('order_status', 'completed')
        .gte('created_at', rangeStart)
        .order('created_at'),

      supabase
        .from('order_items')
        .select('product_name_snapshot, quantity, line_total, order:orders!inner(store_id, order_status, created_at)')
        .eq('order.store_id', storeId)
        .eq('order.order_status', 'completed')
        .gte('order.created_at', rangeStart),

      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId),
    ])

    // Stats
    const todaySales = (todayOrders ?? []).reduce((s: number, o: { total_amount: number }) => s + o.total_amount, 0)
    const todayCount = (todayOrders ?? []).length
    const weekSales = (weekOrders ?? []).reduce((s: number, o: { total_amount: number }) => s + o.total_amount, 0)
    const weekCount = (weekOrders ?? []).length

    const rangeOrders = rangeOrdersData ?? []
    const avgOrderValue = rangeOrders.length
      ? rangeOrders.reduce((s: number, o: { total_amount: number }) => s + o.total_amount, 0) / rangeOrders.length
      : 0

    setStats({
      todaySales,
      todayOrders: todayCount,
      avgOrderValue,
      totalCustomers: customerCount ?? 0,
      weekSales,
      weekOrders: weekCount,
    })

    // Top products
    const productMap = new Map<string, { total_qty: number; total_revenue: number }>()
    for (const item of (topProductsData ?? []) as Array<{ product_name_snapshot: string; quantity: number; line_total: number }>) {
      const existing = productMap.get(item.product_name_snapshot) ?? { total_qty: 0, total_revenue: 0 }
      productMap.set(item.product_name_snapshot, {
        total_qty: existing.total_qty + item.quantity,
        total_revenue: existing.total_revenue + item.line_total,
      })
    }
    const sorted = Array.from(productMap.entries())
      .map(([name, v]) => ({ product_name_snapshot: name, ...v }))
      .sort((a, b) => b.total_revenue - a.total_revenue || b.total_qty - a.total_qty)
      .slice(0, 6)
    setTopProducts(sorted)

    // Chart data — hourly for today, daily for 7d/30d
    if (range === 'today') {
      const buckets: Record<string, HourlySale> = {}
      for (let h = 0; h < 24; h++) {
        const label = `${h.toString().padStart(2, '0')}:00`
        buckets[h] = { hour: label, revenue: 0, orders: 0 }
      }
      for (const o of rangeOrders as Array<{ total_amount: number; created_at: string }>) {
        const h = new Date(o.created_at).getHours()
        buckets[h].revenue = round(buckets[h].revenue + o.total_amount)
        buckets[h].orders += 1
      }
      const currentHour = now.getHours()
      setHourlyData(Object.values(buckets).slice(0, currentHour + 1))
      setDailyData([])
    } else {
      const days = range === '7d' ? 7 : 30
      const buckets: Record<string, DailySale> = {}
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        const key = d.toISOString().slice(0, 10)
        buckets[key] = {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: 0,
          orders: 0,
        }
      }
      for (const o of rangeOrders as Array<{ total_amount: number; created_at: string }>) {
        const key = o.created_at.slice(0, 10)
        if (buckets[key]) {
          buckets[key].revenue = round(buckets[key].revenue + o.total_amount)
          buckets[key].orders += 1
        }
      }
      setDailyData(Object.values(buckets))
      setHourlyData([])
    }

    setLoading(false)
  }, [storeId, range])

  useEffect(() => { load() }, [load])

  return { stats, topProducts, hourlyData, dailyData, range, setRange, loading, refetch: load }
}

function round(n: number) { return Math.round(n * 100) / 100 }
