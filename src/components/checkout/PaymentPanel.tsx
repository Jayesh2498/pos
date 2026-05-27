import { useState } from 'react'
import { Loader2, X, Wifi } from 'lucide-react'
import type { PaymentMethod } from '@/types/pos'
import { currencySymbol } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'

interface Props {
  total: number
  currency: string
  paymentMethod: PaymentMethod
  onMethodChange: (m: PaymentMethod) => void
  completing: boolean
  onConfirm: () => void
  onClose: () => void
  customerName?: string
  storeName: string
}

const METHODS: { value: PaymentMethod; icon: string; label: string }[] = [
  { value: 'cash',   icon: '💵', label: 'Cash' },
  { value: 'card',   icon: '💳', label: 'Card' },
  { value: 'mobile', icon: '📱', label: 'UPI'  },
]

function CardDisplay({ amount, sym }: { amount: number; sym: string }) {
  return (
    <div className="pay-card-display">
      <div className="pay-card-display-inner">
        {/* NFC rings */}
        <div className="pay-nfc-rings">
          <div className="pay-nfc-ring pay-nfc-ring--3" />
          <div className="pay-nfc-ring pay-nfc-ring--2" />
          <div className="pay-nfc-ring pay-nfc-ring--1" />
          <Wifi size={32} className="pay-nfc-icon" strokeWidth={1.5} />
        </div>
        <p className="pay-card-display-label">Tap or Insert Card</p>
        <p className="pay-card-display-amount">{sym}{amount.toFixed(2)}</p>
        <p className="pay-card-display-methods">Contactless · Chip · Swipe</p>
      </div>
    </div>
  )
}

function UPIDisplay({ upiId, storeName, amount, currency }: { upiId: string; storeName: string; amount: number; currency: string }) {
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${amount.toFixed(2)}&cu=${currency}&tn=POS+Payment`
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=160x160&margin=8`
  return (
    <div className="pay-upi-display">
      <img src={qrUrl} alt="UPI QR" className="pay-upi-qr" />
      <p className="pay-upi-label">Scan with GPay, PhonePe or any UPI app</p>
      <p className="pay-upi-id">{upiId}</p>
    </div>
  )
}

export default function PaymentPanel({
  total, currency, paymentMethod, onMethodChange, completing, onConfirm, onClose, customerName,
  storeName,
}: Props) {
  const sym = currencySymbol(currency)
  const { store } = useStore()
  const upiId = (store as any)?.upi_id as string | null | undefined
  const [cardMode, setCardMode] = useState<'swipe' | 'tap'>('tap')

  return (
    <div className="pay-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pay-modal">

        {/* ── Header ─────────────────────────────────── */}
        <div className="pay-modal-topbar">
          <div>
            <p className="pay-modal-heading">Payment</p>
            {customerName && <p className="pay-modal-subheading">for {customerName}</p>}
          </div>
          <button className="pay-modal-x" onClick={onClose}><X size={18} /></button>
        </div>

        {/* ── Amount ─────────────────────────────────── */}
        <div className="pay-modal-amount-block">
          <p className="pay-modal-amount-label">AMOUNT DUE</p>
          <p className="pay-modal-amount">{sym}{total.toFixed(2)}</p>
        </div>

        {/* ── Method selector ────────────────────────── */}
        <div className="pay-modal-methods">
          {METHODS.map(m => (
            <button
              key={m.value}
              className={`pay-method-pill ${paymentMethod === m.value ? 'pay-method-pill--active' : ''}`}
              onClick={() => onMethodChange(m.value)}
            >
              <span className="pay-method-pill-icon">{m.icon}</span>
              <span className="pay-method-pill-label">{m.label}</span>
            </button>
          ))}
        </div>

        {/* ── Method detail ──────────────────────────── */}
        <div className="pay-modal-detail">
          {paymentMethod === 'card' && (
            <>
              <div className="pay-card-mode-toggle">
                <button
                  className={`pay-card-mode-btn ${cardMode === 'tap' ? 'pay-card-mode-btn--active' : ''}`}
                  onClick={() => setCardMode('tap')}
                >
                  <Wifi size={12} /> NFC Tap
                </button>
                <button
                  className={`pay-card-mode-btn ${cardMode === 'swipe' ? 'pay-card-mode-btn--active' : ''}`}
                  onClick={() => setCardMode('swipe')}
                >
                  💳 Swipe / Insert
                </button>
              </div>
              {cardMode === 'tap' && <CardDisplay amount={total} sym={sym} />}
            </>
          )}
          {paymentMethod === 'mobile' && (
            upiId
              ? <UPIDisplay upiId={upiId} storeName={storeName} amount={total} currency={currency} />
              : (
                <div className="pay-upi-no-id">
                  <span style={{ fontSize: 24 }}>📲</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>No UPI ID configured</p>
                    <p style={{ fontSize: 11, margin: '2px 0 0', color: 'var(--color-text-secondary)' }}>Add your UPI ID in Settings to show a QR code</p>
                  </div>
                </div>
              )
          )}
          {paymentMethod === 'cash' && (
            <div className="pay-cash-display">
              <span style={{ fontSize: 40 }}>💵</span>
              <p className="pay-cash-label">Collect {sym}{total.toFixed(2)} in cash</p>
            </div>
          )}
        </div>

        {/* ── Confirm ────────────────────────────────── */}
        <div className="pay-modal-actions">
          <button className="pay-confirm-btn" onClick={onConfirm} disabled={completing}>
            {completing
              ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
              : <>Confirm Payment →</>}
          </button>
        </div>
      </div>
    </div>
  )
}
