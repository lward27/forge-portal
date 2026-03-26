import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import type { RowData } from '../types'

interface RelatedGroup {
  table: string
  column: string
  count: number
  rows: RowData[]
}

interface Props {
  tableName: string
  rowId: number
}

export function RelatedRecords({ tableName, rowId }: Props) {
  const { tenantId, selectedDb } = useTenant()
  const navigate = useNavigate()
  const [related, setRelated] = useState<RelatedGroup[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !selectedDb) return
    setLoading(true)
    api.get<{ related: RelatedGroup[] }>(
      `/tenants/${tenantId}/databases/${selectedDb.id}/tables/${tableName}/rows/${rowId}/related`
    )
      .then(res => setRelated(res.related.filter(r => r.count > 0)))
      .finally(() => setLoading(false))
  }, [tenantId, selectedDb, tableName, rowId])

  if (loading) return null
  if (related.length === 0) return null

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Related Records</h3>
      <div className="space-y-2">
        {related.map(group => (
          <div key={`${group.table}-${group.column}`} className="bg-gray-50 rounded-md border border-gray-200">
            <button
              onClick={() => setExpanded(expanded === group.table ? null : group.table)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span>{group.table} ({group.count})</span>
              {expanded === group.table ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expanded === group.table && (
              <div className="px-3 pb-2 space-y-1">
                {group.rows.slice(0, 10).map((row, i) => {
                  const display = Object.entries(row)
                    .filter(([k]) => k !== 'id' && k !== group.column)
                    .slice(0, 2)
                    .map(([, v]) => String(v ?? ''))
                    .join(' — ')
                  return (
                    <div
                      key={i}
                      onClick={() => navigate(`/tables/${group.table}`)}
                      className="text-sm text-gray-600 px-2 py-1 rounded hover:bg-white cursor-pointer"
                    >
                      <span className="text-gray-400">#{row.id as number}</span> {display}
                    </div>
                  )
                })}
                {group.count > 10 && (
                  <button
                    onClick={() => navigate(`/tables/${group.table}`)}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2"
                  >
                    View all {group.count} records
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
