import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveStore } from '@/lib/active-store'
import type { Store } from '@/types/pos'

export interface SettingsForm {
  store_name: string
  currency: string
  tax_type: 'inclusive' | 'exclusive' | 'none'
  tax_value: string
  inventory_enabled: boolean
  receipt_header: string
  receipt_footer: string
  upi_id: string
}

function storeToForm(s: Store): SettingsForm {
  return {
    store_name: s.store_name,
    currency: s.currency,
    tax_type: s.tax_type,
    tax_value: s.tax_value.toString(),
    inventory_enabled: s.inventory_enabled,
    receipt_header: s.receipt_header ?? '',
    receipt_footer: s.receipt_footer ?? '',
    upi_id: (s as any).upi_id ?? '',
  }
}

export function useSettings() {
  const { storeId } = useActiveStore()
  const [store, setStore] = useState<Store | null>(null)
  const [form, setForm] = useState<SettingsForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId) { setLoading(false); return }
    supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()
      .then(({ data }) => {
        if (data) {
          setStore(data as Store)
          setForm(storeToForm(data as Store))
        }
        setLoading(false)
      })
  }, [storeId])

  function updateField<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev)
    setSaved(false)
  }

  async function save() {
    if (!form || !storeId) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('stores')
      .update({
        store_name: form.store_name.trim() || 'My Store',
        currency: form.currency.toUpperCase().slice(0, 3) || 'USD',
        tax_type: form.tax_type,
        tax_value: parseFloat(form.tax_value) || 0,
        inventory_enabled: form.inventory_enabled,
        receipt_header: form.receipt_header.trim() || null,
        receipt_footer: form.receipt_footer.trim() || null,
        upi_id: form.upi_id.trim() || null,
      })
      .eq('id', storeId)

    if (err) {
      setError(`Failed to save: ${err.message}`)
    } else {
      const { data: fresh } = await supabase.from('stores').select('*').eq('id', storeId).single()
      if (fresh) {
        setStore(fresh as Store)
        setForm(storeToForm(fresh as Store))
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  function reset() {
    if (store) setForm(storeToForm(store))
    setSaved(false)
  }

  const isDirty = form && store
    ? JSON.stringify(form) !== JSON.stringify(storeToForm(store))
    : false

  return { store, form, loading, saving, saved, error, isDirty, updateField, save, reset }
}
