import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, ArrowLeft, Store, DollarSign, Package, Receipt, Rocket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'



type Step = 'tax' | 'inventory' | 'receipt' | 'done'
const STEPS: Step[] = ['tax', 'inventory', 'receipt', 'done']

const STEP_META = {
  tax:       { icon: DollarSign, title: 'Tax',       desc: 'How tax applies' },
  inventory: { icon: Package,    title: 'Inventory', desc: 'Stock tracking' },
  receipt:   { icon: Receipt,    title: 'Receipt',   desc: 'Header & footer' },
  done:      { icon: Rocket,     title: 'All set!',  desc: '' },
}

interface FormData {
  tax_type: 'inclusive' | 'exclusive' | 'none'
  tax_value: string
  inventory_enabled: boolean
  receipt_header: string
  receipt_footer: string
}

export default function Setup() {
  const { storeId } = useActiveStore()
  const navigate    = useNavigate()
  const [step, setStep]   = useState<Step>('tax')
  const [saving, setSaving] = useState(false)
  const [form, setForm]   = useState<FormData>({
    tax_type: 'exclusive', tax_value: '0',
    inventory_enabled: true,
    receipt_header: '', receipt_footer: 'Thank you for your purchase!',
  })

  function f<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const stepIdx = STEPS.indexOf(step)

  function next() {
    if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1])
  }
  function back() {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1])
    else navigate('/')
  }

  async function finish() {
    if (!storeId) { navigate('/'); return }
    setSaving(true)
    await supabase.from('stores').update({
      tax_type: form.tax_type,
      tax_value: parseFloat(form.tax_value) || 0,
      inventory_enabled: form.inventory_enabled,
      receipt_header: form.receipt_header.trim() || null,
      receipt_footer: form.receipt_footer.trim() || 'Thank you for your purchase!',
    }).eq('id', storeId)
    setSaving(false)
    navigate('/pos')
  }

  // Currency sym for tax example (read from store later — use $ for now)
  const sym = '$'

  return (
    <div className="sw-root">
      <div className="sw-bg" />

      <div className="sw-wrap">
        {/* Left sidebar */}
        <aside className="sw-sidebar">
          <div className="sw-sidebar-brand">
            <div className="sw-brand-icon"><Store size={16} strokeWidth={2.5} /></div>
            <span className="sw-brand-label">Store Setup</span>
          </div>
          <nav className="sw-steps">
            {STEPS.filter(s => s !== 'done').map((s, i) => {
              const done   = stepIdx > i
              const active = step === s
              const Meta   = STEP_META[s]
              return (
                <div key={s} className={`sw-step ${active ? 'sw-step--active' : done ? 'sw-step--done' : 'sw-step--idle'}`}>
                  <div className="sw-step-dot">
                    {done ? <Check size={11} strokeWidth={3} /> : <span className="sw-step-num">{i + 1}</span>}
                  </div>
                  <div>
                    <p className="sw-step-title">{Meta.title}</p>
                    <p className="sw-step-desc">{Meta.desc}</p>
                  </div>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Main panel */}
        <div className="sw-panel">
          <div className="sw-panel-inner">

            {/* ── Tax ── */}
            {step === 'tax' && (
              <div className="sw-content">
                <div className="sw-content-head">
                  <h2 className="sw-title">Tax settings</h2>
                  <p className="sw-sub">Choose how tax applies to your prices.</p>
                </div>

                <div className="sw-options">
                  {([
                    { val: 'none',      label: 'No tax',        desc: 'Prices shown as-is, no tax calculated.' },
                    { val: 'exclusive', label: 'Tax exclusive',  desc: 'Tax is added on top of the listed price.' },
                    { val: 'inclusive', label: 'Tax inclusive',  desc: 'Tax is already baked into the listed price.' },
                  ] as const).map(opt => (
                    <button
                      key={opt.val}
                      className={`sw-option ${form.tax_type === opt.val ? 'sw-option--active' : ''}`}
                      onClick={() => f('tax_type', opt.val)}
                    >
                      <div className="sw-option-radio">
                        {form.tax_type === opt.val && <div className="sw-option-radio-dot" />}
                      </div>
                      <div>
                        <p className="sw-option-label">{opt.label}</p>
                        <p className="sw-option-desc">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {form.tax_type !== 'none' && (
                  <div className="sw-field mt-4">
                    <label className="sw-label">Tax rate</label>
                    <div className="sw-rate-wrap">
                      <input
                        className="sw-input sw-rate-input"
                        type="number" min="0" max="100" step="0.1" placeholder="0"
                        value={form.tax_value}
                        onChange={e => f('tax_value', e.target.value)}
                      />
                      <span className="sw-rate-pct">%</span>
                    </div>
                    {parseFloat(form.tax_value) > 0 && (
                      <p className="sw-hint">
                        {form.tax_type === 'exclusive'
                          ? `${sym}100 item → ${sym}${(100 * (1 + parseFloat(form.tax_value) / 100)).toFixed(2)} total`
                          : `${sym}100 item includes ${sym}${(100 - 100 / (1 + parseFloat(form.tax_value) / 100)).toFixed(2)} tax`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Inventory ── */}
            {step === 'inventory' && (
              <div className="sw-content">
                <div className="sw-content-head">
                  <h2 className="sw-title">Inventory tracking</h2>
                  <p className="sw-sub">When enabled, stock levels decrease with each sale and you'll see low-stock warnings.</p>
                </div>
                <div className="sw-options">
                  <button
                    className={`sw-option ${form.inventory_enabled ? 'sw-option--active' : ''}`}
                    onClick={() => f('inventory_enabled', true)}
                  >
                    <div className="sw-option-radio">
                      {form.inventory_enabled && <div className="sw-option-radio-dot" />}
                    </div>
                    <div>
                      <p className="sw-option-label">Yes — track stock</p>
                      <p className="sw-option-desc">Recommended for cafes, retail, bakeries. Manage stock from the Products page.</p>
                    </div>
                  </button>
                  <button
                    className={`sw-option ${!form.inventory_enabled ? 'sw-option--active' : ''}`}
                    onClick={() => f('inventory_enabled', false)}
                  >
                    <div className="sw-option-radio">
                      {!form.inventory_enabled && <div className="sw-option-radio-dot" />}
                    </div>
                    <div>
                      <p className="sw-option-label">No — skip inventory</p>
                      <p className="sw-option-desc">Good for services or when stock counts aren't needed.</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ── Receipt ── */}
            {step === 'receipt' && (
              <div className="sw-content">
                <div className="sw-content-head">
                  <h2 className="sw-title">Receipt text</h2>
                  <p className="sw-sub">Optional lines shown at the top and bottom of every printed receipt.</p>
                </div>

                <div className="sw-two-col">
                  <div className="sw-fields">
                    <div className="sw-field">
                      <label className="sw-label">Header</label>
                      <textarea className="sw-input sw-textarea" rows={3}
                        placeholder={`My Store\n123 Main Street`}
                        value={form.receipt_header}
                        onChange={e => f('receipt_header', e.target.value)} />
                    </div>
                    <div className="sw-field">
                      <label className="sw-label">Footer</label>
                      <textarea className="sw-input sw-textarea" rows={3}
                        placeholder="Thank you for your purchase!"
                        value={form.receipt_footer}
                        onChange={e => f('receipt_footer', e.target.value)} />
                    </div>
                  </div>

                  {/* Receipt preview */}
                  <div className="sw-receipt-preview">
                    <p className="sw-receipt-preview-label">Preview</p>
                    <div className="sw-receipt-preview-body">
                      {form.receipt_header
                        ? form.receipt_header.split('\n').map((l, i) => <p key={i} className="font-bold text-center text-[12px]">{l}</p>)
                        : <p className="font-bold text-center text-[12px] opacity-40">Your Store Name</p>}
                      <div className="sw-receipt-divider" />
                      <div className="space-y-1 text-[11px] opacity-60">
                        <div className="flex justify-between"><span>Espresso</span><span>$3.50</span></div>
                        <div className="flex justify-between"><span>Croissant</span><span>$4.00</span></div>
                        <div className="flex justify-between font-bold pt-1 border-t border-current/20"><span>Total</span><span>$7.50</span></div>
                      </div>
                      {form.receipt_footer && (
                        <>
                          <div className="sw-receipt-divider" />
                          {form.receipt_footer.split('\n').map((l, i) => <p key={i} className="text-center text-[11px] opacity-60">{l}</p>)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Done ── */}
            {step === 'done' && (
              <div className="sw-done">
                <div className="sw-done-icon">🚀</div>
                <h2 className="sw-done-title">You're all set!</h2>
                <p className="sw-done-sub">Your store is configured and ready to use. You can change any of these settings from the Settings page.</p>
                <div className="sw-done-summary">
                  <div className="sw-done-row">
                    <span>Tax</span>
                    <span>{form.tax_type === 'none' ? 'None' : `${form.tax_value}% (${form.tax_type})`}</span>
                  </div>
                  <div className="sw-done-row">
                    <span>Inventory</span>
                    <span>{form.inventory_enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="sw-done-row">
                    <span>Receipt footer</span>
                    <span className="truncate max-w-[160px]">{form.receipt_footer || '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nav bar */}
          <div className="sw-nav">
            <button className="sw-nav-back" onClick={back}>
              <ArrowLeft size={14} />
              {stepIdx === 0 ? 'Back to profiles' : 'Back'}
            </button>

            {step !== 'done' ? (
              <button className="sw-nav-next" onClick={next}>
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button className="sw-nav-launch" onClick={finish} disabled={saving}>
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                  : <>Open store <ArrowRight size={14} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
