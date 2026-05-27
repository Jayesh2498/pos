/**
 * Prints an HTML string in an isolated iframe — avoids printing the entire page.
 * Pass an HTML document string; it pops open a print dialog and auto-removes itself.
 */
export function printHtml(html: string) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument!
  doc.open()
  doc.write(html)
  doc.close()
  // wait for resources then print
  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    // remove after print dialog closes
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }
}

export interface ReceiptData {
  storeName: string
  orderNumber: string
  date: string
  paymentMethod: string
  customerName?: string | null
  customerPhone?: string | null
  items: { name: string; quantity: number; price: number; total: number }[]
  subtotal: number
  discountAmount?: number
  taxAmount?: number
  total: number
  currency: string
  receiptNumber?: string | null
  footerText?: string
}

function currencySymbol(c: string) {
  const map: Record<string, string> = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£',
    AED: 'د.إ', SGD: 'S$', AUD: 'A$', CAD: 'C$', JPY: '¥',
  }
  return map[c] ?? c
}

export function buildReceiptHtml(d: ReceiptData): string {
  const sym = currencySymbol(d.currency)
  const rows = d.items.map(i =>
    `<tr>
      <td style="padding:2px 0;width:55%">${i.name}</td>
      <td style="text-align:center;width:10%">×${i.quantity}</td>
      <td style="text-align:right;width:17%">${sym}${i.price.toFixed(2)}</td>
      <td style="text-align:right;width:18%">${sym}${i.total.toFixed(2)}</td>
    </tr>`
  ).join('')

  const discount = (d.discountAmount ?? 0) > 0
    ? `<tr><td colspan="3">Discount</td><td style="text-align:right">−${sym}${(d.discountAmount!).toFixed(2)}</td></tr>` : ''
  const tax = (d.taxAmount ?? 0) > 0
    ? `<tr><td colspan="3">Tax</td><td style="text-align:right">${sym}${(d.taxAmount!).toFixed(2)}</td></tr>` : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: 80mm auto; margin: 6mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    color: #111;
    margin: 0;
    padding: 0;
    width: 72mm;
  }
  h1 { font-size: 15px; font-weight: bold; text-align: center; margin: 0 0 2px; }
  .sub { font-size: 10px; text-align: center; color: #555; margin-bottom: 6px; }
  .hr { border: none; border-top: 1px dashed #999; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { font-size: 11px; padding: 1.5px 0; vertical-align: top; }
  .head td { font-size: 10px; font-weight: bold; color: #444; border-bottom: 1px dashed #ccc; padding-bottom: 3px; margin-bottom: 2px; }
  .meta td { font-size: 10.5px; }
  .total-row td { font-size: 12px; font-weight: bold; border-top: 1px dashed #999; padding-top: 4px; margin-top: 2px; }
  .footer { text-align: center; font-size: 10px; color: #666; margin-top: 8px; }
  .rec-num { text-align: center; font-size: 9px; color: #999; margin-top: 3px; }
</style>
</head>
<body>
  <h1>${d.storeName}</h1>
  <div class="sub">Receipt</div>
  <hr class="hr"/>
  <table class="meta">
    <tr><td>Order</td><td style="text-align:right">${d.orderNumber}</td></tr>
    <tr><td>Date</td><td style="text-align:right">${d.date}</td></tr>
    <tr><td>Payment</td><td style="text-align:right">${d.paymentMethod}</td></tr>
    ${d.customerName && d.customerName !== 'Walk-in'
      ? `<tr><td>Customer</td><td style="text-align:right">${d.customerName}</td></tr>` : ''}
    ${d.customerPhone
      ? `<tr><td>Phone</td><td style="text-align:right">${d.customerPhone}</td></tr>` : ''}
  </table>
  <hr class="hr"/>
  <table>
    <tr class="head">
      <td>Item</td><td style="text-align:center">Qty</td>
      <td style="text-align:right">Price</td><td style="text-align:right">Total</td>
    </tr>
    ${rows}
  </table>
  <hr class="hr"/>
  <table>
    <tr><td colspan="3">Subtotal</td><td style="text-align:right">${sym}${d.subtotal.toFixed(2)}</td></tr>
    ${discount}${tax}
    <tr class="total-row"><td colspan="3">TOTAL</td><td style="text-align:right">${sym}${d.total.toFixed(2)}</td></tr>
  </table>
  <div class="footer">${d.footerText ?? 'Thank you! Come again 🙏'}</div>
  ${d.receiptNumber ? `<div class="rec-num">${d.receiptNumber}</div>` : ''}
</body>
</html>`
}

/**
 * Build a WhatsApp message with full bill details.
 * Returns a wa.me URL ready to open.
 */
export function buildWhatsAppUrl(d: ReceiptData, phone?: string | null): string {
  const sym = currencySymbol(d.currency)
  const lines = [
    `🧾 *Receipt — ${d.storeName}*`,
    ``,
    `📋 Order: \`${d.orderNumber}\``,
    `📅 Date: ${d.date}`,
    `💳 Payment: ${d.paymentMethod}`,
    d.customerName && d.customerName !== 'Walk-in' ? `👤 Customer: ${d.customerName}` : null,
    ``,
    `*── Items ──*`,
    ...d.items.map(i =>
      `• ${i.name}  ×${i.quantity}  @ ${sym}${i.price.toFixed(2)}  =  *${sym}${i.total.toFixed(2)}*`
    ),
    ``,
    d.subtotal !== d.total ? `Subtotal: ${sym}${d.subtotal.toFixed(2)}` : null,
    (d.discountAmount ?? 0) > 0 ? `Discount: −${sym}${d.discountAmount!.toFixed(2)}` : null,
    (d.taxAmount    ?? 0) > 0 ? `Tax:      ${sym}${d.taxAmount!.toFixed(2)}` : null,
    ``,
    `💰 *Total: ${sym}${d.total.toFixed(2)}*`,
    ``,
    d.footerText ?? `Thank you for shopping with us! 🙏`,
    d.receiptNumber ? `_${d.receiptNumber}_` : null,
  ].filter(Boolean).join('\n')

  const encoded = encodeURIComponent(lines)
  const base = phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : 'https://wa.me/'
  return `${base}?text=${encoded}`
}
