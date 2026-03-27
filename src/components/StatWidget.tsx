import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import type { RowListResponse } from '../types'

interface Props {
  table: string
}

export function StatWidget({ table }: Props) {
  const { tenantId, selectedDb } = useTenant()
  const navigate = useNavigate()
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!tenantId || !selectedDb) return
    api.get<RowListResponse>(`/tenants/${tenantId}/databases/${selectedDb.id}/tables/${table}/rows?limit=1`)
      .then(res => setCount(res.total))
      .catch(() => setCount(0))
  }, [tenantId, selectedDb, table])

  return (
    <div
      onClick={() => navigate(`/tables/${table}`)}
      className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-50 rounded"
    >
      <span className="text-3xl font-bold text-gray-900">{count ?? '...'}</span>
      <span className="text-xs text-gray-500 mt-1">{table}</span>
    </div>
  )
}
