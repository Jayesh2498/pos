import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Tag, X, Check } from 'lucide-react'
import {
  useCategories,
  emptyCategory,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  type CategoryFormData,
} from '@/hooks/use-categories'
import type { Category } from '@/types/pos'

// ── Color + Icon pickers ──────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="cat-picker-row">
      {CATEGORY_COLORS.map(c => (
        <button
          key={c}
          type="button"
          className="cat-color-dot"
          style={{
            background: c,
            outline: value === c ? `3px solid ${c}` : 'none',
            outlineOffset: '2px',
          }}
          onClick={() => onChange(c)}
        >
          {value === c && <Check size={10} className="text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: string; onChange: (i: string) => void }) {
  return (
    <div className="cat-icon-grid">
      {CATEGORY_ICONS.map(ico => (
        <button
          key={ico}
          type="button"
          className={`cat-icon-btn ${value === ico ? 'cat-icon-btn--active' : ''}`}
          onClick={() => onChange(value === ico ? '' : ico)}
          title={ico}
        >
          {ico}
        </button>
      ))}
    </div>
  )
}

// ── Category form (inline in modal) ──────────────────────────────
function CategoryForm({
  initial,
  saving,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: CategoryFormData
  saving: boolean
  onSubmit: (f: CategoryFormData) => void
  onCancel: () => void
  submitLabel: string
}) {
  const [form, setForm] = useState<CategoryFormData>(initial)
  const f = <K extends keyof CategoryFormData>(k: K, v: CategoryFormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  return (
    <form
      className="cat-form"
      onSubmit={e => { e.preventDefault(); onSubmit(form) }}
    >
      {/* Preview chip */}
      <div className="cat-form-preview">
        <div className="cat-chip" style={{ background: form.color + '20', borderColor: form.color + '50' }}>
          {form.icon && <span>{form.icon}</span>}
          <span style={{ color: form.color }} className="font-semibold text-[13px]">
            {form.name || 'Preview'}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="cat-field">
        <label className="cat-label">Name <span className="text-red-400">*</span></label>
        <input
          className="cat-input"
          placeholder="e.g. Beverages"
          value={form.name}
          onChange={e => f('name', e.target.value)}
          autoFocus
          required
        />
      </div>

      {/* Icon */}
      <div className="cat-field">
        <label className="cat-label">Icon <span className="cat-label-opt">optional</span></label>
        <IconPicker value={form.icon} onChange={v => f('icon', v)} />
      </div>

      {/* Color */}
      <div className="cat-field">
        <label className="cat-label">Color</label>
        <ColorPicker value={form.color} onChange={v => f('color', v)} />
      </div>

      <div className="cat-form-actions">
        <button type="button" className="cat-btn-cancel" onClick={onCancel}>Cancel</button>
        <button
          type="submit"
          className="cat-btn-submit"
          disabled={saving || !form.name.trim()}
          style={{ background: form.color }}
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ── Category row ──────────────────────────────────────────────────
function CategoryRow({
  cat,
  onEdit,
  onDelete,
  deleteConfirm,
}: {
  cat: Category
  onEdit: () => void
  onDelete: () => void
  deleteConfirm: boolean
}) {
  const color = cat.color ?? '#7C3AED'
  return (
    <div className="cat-row">
      <div className="cat-row-drag">
        <GripVertical size={14} strokeWidth={2} />
      </div>

      <div className="cat-chip" style={{ background: color + '18', borderColor: color + '40' }}>
        {cat.icon && <span>{cat.icon}</span>}
        <span style={{ color }} className="font-semibold text-[13px]">{cat.name}</span>
      </div>

      <div className="cat-row-spacer" />

      <div className="cat-row-actions">
        <button className="cat-row-btn" onClick={onEdit} title="Edit">
          <Pencil size={13} strokeWidth={2} />
        </button>
        <button
          className={`cat-row-btn cat-row-btn--del ${deleteConfirm ? 'cat-row-btn--del-confirm' : ''}`}
          onClick={onDelete}
          title={deleteConfirm ? 'Click again to confirm delete' : 'Delete'}
        >
          <Trash2 size={13} strokeWidth={2} />
          {deleteConfirm && <span className="text-[11px]">Confirm?</span>}
        </button>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────
function CategoryModal({
  mode,
  initial,
  saving,
  onSubmit,
  onClose,
}: {
  mode: 'add' | 'edit'
  initial: CategoryFormData
  saving: boolean
  onSubmit: (f: CategoryFormData) => void
  onClose: () => void
}) {
  return (
    <div className="cat-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cat-modal">
        <div className="cat-modal-header">
          <div className="cat-modal-icon">
            <Tag size={15} strokeWidth={2} />
          </div>
          <h2 className="cat-modal-title">{mode === 'add' ? 'New Category' : 'Edit Category'}</h2>
          <button className="cat-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <CategoryForm
          initial={initial}
          saving={saving}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={mode === 'add' ? 'Create Category' : 'Save Changes'}
        />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function Categories() {
  const { categories, loading, saving, addCategory, updateCategory, deleteCategory } = useCategories()

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [formInit, setFormInit] = useState<CategoryFormData>(emptyCategory)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function openAdd() {
    setEditTarget(null)
    setFormInit(emptyCategory)
    setModalMode('add')
  }

  function openEdit(cat: Category) {
    setEditTarget(cat)
    setFormInit({ name: cat.name, color: cat.color ?? '#7C3AED', icon: cat.icon ?? '' })
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setEditTarget(null)
  }

  async function handleSubmit(form: CategoryFormData) {
    let ok = false
    if (modalMode === 'edit' && editTarget) {
      ok = await updateCategory(editTarget.id, form)
    } else {
      ok = await addCategory(form)
    }
    if (ok) closeModal()
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }
    await deleteCategory(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="pos-page max-w-2xl">
      {/* Header */}
      <div className="pos-page-header">
        <div>
          <h1 className="pos-page-title">Categories</h1>
          <p className="pos-page-subtitle">Organise your products into categories</p>
        </div>
        <button className="pos-btn-primary" onClick={openAdd}>
          <Plus size={15} strokeWidth={2.2} /> New Category
        </button>
      </div>

      {/* Info banner */}
      <div className="cat-info-banner">
        <Tag size={14} strokeWidth={2} className="flex-shrink-0" />
        <p>Categories belong to this store. Assign them to products from the Products page.</p>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : categories.length === 0 ? (
        <div className="pos-empty-card">
          <div className="pos-empty-icon" style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, var(--color-bg))' }}>
            <Tag size={26} strokeWidth={1.8} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="pos-empty-title">No categories yet</h2>
          <p className="pos-empty-desc">Create your first category to organise your products.</p>
          <button className="pos-btn-primary mt-3" onClick={openAdd}>
            <Plus size={14} /> Create category
          </button>
        </div>
      ) : (
        <div className="cat-list">
          <div className="cat-list-header">
            <span>{categories.length} {categories.length === 1 ? 'category' : 'categories'}</span>
          </div>
          {categories.map(cat => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              onEdit={() => openEdit(cat)}
              onDelete={() => handleDelete(cat.id)}
              deleteConfirm={deleteConfirm === cat.id}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalMode && (
        <CategoryModal
          mode={modalMode}
          initial={formInit}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
