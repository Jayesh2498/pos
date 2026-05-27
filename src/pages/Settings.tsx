import { Loader2, Save, RotateCcw, Check, Store, Receipt, Package, DollarSign, AlertCircle, Sun, Moon, Palette, Smartphone } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { useTheme, type ThemeMode, DEFAULT_CUSTOM } from '@/lib/theme'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'AUD', 'CAD', 'JPY']

function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="stg-section-head">
      <div className="stg-section-icon">{icon}</div>
      <div>
        <h3 className="stg-section-title">{title}</h3>
        <p className="stg-section-desc">{desc}</p>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="stg-field">
      <label className="stg-label">{label}</label>
      {children}
      {hint && <p className="stg-hint">{hint}</p>}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`prd-toggle ${on ? 'prd-toggle--on' : 'prd-toggle--off'}`}
    >
      <span className="prd-toggle-knob" />
    </button>
  )
}

const COLOR_FIELDS: { key: keyof typeof DEFAULT_CUSTOM; label: string }[] = [
  { key: 'primary',       label: 'Accent colour' },
  { key: 'gradientStart', label: 'Gradient start' },
  { key: 'gradientEnd',   label: 'Gradient end' },
  { key: 'bg',            label: 'Background' },
  { key: 'card',          label: 'Card surface' },
  { key: 'textPrimary',   label: 'Primary text' },
  { key: 'textSecondary', label: 'Secondary text' },
  { key: 'border',        label: 'Border' },
]

export default function Settings() {
  const { form, loading, saving, saved, error, isDirty, updateField, save, reset } = useSettings()
  const { theme, setMode, setCustomColors } = useTheme()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
        <Loader2 size={18} className="animate-spin" /> Loading settings…
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Could not load store settings.
      </div>
    )
  }

  return (
    <div className="pos-page stg-page">
      {/* Header */}
      <div className="pos-page-header">
        <div>
          <h1 className="pos-page-title">Settings</h1>
          <p className="pos-page-subtitle">Configure your store preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button className="prd-btn-secondary" onClick={reset} disabled={saving}>
              <RotateCcw size={13} /> Reset
            </button>
          )}
          <button
            className="pos-btn-primary"
            onClick={save}
            disabled={saving || !isDirty}
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : saved
              ? <><Check size={14} /> Saved!</>
              : <><Save size={14} /> Save changes</>}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="stg-error">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Saved toast */}
      {saved && (
        <div className="stg-saved-toast">
          <Check size={13} /> Settings saved successfully
        </div>
      )}

      <div className="stg-sections">

        {/* ── Store Information ── */}
        <div className="stg-card">
          <SectionHeader
            icon={<Store size={16} strokeWidth={2} />}
            title="Store Information"
            desc="Basic details about your store"
          />
          <div className="stg-card-body">
            <Field label="Store name">
              <input
                className="prd-input"
                placeholder="My Store"
                value={form.store_name}
                onChange={e => updateField('store_name', e.target.value)}
              />
            </Field>
            <Field label="Currency" hint="Used for all price display and calculations">
              <div className="stg-select-wrap">
                <select
                  className="prd-input cursor-pointer"
                  value={form.currency}
                  onChange={e => updateField('currency', e.target.value)}
                >
                  {CURRENCIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </Field>
          </div>
        </div>

        {/* ── Tax ── */}
        <div className="stg-card">
          <SectionHeader
            icon={<DollarSign size={16} strokeWidth={2} />}
            title="Tax Configuration"
            desc="How tax is applied to sales"
          />
          <div className="stg-card-body">
            <Field label="Tax type">
              <div className="stg-radio-group">
                {(['exclusive', 'inclusive', 'none'] as const).map(t => (
                  <label key={t} className={`stg-radio-opt ${form.tax_type === t ? 'stg-radio-opt--active' : ''}`}>
                    <input
                      type="radio"
                      name="tax_type"
                      value={t}
                      checked={form.tax_type === t}
                      onChange={() => updateField('tax_type', t)}
                      className="sr-only"
                    />
                    <div className={`stg-radio-dot ${form.tax_type === t ? 'stg-radio-dot--active' : ''}`} />
                    <div>
                      <p className="stg-radio-label capitalize">{t === 'none' ? 'No tax' : `${t.charAt(0).toUpperCase() + t.slice(1)} tax`}</p>
                      <p className="stg-radio-desc">
                        {t === 'exclusive' && 'Tax added on top of price'}
                        {t === 'inclusive' && 'Tax included in price'}
                        {t === 'none' && 'No tax applied'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </Field>

            {form.tax_type !== 'none' && (
              <Field label="Tax rate (%)" hint="Applied to all taxable products">
                <div className="stg-pct-wrap">
                  <input
                    className="prd-input pr-8"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    value={form.tax_value}
                    onChange={e => updateField('tax_value', e.target.value)}
                  />
                  <span className="stg-pct-label">%</span>
                </div>
              </Field>
            )}
          </div>
        </div>

        {/* ── Inventory ── */}
        <div className="stg-card">
          <SectionHeader
            icon={<Package size={16} strokeWidth={2} />}
            title="Inventory"
            desc="Stock tracking settings"
          />
          <div className="stg-card-body">
            <div className="stg-toggle-row">
              <div>
                <p className="text-sm font-medium text-gray-800">Track inventory</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Automatically reduce stock quantity when a sale is completed
                </p>
              </div>
              <Toggle
                on={form.inventory_enabled}
                onChange={v => updateField('inventory_enabled', v)}
              />
            </div>
          </div>
        </div>

        {/* ── Receipt ── */}
        <div className="stg-card">
          <SectionHeader
            icon={<Receipt size={16} strokeWidth={2} />}
            title="Receipt Customization"
            desc="Text printed at the top and bottom of receipts"
          />
          <div className="stg-card-body">
            <Field label="Receipt header" hint="Shown at the top — store name, address, tagline, etc.">
              <textarea
                className="prd-input resize-none"
                rows={3}
                placeholder="e.g. Main Street Coffee&#10;123 Main St, New York&#10;Thank you for visiting!"
                value={form.receipt_header}
                onChange={e => updateField('receipt_header', e.target.value)}
              />
            </Field>
            <Field label="Receipt footer" hint="Shown at the bottom — return policy, website, social links, etc.">
              <textarea
                className="prd-input resize-none"
                rows={2}
                placeholder="e.g. Visit us at mainstreetcoffee.com"
                value={form.receipt_footer}
                onChange={e => updateField('receipt_footer', e.target.value)}
              />
            </Field>

            {/* Preview */}
            {(form.receipt_header || form.receipt_footer) && (
              <div className="stg-receipt-preview">
                <p className="stg-preview-label">Preview</p>
                <div className="stg-receipt-mock">
                  {form.receipt_header && (
                    <pre className="stg-receipt-text">{form.receipt_header}</pre>
                  )}
                  <div className="stg-receipt-divider" />
                  <p className="stg-receipt-body-hint">— order items here —</p>
                  <div className="stg-receipt-divider" />
                  {form.receipt_footer && (
                    <pre className="stg-receipt-text">{form.receipt_footer}</pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Payments ── */}
        <div className="stg-card">
          <SectionHeader
            icon={<Smartphone size={16} strokeWidth={2} />}
            title="Payment Settings"
            desc="Configure UPI and digital payment options"
          />
          <div className="stg-card-body">
            <Field label="UPI ID" hint="Used to generate a payment QR code for UPI / GPay transactions. Example: yourname@upi">
              <input
                className="prd-input"
                placeholder="yourname@upi or 9999999999@paytm"
                value={form.upi_id}
                onChange={e => updateField('upi_id', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── Appearance ── */}
        <div className="stg-card">
          <SectionHeader
            icon={<Palette size={16} strokeWidth={2} />}
            title="Appearance"
            desc="Choose a colour theme for the interface"
          />
          <div className="stg-card-body">
            {/* Mode selector */}
            <Field label="Theme mode">
              <div className="stg-radio-group stg-radio-group--row">
                {([
                  { val: 'light',  icon: <Sun size={14} />,     label: 'Light' },
                  { val: 'dark',   icon: <Moon size={14} />,    label: 'Dark' },
                  { val: 'custom', icon: <Palette size={14} />, label: 'Custom' },
                ] as { val: ThemeMode; icon: React.ReactNode; label: string }[]).map(opt => (
                  <label
                    key={opt.val}
                    className={`stg-radio-opt stg-radio-opt--compact ${theme.mode === opt.val ? 'stg-radio-opt--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="theme_mode"
                      value={opt.val}
                      checked={theme.mode === opt.val}
                      onChange={() => setMode(opt.val)}
                      className="sr-only"
                    />
                    <div className={`stg-radio-dot ${theme.mode === opt.val ? 'stg-radio-dot--active' : ''}`} />
                    <div className="flex items-center gap-1.5">
                      {opt.icon}
                      <p className="stg-radio-label">{opt.label}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Field>

            {/* Custom colour pickers — only shown in custom mode */}
            {theme.mode === 'custom' && (
              <div className="stg-appearance-grid">
                {COLOR_FIELDS.map(f => (
                  <div key={f.key} className="stg-color-row">
                    <label className="stg-color-label">{f.label}</label>
                    <div className="stg-color-input-wrap">
                      <input
                        type="color"
                        className="stg-color-picker"
                        value={theme.colors[f.key]}
                        onChange={e => setCustomColors({ [f.key]: e.target.value })}
                      />
                      <span className="stg-color-hex">{theme.colors[f.key]}</span>
                    </div>
                  </div>
                ))}
                <button
                  className="stg-color-reset"
                  onClick={() => setCustomColors(DEFAULT_CUSTOM)}
                >
                  Reset to defaults
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sticky save bar shown when dirty */}
      {isDirty && (
        <div className="stg-sticky-bar">
          <p className="text-sm text-gray-600">You have unsaved changes</p>
          <div className="flex items-center gap-2">
            <button className="prd-btn-secondary" onClick={reset} disabled={saving}>
              <RotateCcw size={13} /> Discard
            </button>
            <button className="pos-btn-primary" onClick={save} disabled={saving}>
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Save size={14} /> Save changes</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
