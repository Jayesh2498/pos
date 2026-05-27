import { useState } from 'react'
import { X, Camera, ScanBarcode, ChevronDown } from 'lucide-react'
import type { ProductFormData } from '@/hooks/use-products'
import BarcodeCameraScanner from '@/components/BarcodeCameraScanner'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (f: ProductFormData) => Promise<boolean>
  form: ProductFormData
  setForm: React.Dispatch<React.SetStateAction<ProductFormData>>
  saving: boolean
  mode: 'add' | 'edit'
  existingCategories?: string[]
}

export default function ProductModal({ open, onClose, onSubmit, form, setForm, saving, mode, existingCategories = [] }: Props) {
  const [barcodeMode, setBarcodeMode] = useState<'text' | 'camera' | null>(null)
  const [newCategory, setNewCategory] = useState(false)

  if (!open) return null

  function f<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await onSubmit(form)
    if (ok) onClose()
  }

  // Category options: existing + "Add new…"
  const catOptions = existingCategories.filter(Boolean)

  return (
    <div className="prd-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <form className="prd-modal" onSubmit={handleSubmit}>
        <div className="prd-modal-header">
          <h2 className="prd-modal-title">{mode === 'add' ? 'Add Product' : 'Edit Product'}</h2>
          <button type="button" className="prd-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="prd-modal-body">
          {/* Name */}
          <div className="prd-form-field">
            <label className="prd-form-label">Name *</label>
            <input
              className="prd-input"
              placeholder="Product name"
              value={form.name}
              onChange={e => f('name', e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* SKU + Category */}
          <div className="prd-form-row">
            <div className="prd-form-field">
              <label className="prd-form-label">SKU</label>
              <input className="prd-input" placeholder="e.g. CAF-001" value={form.sku} onChange={e => f('sku', e.target.value)} />
            </div>
            <div className="prd-form-field">
              <label className="prd-form-label">Category</label>
              {newCategory || catOptions.length === 0 ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="prd-input"
                    placeholder="New category name"
                    value={form.category}
                    onChange={e => f('category', e.target.value)}
                    autoFocus={newCategory}
                  />
                  {catOptions.length > 0 && (
                    <button
                      type="button"
                      className="prd-btn-secondary"
                      style={{ whiteSpace: 'nowrap', fontSize: 11 }}
                      onClick={() => setNewCategory(false)}
                    >
                      Pick existing
                    </button>
                  )}
                </div>
              ) : (
                <div className="prd-cat-select-wrap">
                  <select
                    className="prd-input prd-cat-select"
                    value={form.category}
                    onChange={e => {
                      if (e.target.value === '__new__') { setNewCategory(true); f('category', '') }
                      else f('category', e.target.value)
                    }}
                  >
                    <option value="">Select category…</option>
                    {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__new__">+ Add new category…</option>
                  </select>
                  <ChevronDown size={14} className="prd-cat-chevron" />
                </div>
              )}
            </div>
          </div>

          {/* Price + Stock */}
          <div className="prd-form-row">
            <div className="prd-form-field">
              <label className="prd-form-label">Price *</label>
              <input className="prd-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => f('price', e.target.value)} required />
            </div>
            <div className="prd-form-field">
              <label className="prd-form-label">Stock qty</label>
              <input className="prd-input" type="number" min="0" placeholder="0" value={form.stock_quantity} onChange={e => f('stock_quantity', e.target.value)} />
            </div>
          </div>

          {/* Barcode with scanner */}
          <div className="prd-form-field">
            <label className="prd-form-label">Barcode</label>
            {barcodeMode === 'camera' ? (
              <BarcodeCameraScanner
                onDetected={code => { f('barcode', code); setBarcodeMode(null) }}
                onClose={() => setBarcodeMode(null)}
              />
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="prd-input"
                  placeholder="EAN / UPC — scan or type"
                  value={form.barcode}
                  onChange={e => f('barcode', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                />
                <button
                  type="button"
                  className="prd-btn-secondary"
                  style={{ padding: '0 10px', flexShrink: 0 }}
                  title="USB / keyboard scanner mode"
                  onClick={() => setBarcodeMode(barcodeMode === 'text' ? null : 'text')}
                >
                  <ScanBarcode size={15} />
                </button>
                <button
                  type="button"
                  className="prd-btn-secondary"
                  style={{ padding: '0 10px', flexShrink: 0 }}
                  title="Camera scan"
                  onClick={() => setBarcodeMode('camera')}
                >
                  <Camera size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="prd-form-field">
            <label className="prd-form-label">Description</label>
            <input className="prd-input" placeholder="Short description" value={form.description} onChange={e => f('description', e.target.value)} />
          </div>

          {/* Image URL */}
          <div className="prd-form-field">
            <label className="prd-form-label">Image URL</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="prd-input" type="url" placeholder="https://…" value={form.image_url} onChange={e => f('image_url', e.target.value)} />
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="preview"
                  style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1.5px solid var(--color-border)' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="prd-form-toggle-row">
            <span className="prd-form-toggle-label">Active (visible in checkout)</span>
            <button
              type="button"
              onClick={() => f('is_active', !form.is_active)}
              className={`prd-toggle ${form.is_active ? 'prd-toggle--on' : 'prd-toggle--off'}`}
            >
              <span className="prd-toggle-knob" />
            </button>
          </div>
        </div>

        <div className="prd-modal-footer">
          <button type="button" className="prd-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="pos-btn-primary" disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : mode === 'add' ? 'Add Product' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
