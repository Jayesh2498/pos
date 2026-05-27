import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'
import type { Product } from '@/types/pos'

export function useCheckoutProducts() {
  const { storeId } = useActiveStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const searchRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    if (!storeId) { setProducts([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name')
    setProducts((data ?? []) as Product[])
    setLoading(false)
  }, [storeId])

  useEffect(() => { load() }, [load])

  const categories = ['All', ...Array.from(new Set(
    products.map(p => p.category).filter((c): c is string => !!c)
  ))]

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    return matchSearch && matchCat
  })

  return {
    products, filtered, loading,
    search, setSearch,
    activeCategory, setActiveCategory,
    categories,
    searchRef,
    refetch: load,
  }
}
