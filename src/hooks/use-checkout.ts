import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { CartItem, CustomerLookup, PaymentMethod, Store } from '@/types/pos'

export interface CheckoutTotals {
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
}

function isValidPhone(p: string) {
  const digits = p.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

// Shared demo stores — orders/customers scoped per user
const DEMO_STORE_IDS = new Set([
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
])

export function useCheckout(store: Store | null) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discountInput, setDiscountInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [nameInput, setNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [customer, setCustomer] = useState<CustomerLookup | null>(null)
  const [customerLookupState, setCustomerLookupState] = useState<'idle' | 'found' | 'new'>('idle')
  const [completing, setCompleting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<{ order_number: string } | null>(null)

  // ── Cart helpers ──────────────────────────────────────────────
  const addToCart = useCallback((product: { id: string; name: string; price: number; stock_quantity: number }) => {
    if (product.stock_quantity === 0) return

    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, line_total: (i.quantity + 1) * i.price }
            : i
        )
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock_quantity: product.stock_quantity,
        line_total: product.price,
      }]
    })
  }, [])

  const updateQty = useCallback((product_id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.product_id !== product_id) return i
          const newQty = i.quantity + delta
          if (newQty > i.stock_quantity) return i
          return { ...i, quantity: newQty, line_total: newQty * i.price }
        })
        .filter(i => i.quantity > 0)
    )
  }, [])

  const removeItem = useCallback((product_id: string) => {
    setCart(prev => prev.filter(i => i.product_id !== product_id))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setDiscountInput('')
    setNameInput('')
    setPhoneInput('')
    setCustomer(null)
    setCustomerLookupState('idle')
    setPaymentMethod('cash')
    setCompletedOrder(null)
  }, [])

  // ── Totals ────────────────────────────────────────────────────
  const totals: CheckoutTotals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.line_total, 0)
    const discountPct = parseFloat(discountInput) || 0
    const discountAmount = subtotal * (Math.min(discountPct, 100) / 100)
    const afterDiscount = subtotal - discountAmount

    let taxAmount = 0
    if (store) {
      if (store.tax_type === 'exclusive') {
        taxAmount = afterDiscount * (store.tax_value / 100)
      } else if (store.tax_type === 'inclusive') {
        taxAmount = afterDiscount - afterDiscount / (1 + store.tax_value / 100)
      }
    }
    const total = store?.tax_type === 'inclusive'
      ? afterDiscount
      : afterDiscount + taxAmount

    return {
      subtotal: round(subtotal),
      discountAmount: round(discountAmount),
      taxAmount: round(taxAmount),
      total: round(total),
    }
  }, [cart, discountInput, store])

  // ── Customer lookup ───────────────────────────────────────────
  const lookupCustomer = useCallback(async (phone: string) => {
    if (!store || !isValidPhone(phone)) return

    const isDemo = DEMO_STORE_IDS.has(store.id)

    let query = supabase
      .from('customers')
      .select('id, name, phone, email, total_orders, total_spent')
      .eq('store_id', store.id)
      .eq('phone', phone)

    // On demo stores, only find this user's own customers
    if (isDemo) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) query = query.eq('created_by', user.id)
    }

    const { data } = await query.maybeSingle()

    if (data) {
      setCustomer(data as CustomerLookup)
      setCustomerLookupState('found')
      setNameInput((data as CustomerLookup).name)
    } else {
      setCustomer(null)
      setCustomerLookupState('new')
    }
  }, [store])

  // ── Complete sale ─────────────────────────────────────────────
  const completeSale = useCallback(async () => {
    if (!store || cart.length === 0) return
    setCompleting(true)
    try {
      const orderNumber = `ORD-${Date.now()}`
      const trimmedPhone = phoneInput.trim()
      const trimmedName  = nameInput.trim()
      const hasPhone     = isValidPhone(trimmedPhone)


      // Get current user ID (needed for demo store scoping)
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id ?? null

      let customerId: string | null = null
      let baseStats: { total_orders: number; total_spent: number } = { total_orders: 0, total_spent: 0 }

      if (hasPhone) {
        if (customer) {
          // Phone already registered — reuse existing customer, never rename
          customerId = customer.id
          baseStats = customer
        } else {
          // New phone — create customer record
          const insertPayload: Record<string, unknown> = {
            store_id: store.id,
            name: trimmedName || 'Guest',
            phone: trimmedPhone,
          }
          if (userId) insertPayload.created_by = userId
          const { data: newCust, error: custErr } = await supabase
            .from('customers')
            .insert(insertPayload)
            .select('id')
            .single()
          if (custErr) console.error('Customer insert error:', custErr)
          customerId = newCust?.id ?? null
        }
      }

      const orderPayload: Record<string, unknown> = {
        store_id: store.id,
        customer_id: customerId,
        customer_name: trimmedName || null,
        customer_phone: trimmedPhone || null,
        order_number: orderNumber,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
        payment_method: paymentMethod,
        payment_status: 'paid',
        order_status: 'completed',
      }
      // Always set created_by; DB trigger also does this as a fallback
      if (userId) orderPayload.created_by = userId

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id, order_number')
        .single()

      if (orderErr || !order) {
        console.error('Order insert error:', orderErr)
        throw orderErr
      }

      const { error: itemsErr } = await supabase.from('order_items').insert(
        cart.map(i => ({
          order_id: order.id,
          product_id: i.product_id,
          product_name_snapshot: i.name,
          price_snapshot: i.price,
          quantity: i.quantity,
          line_total: i.line_total,
        }))
      )
      if (itemsErr) console.error('Order items error:', itemsErr)

      // Inventory deduction — DB trigger silently ignores demo stores
      if (store.inventory_enabled) {
        for (const item of cart) {
          await supabase
            .from('products')
            .update({ stock_quantity: Math.max(0, item.stock_quantity - item.quantity) })
            .eq('id', item.product_id)
        }
      }

      if (customerId) {
        await supabase
          .from('customers')
          .update({
            total_orders: baseStats.total_orders + 1,
            total_spent: round(baseStats.total_spent + totals.total),
            last_order_at: new Date().toISOString(),
          })
          .eq('id', customerId)
      }

      await supabase.from('receipts').insert({
        order_id: order.id,
        receipt_number: `REC-${Date.now()}`,
        sent_via: 'none',
      })

      setCompletedOrder({ order_number: order.order_number })
    } catch (e) {
      console.error('Checkout completeSale error:', e)
    } finally {
      setCompleting(false)
    }
  }, [store, cart, totals, paymentMethod, nameInput, phoneInput, customer])

  return {
    cart, addToCart, updateQty, removeItem, clearCart,
    discountInput, setDiscountInput,
    paymentMethod, setPaymentMethod,
    nameInput, setNameInput,
    phoneInput, setPhoneInput,
    customer, customerLookupState, lookupCustomer,
    totals,
    completing, completeSale,
    completedOrder,
  }
}

function round(n: number) { return Math.round(n * 100) / 100 }
