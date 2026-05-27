import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'
import { useStore } from '@/hooks/use-store'
import type { Category } from '@/types/pos'

export interface CategoryFormData {
  name: string
  color: string
  icon: string
}

export const emptyCategory: CategoryFormData = {
  name: '',
  color: '#7C3AED',
  icon: '',
}

export const CATEGORY_COLORS = [
  '#7C3AED', '#0EA5E9', '#F59E0B', '#EF4444',
  '#10B981', '#F97316', '#8B5CF6', '#06B6D4',
  '#EC4899', '#14B8A6', '#84CC16', '#6366F1',
]

export const CATEGORY_ICONS = [
  '☕', '🍽️', '🛍️', '🥐', '🍺', '🚚', '💊', '📱',
  '👕', '🏪', '🍕', '🍰', '🥤', '🧃', '🍦', '🎁',
  '📦', '🧴', '🌿', '🔧', '💻', '📚', '🎮', '🍫',
]

export function useCategories() {
  const { storeId } = useActiveStore()
  const { store, loading: storeLoading } = useStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const workspaceId = store?.workspace_id ?? '00000000-0000-0000-0000-000000000000'

  const fetch = useCallback(async () => {
    if (storeLoading || !storeId) return
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order')
      .order('name')
    setCategories((data ?? []) as Category[])
    setLoading(false)
  }, [storeId, storeLoading])

  useEffect(() => { fetch() }, [fetch])

  async function addCategory(form: CategoryFormData): Promise<boolean> {
    if (!form.name.trim() || !storeId) return false
    setSaving(true)
    const { error } = await supabase.from('categories').insert({
      store_id: storeId,
      workspace_id: workspaceId,
      name: form.name.trim(),
      color: form.color || null,
      icon: form.icon.trim() || null,
      sort_order: categories.length,
    })
    setSaving(false)
    if (!error) await fetch()
    return !error
  }

  async function updateCategory(id: string, form: CategoryFormData): Promise<boolean> {
    setSaving(true)
    const { error } = await supabase.from('categories').update({
      name: form.name.trim(),
      color: form.color || null,
      icon: form.icon.trim() || null,
    }).eq('id', id)
    setSaving(false)
    if (!error) await fetch()
    return !error
  }

  async function deleteCategory(id: string) {
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  async function reorder(ids: string[]) {
    setCategories(prev => {
      const map = new Map(prev.map(c => [c.id, c]))
      return ids.map((id, i) => ({ ...map.get(id)!, sort_order: i }))
    })
    await Promise.all(
      ids.map((id, i) => supabase.from('categories').update({ sort_order: i }).eq('id', id))
    )
  }

  return {
    categories, loading, saving,
    addCategory, updateCategory, deleteCategory, reorder,
    refetch: fetch,
  }
}
