type Row = Record<string, any>
type Db = Record<string, Row[]>

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000099'
const WORKSPACE_ID = '00000000-0000-0000-0000-000000000010'
const STORE_IDS = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
]

const now = () => new Date().toISOString()
const id = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

const initialDb = (): Db => ({
  stores: [
    store(STORE_IDS[0], 'Cafe', 'Cafe / Coffee Shop', '☕', '#7C3AED', 'INR'),
    store(STORE_IDS[1], 'Neon Bar', 'Bar / Pub', '🍺', '#EF4444', 'USD'),
    store(STORE_IDS[2], 'HealthPlus Pharmacy', 'Pharmacy', '💊', '#10B981', 'INR'),
    store(STORE_IDS[3], 'Gizmo Hub', 'Electronics', '📱', '#0EA5E9', 'USD'),
    store(STORE_IDS[4], 'Urban Threads', 'Clothing', '👕', '#EC4899', 'GBP'),
    store(STORE_IDS[5], 'Kirana Express', 'Retail Store', '🏪', '#F59E0B', 'INR'),
  ],
  categories: [
    category('Coffee', '☕', '#7C3AED', 0),
    category('Bakery', '🥐', '#F59E0B', 1),
    category('Food', '🥪', '#10B981', 2),
    category('Drinks', '🥤', '#0EA5E9', 3),
  ],
  products: [
    product('Espresso', 'CAF-001', 'Coffee', 120, 42, '8901001', 'Strong espresso shot', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80'),
    product('Cappuccino', 'CAF-002', 'Coffee', 180, 28, '8901002', 'Steamed milk classic', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80'),
    product('Iced Latte', 'CAF-003', 'Coffee', 220, 18, '8901003', 'Chilled latte with ice', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80'),
    product('Croissant', 'BAK-001', 'Bakery', 150, 16, '8902001', 'Buttery flaky pastry', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80'),
    product('Blueberry Muffin', 'BAK-002', 'Bakery', 140, 9, '8902002', 'Fresh baked muffin', 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80'),
    product('Veg Sandwich', 'FOO-001', 'Food', 260, 12, '8903001', 'Grilled veggie sandwich', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80'),
    product('Chocolate Cookie', 'BAK-003', 'Bakery', 90, 4, '8902003', 'Chewy chocolate chip cookie', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80'),
    product('Sparkling Water', 'DRK-001', 'Drinks', 80, 35, '8904001', 'Chilled sparkling water', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&q=80'),
    product('Avocado Toast', 'FOO-002', 'Food', 320, 8, '8903002', 'Sourdough with fresh avocado', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&q=80'),
    product('Green Tea', 'DRK-002', 'Drinks', 120, 22, '8904002', 'Hot Japanese green tea', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80'),
  ],
  customers: [],
  orders: [],
  order_items: [],
  receipts: [],
})

function store(id: string, store_name: string, store_type: string, icon: string, color: string, currency: string) {
  return {
    id,
    workspace_id: WORKSPACE_ID,
    store_name,
    currency,
    tax_type: 'exclusive',
    tax_value: currency === 'INR' ? 5 : 8,
    inventory_enabled: true,
    receipt_header: `${store_name}\nDemo Store`,
    receipt_footer: 'Thank you for your purchase!',
    icon,
    color,
    store_type,
    upi_id: currency === 'INR' ? 'demo@upi' : null,
    owner_id: null,
    created_at: now(),
  }
}

function category(name: string, icon: string, color: string, sort_order: number) {
  return {
    id: id(),
    workspace_id: WORKSPACE_ID,
    store_id: STORE_IDS[0],
    name,
    color,
    icon,
    sort_order,
    created_at: now(),
  }
}

function product(name: string, sku: string, category: string, price: number, stock_quantity: number, barcode: string, description: string, image_url?: string) {
  return {
    id: id(),
    store_id: STORE_IDS[0],
    name,
    sku,
    category,
    price,
    stock_quantity,
    is_active: true,
    image_url: image_url ?? null,
    barcode,
    description,
    created_at: now(),
  }
}

function customer(name: string, phone: string, email: string, total_orders: number, total_spent: number, crm_contact_id: string | null) {
  return {
    id: id(),
    store_id: STORE_IDS[0],
    crm_contact_id,
    name,
    phone,
    email,
    total_orders,
    total_spent,
    last_order_at: null,
    created_at: now(),
    created_by: DEMO_USER_ID,
  }
}

const DB_VERSION = 'v4'
const DB_KEY = `retail-pos-local-db-${DB_VERSION}`

function loadDb(): Db {
  // Clear legacy keys on version bump
  localStorage.removeItem('retail-pos-local-db')
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const db = initialDb()
    saveDb(db)
    localStorage.setItem('pos_active_store_id', STORE_IDS[0])
    return db
  }
  return JSON.parse(raw)
}

function saveDb(db: Db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function getValue(row: Row, key: string) {
  if (key.startsWith('order.')) {
    const order = loadDb().orders.find(o => o.id === row.order_id)
    return order?.[key.slice(6)]
  }
  return row[key]
}

class QueryBuilder implements PromiseLike<{ data: any; error: any; count?: number }> {
  private filters: Array<(row: Row) => boolean> = []
  private orderBy: Array<{ key: string; ascending: boolean }> = []
  private limitCount: number | null = null
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: any = null
  private singleMode: 'single' | 'maybeSingle' | null = null
  private countHead = false

  constructor(private table: string) {}

  select(_columns = '*', opts?: { count?: string; head?: boolean }) {
    this.mode = this.mode || 'select'
    this.countHead = Boolean(opts?.head)
    return this
  }

  insert(payload: any) {
    this.mode = 'insert'
    this.payload = payload
    return this
  }

  update(payload: any) {
    this.mode = 'update'
    this.payload = payload
    return this
  }

  delete() {
    this.mode = 'delete'
    return this
  }

  eq(key: string, value: any) {
    this.filters.push(row => getValue(row, key) === value)
    return this
  }

  gte(key: string, value: any) {
    this.filters.push(row => String(getValue(row, key)) >= String(value))
    return this
  }

  in(key: string, values: any[]) {
    this.filters.push(row => values.includes(getValue(row, key)))
    return this
  }

  or(expr: string) {
    const parts = expr.split(',').map(part => part.split('.'))
    this.filters.push(row => parts.some(([key, op, value]) => op === 'eq' && String(getValue(row, key)) === value))
    return this
  }

  order(key: string, opts?: { ascending?: boolean }) {
    this.orderBy.push({ key, ascending: opts?.ascending ?? true })
    return this
  }

  limit(n: number) {
    this.limitCount = n
    return this
  }

  single() {
    this.singleMode = 'single'
    return this
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle'
    return this
  }

  then<TResult1 = { data: any; error: any; count?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute() {
    const db = loadDb()
    db[this.table] ??= []

    if (this.mode === 'insert') {
      const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((row: Row) => ({
        id: row.id ?? id(),
        created_at: row.created_at ?? now(),
        ...row,
      }))
      db[this.table].push(...rows)
      saveDb(db)
      return { data: this.singleMode ? rows[0] : rows, error: null }
    }

    const matching = db[this.table].filter(row => this.filters.every(fn => fn(row)))

    if (this.mode === 'update') {
      db[this.table] = db[this.table].map(row => matching.includes(row) ? { ...row, ...this.payload } : row)
      saveDb(db)
      const updated = db[this.table].filter(row => matching.some(old => old.id === row.id))
      return { data: this.singleMode ? updated[0] : updated, error: null }
    }

    if (this.mode === 'delete') {
      db[this.table] = db[this.table].filter(row => !matching.includes(row))
      saveDb(db)
      return { data: null, error: null }
    }

    let data = matching.map(row => decorateRow(this.table, row, db))
    for (const sort of [...this.orderBy].reverse()) {
      data = data.sort((a, b) => {
        const av = getValue(a, sort.key) ?? ''
        const bv = getValue(b, sort.key) ?? ''
        return sort.ascending ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
    }
    if (this.limitCount !== null) data = data.slice(0, this.limitCount)
    if (this.countHead) return { data: null, error: null, count: data.length }
    if (this.singleMode === 'single') return { data: data[0] ?? null, error: data[0] ? null : { message: 'No rows' } }
    if (this.singleMode === 'maybeSingle') return { data: data[0] ?? null, error: null }
    return { data, error: null }
  }
}

function decorateRow(table: string, row: Row, db: Db) {
  if (table === 'orders') {
    return {
      ...row,
      customer: row.customer_id
        ? db.customers.find(c => c.id === row.customer_id) ?? null
        : null,
    }
  }
  if (table === 'order_items') {
    return {
      ...row,
      order: db.orders.find(o => o.id === row.order_id) ?? null,
    }
  }
  return { ...row }
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table)
  },
  auth: {
    async getSession() {
      const user = { id: DEMO_USER_ID, email: 'demo@retailpos.com' }
      return { data: { session: { user } }, error: null }
    },
    onAuthStateChange(callback: (_event: string, session: any) => void) {
      const user = { id: DEMO_USER_ID, email: 'demo@retailpos.com' }
      setTimeout(() => callback('SIGNED_IN', { user }), 0)
      return { data: { subscription: { unsubscribe() {} } } }
    },
    async getUser() {
      return { data: { user: { id: DEMO_USER_ID, email: 'demo@retailpos.com' } }, error: null }
    },
    async signInWithPassword(_creds?: { email: string; password: string }) {
      return { data: { user: { id: DEMO_USER_ID, email: 'demo@retailpos.com' } }, error: null as null | { message: string } }
    },
    async signUp(_creds?: { email: string; password: string }) {
      return { data: { user: { id: DEMO_USER_ID, email: 'demo@retailpos.com' } }, error: null as null | { message: string } }
    },
    async signOut() {
      return { error: null }
    },
  },
}
