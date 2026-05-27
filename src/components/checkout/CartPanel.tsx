import { ShoppingCart, Minus, Plus, X } from 'lucide-react'
import type { CartItem } from '@/types/pos'
import type { CheckoutTotals } from '@/hooks/use-checkout'
import { currencySymbol } from '@/lib/utils'

interface Props {
  cart: CartItem[]
  currency: string
  totals: CheckoutTotals
  taxLabel: string
  discountInput: string
  onDiscountChange: (v: string) => void
  onQty: (product_id: string, delta: number) => void
  onRemove: (product_id: string) => void
  selectedItem: string | null
  onSelectItem: (id: string | null) => void
  onPay: () => void
  disablePay: boolean
}

export default function CartPanel({
  cart, currency, totals, taxLabel, discountInput, onDiscountChange,
  onQty, onRemove, selectedItem, onSelectItem, onPay, disablePay,
}: Props) {
  const sym = currencySymbol(currency)

  return (
    <div className="cart-panel">
      <div className="cart-header">
        <span className="cart-title">
          <ShoppingCart size={14} style={{ display: 'inline', marginRight: 6 }} />
          Cart {cart.length > 0 && `(${cart.length})`}
        </span>
        {cart.length > 0 && (
          <button className="cart-clear-btn" onClick={() => onSelectItem(null)}>
            Deselect
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="cart-empty">
          <ShoppingCart size={32} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Cart is empty</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Click products to add them</p>
        </div>
      ) : (
        <div className="cart-items">
          {cart.map(item => (
            <div
              key={item.product_id}
              className={`cart-item ${selectedItem === item.product_id ? 'cart-item--selected' : ''}`}
              onClick={() => onSelectItem(selectedItem === item.product_id ? null : item.product_id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">{sym}{item.price.toFixed(2)} each</p>
              </div>
              <div className="cart-item-qty-controls" onClick={e => e.stopPropagation()}>
                <button className="cart-qty-btn" onClick={() => onQty(item.product_id, -1)}>
                  <Minus size={12} />
                </button>
                <span className="cart-qty-num">{item.quantity}</span>
                <button
                  className="cart-qty-btn"
                  onClick={() => onQty(item.product_id, 1)}
                  disabled={item.quantity >= item.stock_quantity}
                >
                  <Plus size={12} />
                </button>
              </div>
              <span className="cart-item-total">{sym}{item.line_total.toFixed(2)}</span>
              <button
                className="cart-remove-btn"
                onClick={e => { e.stopPropagation(); onRemove(item.product_id) }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="cart-footer">
        {/* Discount */}
        <div className="cart-discount-row">
          <span className="cart-discount-label">Discount (%)</span>
          <input
            className="cart-discount-input"
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={discountInput}
            onChange={e => onDiscountChange(e.target.value)}
          />
        </div>

        {/* Totals */}
        <div className="cart-totals">
          <div className="cart-total-row">
            <span>Subtotal</span>
            <span>{sym}{totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="cart-total-row">
              <span>Discount</span>
              <span style={{ color: '#16A34A' }}>−{sym}{totals.discountAmount.toFixed(2)}</span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="cart-total-row">
              <span>{taxLabel}</span>
              <span>{sym}{totals.taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="cart-total-row cart-total-row--main">
            <span>Total</span>
            <span>{sym}{totals.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay button */}
        <button
          className="cart-pay-btn"
          onClick={onPay}
          disabled={disablePay}
        >
          {disablePay ? 'Pay' : `Pay ${sym}${totals.total.toFixed(2)}`}
          {!disablePay && <span style={{ marginLeft: 6, opacity: 0.85 }}>→</span>}
        </button>
      </div>
    </div>
  )
}
