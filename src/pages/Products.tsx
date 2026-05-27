import { useState, useEffect, useRef } from 'react'
import { Plus, Search, LayoutGrid, List, Package, ScanBarcode, X, CheckCircle2, AlertCircle, Camera } from 'lucide-react'
import { useProducts, emptyForm, type ProductFormData } from '@/hooks/use-products'
import ProductModal from '@/components/products/ProductModal'
import ProductCategorySection from '@/components/products/ProductCategorySection'
import BarcodeCameraScanner from '@/components/BarcodeCameraScanner'
import type { Product } from '@/types/pos'

type ViewMode = 'grid' | 'list'

// ── Barcode scanner banner ────────────────────────────────────────
function BarcodeScannerBar({
  onFind,
  onAdd,
}: {
  onFind: (p: Product) => void
  onAdd: (barcode: string) => void
}) {
  const [active, setActive] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<{ type: 'found' | 'notfound'; label: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { findByBarcode } = useProducts()

  // Auto-focus when opened
  useEffect(() => {
    if (active) setTimeout(() => inputRef.current?.focus(), 80)
  }, [active])

  // Reset result after 3 s
  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => { setResult(null); setValue('') }, 3000)
    return () => clearTimeout(t)
  }, [result])

  function handleInput(raw: string) {
    setValue(raw)
    // USB scanners typically append Enter — we detect that in onKeyDown
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const code = value.trim()
    if (!code) return
    const found = findByBarcode(code)
    if (found) {
      setResult({ type: 'found', label: found.name })
      onFind(found)
    } else {
      setResult({ type: 'notfound', label: code })
    }
  }

  if (!active && !cameraOpen) {
    return (
      <div className="prd-scan-pills">
        <button className="prd-scan-pill" onClick={() => setActive(true)}>
          <ScanBarcode size={14} strokeWidth={2} />
          USB / Type barcode
        </button>
        <button className="prd-scan-pill prd-scan-pill--camera" onClick={() => setCameraOpen(true)}>
          <Camera size={14} strokeWidth={2} />
          Camera scan
        </button>
      </div>
    )
  }

  if (cameraOpen) {
    return (
      <BarcodeCameraScanner
        onDetected={code => {
          setCameraOpen(false)
          const found = findByBarcode(code)
          if (found) onFind(found)
          else onAdd(code)
        }}
        onClose={() => setCameraOpen(false)}
      />
    )
  }

  return (
    <div className="prd-scan-bar">
      <ScanBarcode size={16} strokeWidth={2} className="prd-scan-bar-icon" />
      <span className="prd-scan-bar-label">Scan or type barcode</span>

      <div className="prd-scan-input-wrap">
        <input
          ref={inputRef}
          className="prd-scan-input"
          placeholder="Barcode…"
          value={value}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button className="prd-scan-go" onClick={submit}>Find</button>
      </div>

      {/* Result feedback */}
      {result && (
        result.type === 'found' ? (
          <span className="prd-scan-result prd-scan-result--found">
            <CheckCircle2 size={13} strokeWidth={2} /> {result.label} — opened for edit
          </span>
        ) : (
          <span className="prd-scan-result prd-scan-result--notfound">
            <AlertCircle size={13} strokeWidth={2} /> No product for "{result.label}"
            <button className="prd-scan-addnew" onClick={() => { onAdd(result.label); setActive(false); setValue('') }}>
              + Add new
            </button>
          </span>
        )
      )}

      <button className="prd-scan-close" onClick={() => { setActive(false); setValue(''); setResult(null) }}>
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export default function Products() {
  const {
    filtered, loading, saving,
    search, setSearch,
    categoryFilter, setCategoryFilter, categories,
    addProduct, updateProduct, deleteProduct, toggleActive,
  } = useProducts()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())

  function openAdd(prefillBarcode?: string) {
    setEditTarget(null)
    setForm({ ...emptyForm, barcode: prefillBarcode ?? '' })
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditTarget(p)
    setForm({
      name: p.name,
      sku: p.sku ?? '',
      category: p.category ?? '',
      price: p.price.toString(),
      stock_quantity: p.stock_quantity.toString(),
      is_active: p.is_active,
      image_url: p.image_url ?? '',
      barcode: p.barcode ?? '',
      description: p.description ?? '',
    })
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditTarget(null)
  }

  async function handleSubmit(f: ProductFormData) {
    if (editTarget) return updateProduct(editTarget.id, f)
    return addProduct(f)
  }

  async function handleDelete(id: string) {
    if (deleteConfirm === id) {
      await deleteProduct(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  function toggleCollapse(cat: string) {
    setCollapsedCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  // Group filtered products by category, images first inside each group
  const grouped = (() => {
    const uncategorised: Product[] = []
    const map = new Map<string, Product[]>()

    for (const p of filtered) {
      const cat = p.category?.trim() || ''
      if (!cat) { uncategorised.push(p); continue }
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    }

    const sortGroup = (prods: Product[]) => [
      ...prods.filter(p => p.image_url).sort((a, b) => a.name.localeCompare(b.name)),
      ...prods.filter(p => !p.image_url).sort((a, b) => a.name.localeCompare(b.name)),
    ]

    const sections: { cat: string; products: Product[] }[] = []
    Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([cat, prods]) => sections.push({ cat, products: sortGroup(prods) }))
    if (uncategorised.length > 0)
      sections.push({ cat: 'Uncategorised', products: sortGroup(uncategorised) })
    return sections
  })()

  const totalActive   = filtered.filter(p => p.is_active).length
  const totalLowStock = filtered.filter(p => p.stock_quantity <= 5).length
  const hasImages     = filtered.some(p => p.image_url)

  return (
    <div className="pos-page max-w-6xl">
      {/* ── Header ── */}
      <div className="pos-page-header">
        <div>
          <h1 className="pos-page-title">Products</h1>
          <p className="pos-page-subtitle">Manage your inventory and catalog</p>
        </div>
        <button className="pos-btn-primary" onClick={() => openAdd()}>
          <Plus size={16} strokeWidth={2.2} /> Add Product
        </button>
      </div>

      {/* ── Barcode scanner bar ── */}
      <BarcodeScannerBar onFind={openEdit} onAdd={openAdd} />

      {/* ── Stat pills ── */}
      <div className="prd-stats-row">
        <div className="prd-stat-pill">
          <span className="prd-stat-pill-val">{filtered.length}</span>
          <span className="prd-stat-pill-label">Products</span>
        </div>
        <div className="prd-stat-pill">
          <span className="prd-stat-pill-val prd-stat-pill-val--green">{totalActive}</span>
          <span className="prd-stat-pill-label">Active</span>
        </div>
        {totalLowStock > 0 && (
          <div className="prd-stat-pill">
            <span className="prd-stat-pill-val prd-stat-pill-val--red">{totalLowStock}</span>
            <span className="prd-stat-pill-label">Low stock</span>
          </div>
        )}
        {hasImages && (
          <div className="prd-stat-pill">
            <span className="prd-stat-pill-val" style={{ color: 'var(--color-primary)' }}>
              {filtered.filter(p => p.image_url).length}
            </span>
            <span className="prd-stat-pill-label">With image</span>
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="prd-toolbar">
        <div className="prd-search-wrap">
          <Search size={14} className="prd-search-icon" />
          <input
            className="prd-search-input"
            placeholder="Search by name, SKU or barcode…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="prd-filter-wrap">
            <select
              className="prd-filter-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
              ))}
            </select>
          </div>

          <div className="prd-view-toggle">
            <button
              className={`prd-view-btn ${viewMode === 'grid' ? 'prd-view-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid size={14} strokeWidth={2} />
            </button>
            <button
              className={`prd-view-btn ${viewMode === 'list' ? 'prd-view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading products…
        </div>
      ) : filtered.length === 0 ? (
        <div className="pos-empty-card">
          <div className="pos-empty-icon pos-empty-icon--orange">
            <Package size={28} strokeWidth={1.8} />
          </div>
          <h2 className="pos-empty-title">No products found</h2>
          <p className="pos-empty-desc">Try adjusting your search or add a new product.</p>
        </div>
      ) : (
        <div className="prd-sections">
          {grouped.map(({ cat, products }) => (
            <ProductCategorySection
              key={cat}
              category={cat}
              products={products}
              viewMode={viewMode}
              collapsed={collapsedCats.has(cat)}
              onToggleCollapse={() => toggleCollapse(cat)}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleActive={toggleActive}
              deleteConfirm={deleteConfirm}
            />
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="prd-delete-confirm">
          Click delete again to confirm removal
        </div>
      )}

      <ProductModal
        open={modalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        saving={saving}
        mode={editTarget ? 'edit' : 'add'}
        existingCategories={categories.filter(c => c !== 'all')}
      />
    </div>
  )
}
