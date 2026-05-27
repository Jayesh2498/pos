import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'
import type { Store } from '@/types/pos'

export function useStore() {
  const { storeId } = useActiveStore()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!storeId) { setStore(null); setLoading(false); return }
    setLoading(true)
    setStore(null) // clear stale data immediately on storeId change
    supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()
      .then(({ data }) => {
        setStore(data as Store ?? null)
        setLoading(false)
      })
  }, [storeId])

  return { store, loading }
}
