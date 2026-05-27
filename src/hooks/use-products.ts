import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'
import type { Product } from '@/types/pos'

export type ProductFormData = {
  name: string
  sku: string
  category: string
  price: string
  stock_quantity: string
  is_active: boolean
  image_url: string
  barcode: string
  description: string
}

export const emptyForm: ProductFormData = {
  name: '',
  sku: '',
  category: '',
  price: '',
  stock_quantity: '',
  is_active: true,
  image_url: '',
  barcode: '',
  description: '',
}

export function useProducts() {
  const { storeId } = useActiveStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const fetch = useCallback(async () => {
    if (!storeId) { setProducts([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('name')
    setProducts((data ?? []) as Product[])
    setLoading(false)
  }, [storeId])

  useEffect(() => { fetch() }, [fetch])

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]]

  const filtered = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter
    return matchSearch && matchCat
  })

  async function addProduct(form: ProductFormData) {
    if (!storeId) return false
    setSaving(true)
    const { error } = await supabase.from('products').insert({
      store_id: storeId,
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      category: form.category.trim() || null,
      price: parseFloat(form.price) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      is_active: form.is_active,
      image_url: form.image_url.trim() || null,
      barcode: form.barcode.trim() || null,
      description: form.description.trim() || null,
    })
    setSaving(false)
    if (!error) await fetch()
    return !error
  }

  async function updateProduct(id: string, form: ProductFormData) {
    setSaving(true)
    const { error } = await supabase.from('products').update({
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      category: form.category.trim() || null,
      price: parseFloat(form.price) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      is_active: form.is_active,
      image_url: form.image_url.trim() || null,
      barcode: form.barcode.trim() || null,
      description: form.description.trim() || null,
    }).eq('id', id)
    setSaving(false)
    if (!error) await fetch()
    return !error
  }

  async function deleteProduct(id: string) {
    await supabase.from('products').delete().eq('id', id)
    await fetch()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('products').update({ is_active: !current }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
  }

  function findByBarcode(barcode: string): Product | undefined {
    return products.find(p => p.barcode === barcode.trim())
  }

  return {
    products, filtered, loading, saving,
    search, setSearch,
    categoryFilter, setCategoryFilter, categories,
    addProduct, updateProduct, deleteProduct, toggleActive,
    findByBarcode,
    refetch: fetch,
  }
}
