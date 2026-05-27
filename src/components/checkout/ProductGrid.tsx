import { useState } from 'react'
import { Search, Package, ChevronDown } from 'lucide-react'
import type { Product } from '@/types/pos'
import { currencySymbol } from '@/lib/utils'

interface Props {
  products: Product[]
  categories: string[]
  search: string
  onSearchChange: (v: string) => void
  activeCategory: string
  onCategoryChange: (v: string) => void
  onAdd: (p: { id: string; name: string; price: number; stock_quantity: number }) => void
  cartQtys: Record<string, number>
  loading: boolean
  currency: string
  searchRef: React.RefObject<HTMLInputElement | null>
  storeName?: string
}

function ProductCard({
  p, qty, sym, onAdd,
}: {
  p: Product
  qty: number
  sym: string
  onAdd: (p: Product) => void
}) {
  const outOfStock = p.stock_quantity === 0
  const lowStock = !outOfStock && p.stock_quantity <= 5
  return (
    <button
      className={`pg-product-card ${outOfStock ? 'pg-product-card--out' : ''}`}
      onClick={() => !outOfStock && onAdd(p)}
      disabled={outOfStock}
      type="button"
    >
      {qty > 0 && <span className="pg-qty-badge">{qty}</span>}
      <div className="pg-product-img-wrap">
        {p.image_url ? (
          <>
            <img
              src={p.image_url}
              alt={p.name}
              className="pg-product-img"
              onError={e => {
                e.currentTarget.style.display = 'none'
                const fb = e.currentTarget.nextElementSibling as HTMLElement | null
                if (fb) fb.style.display = 'flex'
              }}
            />
            <div className="pg-product-icon" style={{ display: 'none' }}>📦</div>
          </>
        ) : (
          <div className="pg-product-icon">📦</div>
        )}
      </div>
      <div className="pg-product-info">
        <p className="pg-product-name">{p.name}</p>
        {p.description && <p className="pg-product-desc">{p.description}</p>}
        <div className="pg-product-footer">
          <span className="pg-product-price">{sym}{p.price.toFixed(2)}</span>
          {lowStock && <span className="pg-product-stock pg-product-stock--low">{p.stock_quantity} left</span>}
          {outOfStock && <span className="pg-product-stock pg-product-stock--out">Out of stock</span>}
        </div>
      </div>
    </button>
  )
}

export default function ProductGrid({
  products, categories, search, onSearchChange,
  activeCategory, onCategoryChange, onAdd, cartQtys, loading, currency, searchRef, storeName,
}: Props) {
  const sym = currencySymbol(currency)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const catList = categories.filter(c => c !== 'All')

  // Grouped view: All tab + no search
  const showGrouped = activeCategory === 'All' && !search && catList.length >= 2

  const groupedByCategory: { cat: string; items: Product[] }[] = showGrouped
    ? catList
        .map(cat => ({ cat, items: products.filter(p => p.category === cat) }))
        .filter(g => g.items.length > 0)
    : []

  function toggleCollapse(cat: string) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div className="pg-root">

      {/* ── Top bar: store name + search ─────────── */}
      <div className="pg-topbar">
        <p className="pg-topbar-title">{storeName ?? 'Retail POS'}</p>
        <div className="pg-search-wrap">
          <Search size={14} className="pg-search-icon" />
          <input
            ref={searchRef as React.RefObject<HTMLInputElement>}
            className="pg-search-input"
            placeholder="Search products… (press / to focus)"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category pills ───────────────────────── */}
      <div className="pg-cats">
        {categories.map(cat => (
          <button
            key={cat}
            className={`pg-cat-btn ${activeCategory === cat ? 'pg-cat-btn--active' : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Products ─────────────────────────────── */}
      {loading ? (
        <div className="pg-empty">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="pg-empty">
          <Package size={36} strokeWidth={1.5} />
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No products found</p>
        </div>
      ) : showGrouped ? (
        /* Grouped by category with collapsible headers */
        <div className="pg-grouped">
          {groupedByCategory.map(({ cat, items }) => {
            const isCollapsed = collapsed[cat] ?? false
            return (
              <div key={cat} className="pg-group">
                <button
                  className="pg-group-header"
                  onClick={() => toggleCollapse(cat)}
                  type="button"
                >
                  <span className="pg-group-title">{cat}</span>
                  <span className="pg-group-count">{items.length}</span>
                  <ChevronDown
                    size={14}
                    className={`pg-group-chevron ${isCollapsed ? '' : 'pg-group-chevron--open'}`}
                  />
                </button>
                {!isCollapsed && (
                  <div className="pg-grid pg-group-grid">
                    {items.map(p => (
                      <ProductCard
                        key={p.id}
                        p={p}
                        qty={cartQtys[p.id] ?? 0}
                        sym={sym}
                        onAdd={onAdd}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Flat grid (specific category selected or searching) */
        <div className="pg-grid">
          {products.map(p => (
            <ProductCard
              key={p.id}
              p={p}
              qty={cartQtys[p.id] ?? 0}
              sym={sym}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}
    </div>
  )
}
