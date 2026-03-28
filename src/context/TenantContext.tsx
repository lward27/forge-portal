import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { api } from '../api/client'
import type { AuthMe, Database } from '../types'

interface TenantContextType {
  me: AuthMe | null
  tenantId: string | null
  databases: Database[]
  selectedDb: Database | null
  selectDb: (db: Database) => void
  refreshDatabases: () => Promise<void>
  refreshKey: number
  triggerRefresh: () => void
  loading: boolean
}

const TenantContext = createContext<TenantContextType>({
  me: null,
  tenantId: null,
  databases: [],
  selectedDb: null,
  selectDb: () => {},
  refreshDatabases: async () => {},
  refreshKey: 0,
  triggerRefresh: () => {},
  loading: true,
})

export function TenantProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<AuthMe | null>(null)
  const [databases, setDatabases] = useState<Database[]>([])
  const [selectedDb, setSelectedDb] = useState<Database | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const tenantId = me?.tenant_id || null

  useEffect(() => {
    loadContext()
  }, [])

  async function loadContext() {
    try {
      const meRes = await api.get<AuthMe>('/auth/me')
      setMe(meRes)

      if (meRes.tenant_id) {
        const dbRes = await api.get<{ databases: Database[] }>(
          `/tenants/${meRes.tenant_id}/databases`
        )
        setDatabases(dbRes.databases)
        if (dbRes.databases.length === 1) {
          setSelectedDb(dbRes.databases[0])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function refreshDatabases() {
    if (!tenantId) return
    const dbRes = await api.get<{ databases: Database[] }>(
      `/tenants/${tenantId}/databases`
    )
    setDatabases(dbRes.databases)
    if (dbRes.databases.length === 1) {
      setSelectedDb(dbRes.databases[0])
    } else if (selectedDb && !dbRes.databases.find(d => d.id === selectedDb.id)) {
      setSelectedDb(dbRes.databases[0] || null)
    }
  }

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <TenantContext.Provider value={{
      me, tenantId, databases, selectedDb, selectDb: setSelectedDb,
      refreshDatabases, refreshKey, triggerRefresh, loading,
    }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}
