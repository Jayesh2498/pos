import { createContext, useContext, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'pos_active_store_id'

interface ActiveStoreCtx {
  storeId: string | null
  setStoreId: (id: string) => void
  clearStoreId: () => void
}

const Ctx = createContext<ActiveStoreCtx>({
  storeId: null,
  setStoreId: () => {},
  clearStoreId: () => {},
})

export function ActiveStoreProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  )

  function setStoreId(id: string) {
    localStorage.setItem(STORAGE_KEY, id)
    setStoreIdState(id)
  }

  function clearStoreId() {
    localStorage.removeItem(STORAGE_KEY)
    setStoreIdState(null)
  }

  return (
    <Ctx.Provider value={{ storeId, setStoreId, clearStoreId }}>
      {children}
    </Ctx.Provider>
  )
}

export function useActiveStore() {
  return useContext(Ctx)
}
