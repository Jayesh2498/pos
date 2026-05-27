import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import type { Product } from '@/types/pos'
import { currencySymbol } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'

interface Props {
  category: string
  products: Product[]
  viewMode: 'grid' | 'list'
  collapsed: boolean
  onToggleCollapse: () => void
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, current: boolean) => void
  deleteConfirm: string | null
}

export default function ProductCategorySection({
  category, products, viewMode, collapsed, onToggleCollapse,
  onEdit, onDelete, onToggleActive, deleteConfirm,
}: Props) {
  const { store } = useStore()
  const sym = currencySymbol(store?.currency ?? 'USD')

  return (
    <div className="prd-cat-section">
      <div className="prd-cat-header" onClick={onToggleCollapse}>
        <ChevronRight
          size={16}
          className={`prd-cat-chevron ${!collapsed ? 'prd-cat-chevron--open' : ''}`}
        />
        <span className="prd-cat-name">{category}</span>
        <span className="prd-cat-count">({products.length})</span>
      </div>

      {!collapsed && (
        viewMode === 'grid' ? (
          <div className="prd-product-grid">
            {products.map(p => (
              <div key={p.id} className="prd-card" style={{ opacity: p.is_active ? 1 : 0.6 }}>
                {!p.is_active && <span className="prd-inactive-badge">Inactive</span>}
                {p.image_url && <img className="prd-card-img" src={p.image_url} alt={p.name} />}
                <p className="prd-card-name">{p.name}</p>
                <p className="prd-card-price">{sym}{p.price.toFixed(2)}</p>
                <div className="prd-card-meta">
                  <span className={`prd-card-stock ${p.stock_quantity === 0 ? 'prd-card-stock--out' : p.stock_quantity <= 5 ? 'prd-card-stock--low' : ''}`}>
                    {p.stock_quantity} in stock
                  </span>
                  <button
                    className={`prd-toggle ${p.is_active ? 'prd-toggle--on' : 'prd-toggle--off'}`}
                    style={{ transform: 'scale(0.75)' }}
                    onClick={() => onToggleActive(p.id, p.is_active)}
                  >
                    <span className="prd-toggle-knob" />
                  </button>
                </div>
                <div className="prd-card-actions">
                  <button className="prd-card-action-btn prd-card-action-btn--edit" onClick={() => onEdit(p)}>
                    <Pencil size={11} /> Edit
                  </button>
                  <button className="prd-card-action-btn prd-card-action-btn--del" onClick={() => onDelete(p.id)}>
                    <Trash2 size={11} />
                    {deleteConfirm === p.id ? 'Sure?' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="prd-product-list">
            {products.map(p => (
              <div key={p.id} className="prd-list-row" style={{ opacity: p.is_active ? 1 : 0.6 }}>
                <span className="prd-list-row-name">{p.name}</span>
                {p.sku && <span className="prd-list-row-sku">{p.sku}</span>}
                <span className="prd-list-row-stock">{p.stock_quantity} units</span>
                <span className="prd-list-row-price">{sym}{p.price.toFixed(2)}</span>
                <button
                  className={`prd-toggle ${p.is_active ? 'prd-toggle--on' : 'prd-toggle--off'}`}
                  style={{ transform: 'scale(0.8)' }}
                  onClick={() => onToggleActive(p.id, p.is_active)}
                >
                  <span className="prd-toggle-knob" />
                </button>
                <button className="prd-card-action-btn prd-card-action-btn--edit" onClick={() => onEdit(p)}>
                  <Pencil size={11} /> Edit
                </button>
                <button className="prd-card-action-btn prd-card-action-btn--del" onClick={() => onDelete(p.id)}>
                  <Trash2 size={11} /> {deleteConfirm === p.id ? 'Sure?' : ''}
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
