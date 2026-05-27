import { useEffect, useRef, useState } from 'react'
import { Loader2, ShoppingCart, Grid3X3 } from 'lucide-react'
import { useStore } from '@/hooks/use-store'
import { useCheckout } from '@/hooks/use-checkout'
import { useCheckoutProducts } from '@/hooks/use-checkout-products'
import { useIsMobile } from '@/hooks/use-mobile'
import ProductGrid from '@/components/checkout/ProductGrid'
import CartPanel from '@/components/checkout/CartPanel'
import CustomerBox from '@/components/checkout/CustomerBox'
import PaymentPanel from '@/components/checkout/PaymentPanel'
import ReceiptModal from '@/components/checkout/ReceiptModal'

export default function Checkout() {
  const { store, loading: storeLoading } = useStore()
  const co = useCheckout(store)
  const pg = useCheckoutProducts()
  const isMobile = useIsMobile()

  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products')
  const searchRef = useRef<HTMLInputElement | null>(null)

  const taxLabel = store
    ? `Tax (${store.tax_value}%${store.tax_type === 'inclusive' ? ' incl.' : ''})`
    : 'Tax'

  const cartCount = co.cart.reduce((s, i) => s + i.quantity, 0)

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

      // / → focus search
      if (e.key === '/' && !isInput) {
        e.preventDefault()
        searchRef.current?.focus()
        pg.searchRef.current?.focus()
      }

      // Esc → close payment / blur search
      if (e.key === 'Escape') {
        if (showPayment) { setShowPayment(false); return }
        if (isInput) (e.target as HTMLElement).blur()
        pg.setSearch('')
      }

      // Enter → open payment (when not in input, cart non-empty)
      if (e.key === 'Enter' && !isInput && !showPayment && !showReceipt && co.cart.length > 0) {
        setShowPayment(true)
      }

      // + / - → adjust selected item qty
      if ((e.key === '+' || e.key === '=') && selectedItem && !isInput) {
        co.updateQty(selectedItem, 1)
      }
      if (e.key === '-' && selectedItem && !isInput) {
        co.updateQty(selectedItem, -1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showPayment, showReceipt, co.cart.length, selectedItem])

  // Switch to cart tab when item is added on mobile
  useEffect(() => {
    if (isMobile && co.cart.length > 0 && mobileTab === 'products') {
      // Don't auto-switch, let the badge indicate items are in cart
    }
  }, [co.cart.length, isMobile])

  // ── Confirm sale ───────────────────────────────────────────────
  async function handleConfirmPayment() {
    await co.completeSale()
    setShowPayment(false)
    setShowReceipt(true)
  }

  // ── New sale ───────────────────────────────────────────────────
  function handleNewSale() {
    co.clearCart()
    setShowReceipt(false)
    setSelectedItem(null)
    setMobileTab('products')
    searchRef.current?.focus()
  }

  // ── Customer clear ─────────────────────────────────────────────
  function handleClearCustomer() {
    co.setNameInput('')
    co.setPhoneInput('')
  }

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[70vh] gap-2 text-gray-400">
        <Loader2 size={20} className="animate-spin" /> Loading…
      </div>
    )
  }
  if (!store) {
    return (
      <div className="flex items-center justify-center h-full min-h-[70vh] text-sm text-gray-400">
        No store found. Set up a store in Settings.
      </div>
    )
  }

  return (
    <>
      {/* ── Mobile Tab Switcher (mobile only) ─────────────────── */}
      {isMobile && (
        <div className="checkout-mobile-tabs">
          <div className="checkout-mobile-tabs-inner">
            <button
              className={`checkout-tab-btn ${mobileTab === 'products' ? 'checkout-tab-btn--active' : ''}`}
              onClick={() => setMobileTab('products')}
            >
              <Grid3X3 size={14} />
              Products
            </button>
            <button
              className={`checkout-tab-btn ${mobileTab === 'cart' ? 'checkout-tab-btn--active' : ''}`}
              onClick={() => setMobileTab('cart')}
            >
              <ShoppingCart size={14} />
              Cart
              {cartCount > 0 && (
                <span className="checkout-cart-badge">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Main POS Layout ─────────────────────────────────── */}
      <div className="pos-checkout-layout">

        {/* ── LEFT: Product Grid ─────────────────────────────── */}
        <div
          className="pos-checkout-left"
          style={isMobile && mobileTab !== 'products' ? { display: 'none' } : {}}
        >
          <ProductGrid
            products={pg.filtered}
            categories={pg.categories}
            search={pg.search}
            onSearchChange={pg.setSearch}
            activeCategory={pg.activeCategory}
            onCategoryChange={pg.setActiveCategory}
            onAdd={item => {
              co.addToCart(item)
              if (isMobile) setMobileTab('products')
            }}
            cartQtys={Object.fromEntries(co.cart.map(i => [i.product_id, i.quantity]))}
            loading={pg.loading}
            currency={store.currency}
            searchRef={pg.searchRef}
            storeName="Retail POS"
          />
        </div>

        {/* ── RIGHT: Cart + Customer ─────────────────────────── */}
        <div
          className="pos-checkout-right"
          style={isMobile && mobileTab !== 'cart' ? { display: 'none' } : {}}
        >
          {/* Customer box */}
          <CustomerBox
            name={co.nameInput}
            onNameChange={co.setNameInput}
            phone={co.phoneInput}
            onPhoneChange={co.setPhoneInput}
            onLookup={co.lookupCustomer}
            customer={co.customer}
            state={co.customerLookupState}
            onClear={handleClearCustomer}
          />

          {/* Cart */}
          <CartPanel
            cart={co.cart}
            currency={store.currency}
            totals={co.totals}
            taxLabel={taxLabel}
            discountInput={co.discountInput}
            onDiscountChange={co.setDiscountInput}
            onQty={co.updateQty}
            onRemove={co.removeItem}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onPay={() => setShowPayment(true)}
            disablePay={co.cart.length === 0}
          />
        </div>
      </div>

      {/* ── Payment Panel (modal) ─────────────────────────────── */}
      {showPayment && (
        <PaymentPanel
          total={co.totals.total}
          currency={store.currency}
          paymentMethod={co.paymentMethod}
          onMethodChange={co.setPaymentMethod}
          completing={co.completing}
          onConfirm={handleConfirmPayment}
          onClose={() => setShowPayment(false)}
          customerName={co.nameInput || co.customer?.name}
          storeName={store.store_name}
        />
      )}

      {/* ── Receipt Modal ─────────────────────────────────────── */}
      {showReceipt && co.completedOrder && (
        <ReceiptModal
          orderNumber={co.completedOrder.order_number}
          total={co.totals.total}
          subtotal={co.totals.subtotal}
          discountAmount={co.totals.discountAmount}
          taxAmount={co.totals.taxAmount}
          currency={store.currency}
          customerName={co.nameInput || co.customer?.name}
          customerPhone={co.phoneInput || co.customer?.phone}
          paymentMethod={co.paymentMethod}
          cart={co.cart}
          storeName={store.store_name}
          onNewSale={handleNewSale}
          onClose={handleNewSale}
        />
      )}
    </>
  )
}
