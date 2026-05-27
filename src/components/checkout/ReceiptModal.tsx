import { Printer, MessageCircle, ShoppingCart } from 'lucide-react'
import type { CartItem, PaymentMethod } from '@/types/pos'
import { buildReceiptHtml, buildWhatsAppUrl, type ReceiptData } from '@/lib/receipt-printer'
import { printHtml } from '@/lib/receipt-printer'
import { currencySymbol } from '@/lib/utils'

interface Props {
  orderNumber: string
  total: number
  subtotal: number
  discountAmount: number
  taxAmount: number
  currency: string
  customerName?: string
  customerPhone?: string
  paymentMethod: PaymentMethod
  cart: CartItem[]
  storeName: string
  onNewSale: () => void
  onClose: () => void
}

export default function ReceiptModal({
  orderNumber, total, subtotal, discountAmount, taxAmount,
  currency, customerName, customerPhone, paymentMethod, cart, storeName,
  onNewSale,
}: Props) {
  const sym = currencySymbol(currency)

  const receiptData: ReceiptData = {
    storeName,
    orderNumber,
    date: new Date().toLocaleString(),
    paymentMethod,
    customerName: customerName || 'Walk-in',
    customerPhone,
    items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, total: i.line_total })),
    subtotal,
    discountAmount,
    taxAmount,
    total,
    currency,
    receiptNumber: `REC-${Date.now()}`,
    footerText: 'Thank you! Come again 🙏',
  }

  function handlePrint() {
    printHtml(buildReceiptHtml(receiptData))
  }

  function handleWhatsApp() {
    const url = buildWhatsAppUrl(receiptData, customerPhone)
    window.open(url, '_blank')
  }

  return (
    <div className="receipt-overlay">
      <div className="receipt-modal">
        <div className="receipt-success-banner">
          <div className="receipt-check">✅</div>
          <h2 className="receipt-title">Sale Complete!</h2>
          <p className="receipt-order-num">{orderNumber}</p>
        </div>

        <div className="receipt-body">
          {customerName && customerName !== 'Walk-in' && (
            <div className="receipt-section">
              <p className="receipt-section-title">Customer</p>
              <div className="receipt-row">
                <span>Name</span><span>{customerName}</span>
              </div>
              {customerPhone && (
                <div className="receipt-row">
                  <span>Phone</span><span>{customerPhone}</span>
                </div>
              )}
            </div>
          )}

          <div className="receipt-section">
            <p className="receipt-section-title">Items</p>
            {cart.map(item => (
              <div key={item.product_id} className="receipt-row">
                <span>{item.name} ×{item.quantity}</span>
                <span>{sym}{item.line_total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="receipt-section">
            <p className="receipt-section-title">Summary</p>
            <div className="receipt-row">
              <span>Subtotal</span><span>{sym}{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="receipt-row">
                <span>Discount</span><span style={{ color: '#16A34A' }}>−{sym}{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="receipt-row">
                <span>Tax</span><span>{sym}{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="receipt-row receipt-row--total">
              <span>Total</span><span>{sym}{total.toFixed(2)}</span>
            </div>
            <div className="receipt-row" style={{ marginTop: 8 }}>
              <span>Payment</span><span style={{ textTransform: 'capitalize' }}>{paymentMethod}</span>
            </div>
          </div>
        </div>

        <div className="receipt-actions">
          <button className="receipt-btn-primary" onClick={onNewSale}>
            <ShoppingCart size={16} />
            New Sale
          </button>
          <button className="receipt-btn-secondary" onClick={handlePrint}>
            <Printer size={15} />
            Print Receipt
          </button>
          {customerPhone && (
            <button className="receipt-btn-whatsapp" onClick={handleWhatsApp}>
              <MessageCircle size={15} />
              Send via WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
