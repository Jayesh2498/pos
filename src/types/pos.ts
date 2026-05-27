export type PaymentMethod = 'cash' | 'card' | 'mobile'

export interface Product {
  id: string
  store_id: string
  name: string
  sku: string | null
  category: string | null
  price: number
  stock_quantity: number
  is_active: boolean
  image_url: string | null
  barcode: string | null
  description: string | null
}

export interface CartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  stock_quantity: number
  line_total: number
}

export interface CustomerLookup {
  id: string
  name: string
  phone: string
  email: string | null
  total_orders: number
  total_spent: number
}

export interface Store {
  id: string
  workspace_id: string
  store_name: string
  currency: string
  tax_type: 'inclusive' | 'exclusive' | 'none'
  tax_value: number
  inventory_enabled: boolean
  receipt_header: string | null
  receipt_footer: string | null
  icon: string | null
  color: string | null
  store_type: string | null
  owner_id: string | null
}

export interface Category {
  id: string
  workspace_id: string
  store_id: string
  name: string
  color: string | null
  icon: string | null
  sort_order: number
  created_at: string
}