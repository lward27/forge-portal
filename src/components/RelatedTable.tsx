import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import type { RowData, ViewDef } from '../types'

interface Props {
  tableName: string
  column: string
  count: number
  rows: RowData[]
  onAdd: () => void
  viewId?: string | null
}

export function RelatedTable({ tableName, column, count, rows, onAdd, viewId }: Props) {
  const navigate = useNavigate()
  const { tenantId, selectedDb } = useTenant()
  const [expanded, setExpanded] = useState(count <= 20)
  const [viewConfig, setViewConfig] = useState<ViewDef | null>(null)

  // Fetch the view config — use specific viewId if provided, otherwise default
  useEffect(() => {
    if (!tenantId || !selectedDb) return
    if (viewId) {
      api.get<ViewDef>(
        `/tenants/${tenantId}/databases/${selectedDb.id}/tables/${tableName}/views/${viewId}`
      )
        .then(res => setViewConfig(res))
        .catch(() => {})
    } else {
      api.get<{ views: ViewDef[] }>(
        `/tenants/${tenantId}/databases/${selectedDb.id}/tables/${tableName}/views?default=true`
      )
        .then(res => { if (res.views.length > 0) setViewConfig(res.views[0]) })
        .catch(() => {})
    }
  }, [tenantId, selectedDb, tableName, viewId])

  // Determine columns to display — use view config if available
  let displayCols: string[]
  if (viewConfig) {
    displayCols = viewConfig.config.columns
      .filter(c => c.visible && c.field !== column)
      .map(c => c.field)
      .slice(0, 6)
  } else {
    displayCols = rows.length > 0
      ? Object.keys(rows[0]).filter(k => k !== column && !k.endsWith('__display')).slice(0, 5)
      : []
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-medium text-gray-900">{tableName}</span>
          <span className="text-sm text-gray-500">({count})</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd() }}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      {expanded && rows.length > 0 && (
        <div className="border-t border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {displayCols.map(col => (
                  <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.slice(0, 20).map((row, i) => (
                <tr
                  key={i}
                  onClick={() => navigate(`/tables/${tableName}/records/${row.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  {displayCols.map(col => (
                    <td key={col} className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate">
                      {row[`${col}__display`] != null ? String(row[`${col}__display`]) : String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {count > 20 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <button
                onClick={() => navigate(`/tables/${tableName}`)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all {count} records
              </button>
            </div>
          )}
        </div>
      )}
      {expanded && rows.length === 0 && (
        <div className="border-t border-gray-200 px-4 py-4 text-sm text-gray-400 text-center">
          No records yet
        </div>
      )}
    </div>
  )
}
