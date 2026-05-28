type Row = Record<string, any>
type Db = Record<string, Row[]>

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000099'
const WORKSPACE_ID = '00000000-0000-0000-0000-000000000010'
const STORE_IDS = [
  '00000000-0000-0000-0000-000000000001', // Cafe
  '00000000-0000-0000-0000-000000000002', // Neon Bar
  '00000000-0000-0000-0000-000000000003', // HealthPlus Pharmacy
  '00000000-0000-0000-0000-000000000004', // Gizmo Hub
  '00000000-0000-0000-0000-000000000005', // Urban Threads
  '00000000-0000-0000-0000-000000000006', // Kirana Express
]

const now = () => new Date().toISOString()
const id = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

// ── Cafe demo-data helpers ──────────────────────────────────────────────────
const CAFE_SID = STORE_IDS[0]

// Fixed customer UUIDs so order FK references are stable
const CC1 = '10000000-cafe-0000-0000-000000000001' // Priya Sharma
const CC2 = '10000000-cafe-0000-0000-000000000002' // Rahul Mehta
const CC3 = '10000000-cafe-0000-0000-000000000003' // Ananya Singh
const CC4 = '10000000-cafe-0000-0000-000000000004' // Vikram Nair
const CC5 = '10000000-cafe-0000-0000-000000000005' // Sunita Patel
const CC6 = '10000000-cafe-0000-0000-000000000006' // Arjun Kapoor
const CC7 = '10000000-cafe-0000-0000-000000000007' // Meera Iyer

/**
 * ISO timestamp for `daysBack` days ago at `hour` o'clock in the browser's
 * LOCAL timezone. Anchors to midnight so the result is always within the
 * correct calendar day regardless of the user's timezone.
 */
const dayAt = (daysBack: number, hour = 10, minute = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
// Keep tsAgo as an alias used by customer last_order_at
const tsAgo = (daysBack: number, _hoursBack = 0) => dayAt(daysBack, 12)

/** Round to 2 decimal places */
const r2 = (n: number) => Math.round(n * 100) / 100

/** Build a Cafe order + its order_items (5% exclusive tax, INR) */
function cafeOrder(
  ordId: string,
  custId: string | null,
  custName: string | null,
  custPhone: string | null,
  created_at: string,             // pre-computed ISO timestamp
  items: [string, number, number][],  // [name, price, qty]
  pay: string,
  discPct = 0,
): { order: Row; orderItems: Row[] } {
  const subtotal   = r2(items.reduce((s, [, p, q]) => s + p * q, 0))
  const discount   = r2(subtotal * discPct / 100)
  const after      = r2(subtotal - discount)
  const tax        = r2(after * 0.05)
  const total      = r2(after + tax)
  const num        = ordId.slice(-3).replace(/^0+/, '') || '1'
  const order: Row = {
    id: ordId, store_id: CAFE_SID,
    customer_id: custId, customer_name: custName, customer_phone: custPhone,
    order_number: `ORD-DEMO-${num.padStart(3, '0')}`,
    subtotal, discount_amount: discount, tax_amount: tax, total_amount: total,
    payment_method: pay, payment_status: 'paid', order_status: 'completed',
    created_by: DEMO_USER_ID, created_at,
  }
  const orderItems: Row[] = items.map(([name, price, qty]) => ({
    id: id(), order_id: ordId, product_id: null,
    product_name_snapshot: name, price_snapshot: price,
    quantity: qty, line_total: r2(price * qty), created_at,
  }))
  return { order, orderItems }
}

const _cafePairs = [
  // ── TODAY (anchored to local calendar day so filters work in any timezone) ─
  cafeOrder('20000000-cafe-0000-0000-000000000001', CC1,'Priya Sharma', '9876543210', dayAt(0, 9, 15),  [['Cappuccino',180,2],['Croissant',150,1]], 'upi'),
  cafeOrder('20000000-cafe-0000-0000-000000000002', CC2,'Rahul Mehta',  '9123456789', dayAt(0,10, 30),  [['Espresso',120,1],['Chocolate Cookie',90,2]], 'cash'),
  cafeOrder('20000000-cafe-0000-0000-000000000003', CC3,'Ananya Singh', '9988776655', dayAt(0,11, 45),  [['Iced Latte',220,1],['Avocado Toast',320,1]], 'card'),
  cafeOrder('20000000-cafe-0000-0000-000000000004', null, null, null,   dayAt(0,14,  0),  [['Espresso',120,1],['Blueberry Muffin',140,1]], 'cash'),
  // ── YESTERDAY ──────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000005', CC5,'Sunita Patel', '9654321076', dayAt(1,10,  0),  [['Cappuccino',180,1],['Croissant',150,1],['Green Tea',120,1]], 'upi'),
  cafeOrder('20000000-cafe-0000-0000-000000000006', CC4,'Vikram Nair',  '9765432108', dayAt(1,12, 30),  [['Veg Sandwich',260,1],['Sparkling Water',80,1]], 'cash'),
  cafeOrder('20000000-cafe-0000-0000-000000000007', CC7,'Meera Iyer',   '9432107654', dayAt(1,15,  0),  [['Iced Latte',220,1],['Croissant',150,2]], 'card'),
  // ── 2 DAYS AGO ─────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000008', CC1,'Priya Sharma', '9876543210', dayAt(2, 9,  0),  [['Espresso',120,2],['Avocado Toast',320,1]], 'upi'),
  cafeOrder('20000000-cafe-0000-0000-000000000009', CC6,'Arjun Kapoor', '9543210765', dayAt(2,13, 45),  [['Cappuccino',180,1],['Chocolate Cookie',90,1]], 'cash'),
  // ── 3 DAYS AGO ─────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000010', CC3,'Ananya Singh', '9988776655', dayAt(3,11,  0),  [['Veg Sandwich',260,2],['Sparkling Water',80,2]], 'card'),
  cafeOrder('20000000-cafe-0000-0000-000000000011', CC2,'Rahul Mehta',  '9123456789', dayAt(3,14, 20),  [['Green Tea',120,1],['Blueberry Muffin',140,2]], 'cash'),
  // ── 4 DAYS AGO ─────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000012', CC5,'Sunita Patel', '9654321076', dayAt(4,10,  0),  [['Cappuccino',180,2],['Avocado Toast',320,1]], 'upi', 10),
  cafeOrder('20000000-cafe-0000-0000-000000000013', CC4,'Vikram Nair',  '9765432108', dayAt(4,15, 30),  [['Espresso',120,1],['Croissant',150,1]], 'cash'),
  // ── 5 DAYS AGO ─────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000014', CC1,'Priya Sharma', '9876543210', dayAt(5, 9, 30),  [['Iced Latte',220,2],['Croissant',150,1],['Chocolate Cookie',90,1]], 'card'),
  cafeOrder('20000000-cafe-0000-0000-000000000015', CC7,'Meera Iyer',   '9432107654', dayAt(5,12, 15),  [['Cappuccino',180,1],['Veg Sandwich',260,1]], 'upi'),
  // ── 6 DAYS AGO ─────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000016', CC6,'Arjun Kapoor', '9543210765', dayAt(6,10, 45),  [['Espresso',120,1],['Avocado Toast',320,1]], 'cash'),
  cafeOrder('20000000-cafe-0000-0000-000000000017', CC3,'Ananya Singh', '9988776655', dayAt(6,16,  0),  [['Blueberry Muffin',140,1],['Green Tea',120,1],['Sparkling Water',80,1]], 'upi'),
  // ── 7 DAYS AGO ─────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000018', CC2,'Rahul Mehta',  '9123456789', dayAt(7,11, 30),  [['Cappuccino',180,1],['Croissant',150,1]], 'card'),
  cafeOrder('20000000-cafe-0000-0000-000000000019', CC5,'Sunita Patel', '9654321076', dayAt(7,13,  0),  [['Iced Latte',220,1],['Veg Sandwich',260,1]], 'cash'),
  // ── 10 DAYS AGO ────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000020', CC1,'Priya Sharma', '9876543210', dayAt(10, 9, 45), [['Avocado Toast',320,1],['Cappuccino',180,1]], 'upi'),
  cafeOrder('20000000-cafe-0000-0000-000000000021', CC4,'Vikram Nair',  '9765432108', dayAt(10,14,  0), [['Espresso',120,2],['Chocolate Cookie',90,1]], 'cash'),
  // ── 14 DAYS AGO ────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000022', CC7,'Meera Iyer',   '9432107654', dayAt(14,10, 30), [['Cappuccino',180,1],['Avocado Toast',320,1]], 'card'),
  cafeOrder('20000000-cafe-0000-0000-000000000023', CC3,'Ananya Singh', '9988776655', dayAt(14,15, 15), [['Iced Latte',220,1],['Croissant',150,2]], 'upi'),
  // ── 18 DAYS AGO ────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000024', CC5,'Sunita Patel', '9654321076', dayAt(18, 9, 30), [['Veg Sandwich',260,1],['Cappuccino',180,1],['Green Tea',120,1]], 'cash'),
  cafeOrder('20000000-cafe-0000-0000-000000000025', CC1,'Priya Sharma', '9876543210', dayAt(18,12,  0), [['Espresso',120,1],['Croissant',150,1],['Blueberry Muffin',140,1]], 'upi'),
  // ── 22 DAYS AGO ────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000026', CC2,'Rahul Mehta',  '9123456789', dayAt(22,11,  0), [['Cappuccino',180,2],['Avocado Toast',320,1]], 'card'),
  cafeOrder('20000000-cafe-0000-0000-000000000027', CC6,'Arjun Kapoor', '9543210765', dayAt(22,14, 30), [['Iced Latte',220,1],['Veg Sandwich',260,1]], 'cash'),
  // ── 26 DAYS AGO ────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000028', CC7,'Meera Iyer',   '9432107654', dayAt(26,10,  0), [['Espresso',120,2],['Croissant',150,1]], 'upi'),
  cafeOrder('20000000-cafe-0000-0000-000000000029', CC5,'Sunita Patel', '9654321076', dayAt(26,16, 15), [['Cappuccino',180,1],['Blueberry Muffin',140,1]], 'cash'),
  // ── 28 DAYS AGO ────────────────────────────────────────────────────────────
  cafeOrder('20000000-cafe-0000-0000-000000000030', CC1,'Priya Sharma', '9876543210', dayAt(28,13,  0), [['Iced Latte',220,1],['Avocado Toast',320,2],['Sparkling Water',80,1]], 'card', 5),
]

const _cafeOrders     = _cafePairs.map(p => p.order)
const _cafeOrderItems = _cafePairs.flatMap(p => p.orderItems)

// Pre-computed stats that match the orders above
const _cafeCustomers: Row[] = [
  { id:CC1, store_id:CAFE_SID, workspace_id:WORKSPACE_ID, crm_contact_id:null, name:'Priya Sharma', phone:'9876543210', email:'priya@example.com', total_orders:6, total_spent:3730.65, last_order_at:dayAt(0,14),  created_by:DEMO_USER_ID, created_at:dayAt(28,9) },
  { id:CC2, store_id:CAFE_SID, workspace_id:WORKSPACE_ID, crm_contact_id:null, name:'Rahul Mehta',  phone:'9123456789', email:null,               total_orders:4, total_spent:1795.50, last_order_at:dayAt(0,10),  created_by:DEMO_USER_ID, created_at:dayAt(22,9) },
  { id:CC3, store_id:CAFE_SID, workspace_id:WORKSPACE_ID, crm_contact_id:null, name:'Ananya Singh', phone:'9988776655', email:'ananya@gmail.com',  total_orders:4, total_spent:2184.00, last_order_at:dayAt(0,11),  created_by:DEMO_USER_ID, created_at:dayAt(22,9) },
  { id:CC4, store_id:CAFE_SID, workspace_id:WORKSPACE_ID, crm_contact_id:null, name:'Vikram Nair',  phone:'9765432108', email:null,               total_orders:3, total_spent:987.00,  last_order_at:dayAt(1,12),  created_by:DEMO_USER_ID, created_at:dayAt(18,9) },
  { id:CC5, store_id:CAFE_SID, workspace_id:WORKSPACE_ID, crm_contact_id:null, name:'Sunita Patel', phone:'9654321076', email:'sunita@email.com',  total_orders:5, total_spent:2543.10, last_order_at:dayAt(1,10),  created_by:DEMO_USER_ID, created_at:dayAt(26,9) },
  { id:CC6, store_id:CAFE_SID, workspace_id:WORKSPACE_ID, crm_contact_id:null, name:'Arjun Kapoor', phone:'9543210765', email:null,               total_orders:3, total_spent:1249.50, last_order_at:dayAt(2,13),  created_by:DEMO_USER_ID, created_at:dayAt(22,9) },
  { id:CC7, store_id:CAFE_SID, workspace_id:WORKSPACE_ID, crm_contact_id:null, name:'Meera Iyer',   phone:'9432107654', email:'meera@gmail.com',   total_orders:4, total_spent:1942.50, last_order_at:dayAt(1,15),  created_by:DEMO_USER_ID, created_at:dayAt(26,9) },
]

// ── Seed receipts for all cafe orders ──────────────────────────────────────
const _cafeReceipts: Row[] = _cafeOrders.map((o, i) => ({
  id: id(), order_id: o.id,
  receipt_number: `REC-DEMO-${String(i + 1).padStart(3, '0')}`,
  receipt_url: null, sent_via: 'none', sent_at: null,
  created_at: o.created_at,
}))

const initialDb = (): Db => ({
  stores: [
    store(STORE_IDS[0], 'Cafe',               'Cafe / Coffee Shop', '☕', '#7C3AED', 'INR'),
    store(STORE_IDS[1], 'Neon Bar',            'Bar / Pub',          '🍺', '#EF4444', 'USD'),
    store(STORE_IDS[2], 'HealthPlus Pharmacy', 'Pharmacy',           '💊', '#10B981', 'INR'),
    store(STORE_IDS[3], 'Gizmo Hub',           'Electronics',        '📱', '#0EA5E9', 'USD'),
    store(STORE_IDS[4], 'Urban Threads',        'Clothing',           '👕', '#EC4899', 'GBP'),
    store(STORE_IDS[5], 'Kirana Express',       'Retail Store',       '🏪', '#F59E0B', 'INR'),
  ],

  categories: [
    // ── Cafe ──────────────────────────────────────────────────────
    cat(STORE_IDS[0], 'Coffee',  '☕', '#7C3AED', 0),
    cat(STORE_IDS[0], 'Bakery',  '🥐', '#F59E0B', 1),
    cat(STORE_IDS[0], 'Food',    '🥪', '#10B981', 2),
    cat(STORE_IDS[0], 'Drinks',  '🥤', '#0EA5E9', 3),

    // ── Neon Bar ──────────────────────────────────────────────────
    cat(STORE_IDS[1], 'Cocktails',    '🍹', '#EF4444', 0),
    cat(STORE_IDS[1], 'Beer & Cider', '🍺', '#F59E0B', 1),
    cat(STORE_IDS[1], 'Wine',         '🍷', '#9F1239', 2),
    cat(STORE_IDS[1], 'Spirits',      '🥃', '#92400E', 3),
    cat(STORE_IDS[1], 'Bar Snacks',   '🍟', '#10B981', 4),

    // ── HealthPlus Pharmacy ───────────────────────────────────────
    cat(STORE_IDS[2], 'Medicines',     '💊', '#10B981', 0),
    cat(STORE_IDS[2], 'Vitamins',      '🌿', '#84CC16', 1),
    cat(STORE_IDS[2], 'Personal Care', '🧴', '#0EA5E9', 2),
    cat(STORE_IDS[2], 'Baby Care',     '🍼', '#EC4899', 3),

    // ── Gizmo Hub ─────────────────────────────────────────────────
    cat(STORE_IDS[3], 'Audio',             '🎧', '#0EA5E9', 0),
    cat(STORE_IDS[3], 'Accessories',       '🔌', '#6366F1', 1),
    cat(STORE_IDS[3], 'Cables & Chargers', '🔋', '#F59E0B', 2),
    cat(STORE_IDS[3], 'Gaming',            '🎮', '#EF4444', 3),

    // ── Urban Threads ─────────────────────────────────────────────
    cat(STORE_IDS[4], 'Tops',        '👕', '#EC4899', 0),
    cat(STORE_IDS[4], 'Bottoms',     '👖', '#6366F1', 1),
    cat(STORE_IDS[4], 'Outerwear',   '🧥', '#0EA5E9', 2),
    cat(STORE_IDS[4], 'Accessories', '🧣', '#F59E0B', 3),

    // ── Kirana Express ────────────────────────────────────────────
    cat(STORE_IDS[5], 'Grains & Dal', '🌾', '#F59E0B', 0),
    cat(STORE_IDS[5], 'Dairy & Eggs', '🥛', '#0EA5E9', 1),
    cat(STORE_IDS[5], 'Snacks',       '🍿', '#EC4899', 2),
    cat(STORE_IDS[5], 'Beverages',    '🥤', '#10B981', 3),
    cat(STORE_IDS[5], 'Household',    '🧹', '#6366F1', 4),
  ],

  products: [
    // ── Cafe ──────────────────────────────────────────────────────
    prd(STORE_IDS[0], 'Espresso',       'CAF-001', 'Coffee',  120, 42, '8901001', 'Strong espresso shot',      'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80'),
    prd(STORE_IDS[0], 'Cappuccino',     'CAF-002', 'Coffee',  180, 28, '8901002', 'Steamed milk classic',      'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80'),
    prd(STORE_IDS[0], 'Iced Latte',     'CAF-003', 'Coffee',  220, 18, '8901003', 'Chilled latte with ice',    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80'),
    prd(STORE_IDS[0], 'Croissant',      'BAK-001', 'Bakery',  150, 16, '8902001', 'Buttery flaky pastry',     'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80'),
    prd(STORE_IDS[0], 'Blueberry Muffin','BAK-002','Bakery',  140,  9, '8902002', 'Fresh baked muffin',        'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80'),
    prd(STORE_IDS[0], 'Veg Sandwich',   'FOO-001', 'Food',    260, 12, '8903001', 'Grilled veggie sandwich',   'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80'),
    prd(STORE_IDS[0], 'Chocolate Cookie','BAK-003','Bakery',   90,  4, '8902003', 'Chewy chocolate chip cookie','https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80'),
    prd(STORE_IDS[0], 'Sparkling Water','DRK-001', 'Drinks',   80, 35, '8904001', 'Chilled sparkling water',   'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&q=80'),
    prd(STORE_IDS[0], 'Avocado Toast',  'FOO-002', 'Food',    320,  8, '8903002', 'Sourdough with fresh avocado','https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&q=80'),
    prd(STORE_IDS[0], 'Green Tea',      'DRK-002', 'Drinks',  120, 22, '8904002', 'Hot Japanese green tea',    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80'),

    // ── Neon Bar ──────────────────────────────────────────────────
    prd(STORE_IDS[1], 'Mojito',           'BAR-001', 'Cocktails',    12, 99, '9001001', 'Fresh mint & lime',          'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80'),
    prd(STORE_IDS[1], 'Margarita',        'BAR-002', 'Cocktails',    13, 99, '9001002', 'Classic salted rim',         'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80'),
    prd(STORE_IDS[1], 'Old Fashioned',    'BAR-003', 'Cocktails',    14, 99, '9001003', 'Whiskey & bitters',          'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80'),
    prd(STORE_IDS[1], 'Aperol Spritz',    'BAR-004', 'Cocktails',    12, 99, '9001004', 'Bubbly & bittersweet',       'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=400&q=80'),
    prd(STORE_IDS[1], 'Craft IPA',        'BAR-005', 'Beer & Cider',  8, 48, '9002001', 'Hoppy craft beer',           'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80'),
    prd(STORE_IDS[1], 'Draught Lager',    'BAR-006', 'Beer & Cider',  7, 60, '9002002', 'Crisp cold lager',           'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80'),
    prd(STORE_IDS[1], 'Apple Cider',      'BAR-007', 'Beer & Cider',  7, 30, '9002003', 'Chilled apple cider',        'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80'),
    prd(STORE_IDS[1], 'House Red Wine',   'BAR-008', 'Wine',          9, 40, '9003001', 'Full-bodied Merlot',         'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80'),
    prd(STORE_IDS[1], 'House White Wine', 'BAR-009', 'Wine',          9, 35, '9003002', 'Crisp Sauvignon Blanc',      'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80'),
    prd(STORE_IDS[1], 'Whiskey Shot',     'BAR-010', 'Spirits',       7, 99, '9004001', 'Single malt or blend',       'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80'),
    prd(STORE_IDS[1], 'Vodka Soda',       'BAR-011', 'Spirits',      10, 99, '9004002', 'Clean & refreshing',         'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80'),
    prd(STORE_IDS[1], 'Loaded Nachos',    'BAR-012', 'Bar Snacks',   11, 20, '9005001', 'Cheese, jalapeño & salsa',   'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80'),
    prd(STORE_IDS[1], 'Chicken Wings',    'BAR-013', 'Bar Snacks',   13, 18, '9005002', '6-piece spicy wings',        'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80'),
    prd(STORE_IDS[1], 'Fries & Dip',      'BAR-014', 'Bar Snacks',    7, 25, '9005003', 'Crispy fries with aioli',    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80'),

    // ── HealthPlus Pharmacy ───────────────────────────────────────
    prd(STORE_IDS[2], 'Paracetamol 500mg',  'PHR-001', 'Medicines',      25, 200, '7001001', 'Pack of 10 tablets',         'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80'),
    prd(STORE_IDS[2], 'Cough Syrup 100ml',  'PHR-002', 'Medicines',      95,  80, '7001002', 'Relieves dry cough',         'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&q=80'),
    prd(STORE_IDS[2], 'Antacid Tablets',    'PHR-003', 'Medicines',      55, 120, '7001003', 'Fast acid relief',           'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80'),
    prd(STORE_IDS[2], 'Bandage Roll',       'PHR-004', 'Medicines',      65,  90, '7001004', '5cm × 4m crepe bandage',     'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&q=80'),
    prd(STORE_IDS[2], 'Vitamin C 1000mg',   'PHR-005', 'Vitamins',      180,  60, '7002001', 'Effervescent tablets × 20',  'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=80'),
    prd(STORE_IDS[2], 'Multivitamin',        'PHR-006', 'Vitamins',      320,  45, '7002002', 'Daily nutrition pack × 30', 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&q=80'),
    prd(STORE_IDS[2], 'Omega-3 Fish Oil',   'PHR-007', 'Vitamins',      450,  30, '7002003', 'Heart & brain health',       'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&q=80'),
    prd(STORE_IDS[2], 'Hand Sanitizer',     'PHR-008', 'Personal Care',  85, 150, '7003001', '70% alcohol, 100ml',         'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&q=80'),
    prd(STORE_IDS[2], 'Sunscreen SPF50',    'PHR-009', 'Personal Care', 395,  40, '7003002', 'Broad spectrum, 75ml',       'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80'),
    prd(STORE_IDS[2], 'Digital Thermometer','PHR-010', 'Personal Care', 280,  25, '7003003', 'Fast-read 10-sec result',    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80'),
    prd(STORE_IDS[2], 'Baby Diapers S (20)','PHR-011', 'Baby Care',     550,  35, '7004001', 'Soft & leak-proof, size S',  'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=80'),
    prd(STORE_IDS[2], 'Baby Wipes (80ct)',  'PHR-012', 'Baby Care',     185,  50, '7004002', 'Fragrance-free & gentle',    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80'),

    // ── Gizmo Hub ─────────────────────────────────────────────────
    prd(STORE_IDS[3], 'Wireless Earbuds',   'GIZ-001', 'Audio',             49, 30, '6001001', 'True wireless, 24h battery', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80'),
    prd(STORE_IDS[3], 'Bluetooth Speaker',  'GIZ-002', 'Audio',             45, 22, '6001002', 'Waterproof, 12h playback',   'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80'),
    prd(STORE_IDS[3], 'Over-Ear Headphones','GIZ-003', 'Audio',             89, 15, '6001003', 'Active noise cancellation',  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'),
    prd(STORE_IDS[3], 'Phone Case Universal','GIZ-004','Accessories',       15, 80, '6002001', 'Slim TPU, fits most phones', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80'),
    prd(STORE_IDS[3], 'Screen Protector',   'GIZ-005', 'Accessories',        8, 60, '6002002', '9H tempered glass',          'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&q=80'),
    prd(STORE_IDS[3], 'Car Phone Mount',    'GIZ-006', 'Accessories',       18, 35, '6002003', 'Universal magnetic mount',   'https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=400&q=80'),
    prd(STORE_IDS[3], 'USB-C Cable 2m',     'GIZ-007', 'Cables & Chargers', 12, 100,'6003001', 'Braided, fast charge 60W',  'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=400&q=80'),
    prd(STORE_IDS[3], 'Portable Charger',   'GIZ-008', 'Cables & Chargers', 35, 28, '6003002', '20 000 mAh, dual USB-A',     'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80'),
    prd(STORE_IDS[3], 'GaN Charger 65W',    'GIZ-009', 'Cables & Chargers', 29, 20, '6003003', 'Compact 3-port PD charger',  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80'),
    prd(STORE_IDS[3], 'Gaming Mouse',       'GIZ-010', 'Gaming',            29, 18, '6004001', '12 000 DPI, RGB lighting',   'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&q=80'),
    prd(STORE_IDS[3], 'Mechanical Keyboard','GIZ-011', 'Gaming',            79, 10, '6004002', 'TKL, Blue switches, RGB',    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80'),
    prd(STORE_IDS[3], 'SD Card 128GB',      'GIZ-012', 'Accessories',       22, 50, '6002004', 'UHS-I Class 10, 100MB/s',    'https://images.unsplash.com/photo-1602526213897-7659b8b5abc3?w=400&q=80'),

    // ── Urban Threads ─────────────────────────────────────────────
    prd(STORE_IDS[4], 'Classic White Tee',  'UTH-001', 'Tops',       15, 50, '5001001', '100% organic cotton',        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80'),
    prd(STORE_IDS[4], 'Graphic Print Tee',  'UTH-002', 'Tops',       18, 35, '5001002', 'Oversized street-style fit', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&q=80'),
    prd(STORE_IDS[4], 'Cropped Hoodie',     'UTH-003', 'Tops',       38, 25, '5001003', 'Soft fleece, relaxed fit',   'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80'),
    prd(STORE_IDS[4], 'Linen Shirt',        'UTH-004', 'Tops',       42, 20, '5001004', 'Breathable, button-down',    'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80'),
    prd(STORE_IDS[4], 'Slim Fit Jeans',     'UTH-005', 'Bottoms',    45, 30, '5002001', 'Stretch denim, indigo wash', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80'),
    prd(STORE_IDS[4], 'Chino Shorts',       'UTH-006', 'Bottoms',    28, 40, '5002002', 'Mid-rise, 7" inseam',        'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80'),
    prd(STORE_IDS[4], 'Jogger Pants',       'UTH-007', 'Bottoms',    32, 22, '5002003', 'Tapered, elastic waistband', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=80'),
    prd(STORE_IDS[4], 'Bomber Jacket',      'UTH-008', 'Outerwear',  75, 15, '5003001', 'Satin-finish varsity style', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80'),
    prd(STORE_IDS[4], 'Trench Coat',        'UTH-009', 'Outerwear',  95, 10, '5003002', 'Double-breasted, belted',    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80'),
    prd(STORE_IDS[4], 'Knit Scarf',         'UTH-010', 'Accessories',22, 45, '5004001', 'Chunky wool blend',          'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&q=80'),
    prd(STORE_IDS[4], 'Beanie Hat',         'UTH-011', 'Accessories',16, 55, '5004002', 'Ribbed cuff, unisex',        'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=400&q=80'),
    prd(STORE_IDS[4], 'Canvas Tote Bag',    'UTH-012', 'Accessories',20, 40, '5004003', 'Heavyweight 12oz canvas',    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80'),

    // ── Kirana Express ────────────────────────────────────────────
    prd(STORE_IDS[5], 'Basmati Rice 5kg',   'KIR-001', 'Grains & Dal', 320, 40, '4001001', 'Long grain, aged 2 years',   'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80'),
    prd(STORE_IDS[5], 'Toor Dal 1kg',        'KIR-002', 'Grains & Dal', 145, 60, '4001002', 'Premium yellow lentils',     'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80'),
    prd(STORE_IDS[5], 'Whole Wheat Atta 5kg','KIR-003', 'Grains & Dal', 215, 35, '4001003', 'Stone-ground, fortified',    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80'),
    prd(STORE_IDS[5], 'Chana Dal 1kg',       'KIR-004', 'Grains & Dal', 130, 55, '4001004', 'Split chickpeas, high protein','https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80'),
    prd(STORE_IDS[5], 'Full Cream Milk 1L',  'KIR-005', 'Dairy & Eggs',  68, 80, '4002001', 'Pasteurised, 3.5% fat',      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'),
    prd(STORE_IDS[5], 'Amul Butter 500g',    'KIR-006', 'Dairy & Eggs', 285, 30, '4002002', 'Salted, pasteurised cream',  'https://images.unsplash.com/photo-1589985270958-2dc7f1a6a1e4?w=400&q=80'),
    prd(STORE_IDS[5], 'Eggs (12 pcs)',        'KIR-007', 'Dairy & Eggs',  90, 50, '4002003', 'Farm fresh, large size',     'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80'),
    prd(STORE_IDS[5], "Lay's Classic Salted",'KIR-008', 'Snacks',        20, 120,'4003001', '26g packet',                 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80'),
    prd(STORE_IDS[5], 'Maggi 2-Minute Noodles','KIR-009','Snacks',       14, 150,'4003002', 'Masala flavour, 70g',        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80'),
    prd(STORE_IDS[5], 'Haldiram Bhujia',     'KIR-010', 'Snacks',        85,  70, '4003003', 'Crispy sev mix, 400g',       'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=400&q=80'),
    prd(STORE_IDS[5], 'Coca-Cola 2L',        'KIR-011', 'Beverages',     95,  45, '4004001', 'Chilled sparkling cola',     'https://images.unsplash.com/photo-1567103472667-6898f3a79cf2?w=400&q=80'),
    prd(STORE_IDS[5], 'Frooti Mango 1L',     'KIR-012', 'Beverages',     55,  60, '4004002', 'Tropicana mango drink',      'https://images.unsplash.com/photo-1623594803397-a07ee68c4f88?w=400&q=80'),
    prd(STORE_IDS[5], 'Surf Excel 1kg',      'KIR-013', 'Household',    180,  40, '4005001', 'Matic top-load detergent',   'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&q=80'),
    prd(STORE_IDS[5], 'Colgate Toothpaste',  'KIR-014', 'Household',     75,  90, '4005002', 'Strong teeth, 200g',         'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&q=80'),
    prd(STORE_IDS[5], 'Vim Dishwash Bar',    'KIR-015', 'Household',     35, 100, '4005003', '200g lemon fragrance',       'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80'),
  ],

  customers:   _cafeCustomers,
  orders:      _cafeOrders,
  order_items: _cafeOrderItems,
  receipts:    _cafeReceipts,
})

// ── Helper factories ────────────────────────────────────────────────────

function store(storeId: string, store_name: string, store_type: string, icon: string, color: string, currency: string) {
  return {
    id: storeId,
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

function cat(storeId: string, name: string, icon: string, color: string, sort_order: number) {
  return {
    id: id(),
    workspace_id: WORKSPACE_ID,
    store_id: storeId,
    name,
    color,
    icon,
    sort_order,
    created_at: now(),
  }
}

function prd(
  storeId: string,
  name: string, sku: string, category: string,
  price: number, stock_quantity: number, barcode: string,
  description: string, image_url?: string,
) {
  return {
    id: id(),
    store_id: storeId,
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

const DB_VERSION = 'v6'
const DB_KEY = `retail-pos-local-db-${DB_VERSION}`

function loadDb(): Db {
  // Clear legacy keys on version bump
  for (const old of ['retail-pos-local-db', 'retail-pos-local-db-v2', 'retail-pos-local-db-v3', 'retail-pos-local-db-v4', 'retail-pos-local-db-v5']) {
    localStorage.removeItem(old)
  }
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
