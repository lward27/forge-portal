import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import type { RowData, RowListResponse, ViewDef, TableDef } from '../types'

interface Props {
  table: string
  viewId?: string | null
  maxRows?: number
}

export function ViewWidget({ table, viewId, maxRows = 8 }: Props) {
  const { tenantId, selectedDb } = useTenant()
  const navigate = useNavigate()
  const [rows, setRows] = useState<RowData[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !selectedDb) return
    setLoading(true)
    const base = `/tenants/${tenantId}/databases/${selectedDb.id}/tables/${table}`

    Promise.all([
      viewId
        ? api.get<ViewDef>(`${base}/views/${viewId}`)
        : api.get<{ views: ViewDef[] }>(`${base}/views?default=true`).then(r => r.views[0]),
      api.get<TableDef>(base),
    ]).then(([view, tbl]) => {
      const visibleCols = view?.config?.columns
        ?.filter(c => c.visible)
        .map(c => c.field) || tbl.columns.map(c => c.name)
      setColumns(visibleCols.slice(0, 5))

      const sort = view?.config?.default_sort
      let url = `${base}/rows?limit=${maxRows}`
      if (sort) url += `&sort=${sort.direction === 'desc' ? '-' : ''}${sort.field}`

      return api.get<RowListResponse>(url)
    }).then(res => {
      setRows(res.rows)
    }).finally(() => setLoading(false))
  }, [tenantId, selectedDb, table, viewId, maxRows])

  if (loading) return <div className="animate-pulse bg-gray-100 rounded h-full" />

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map(c => (
              <th key={c} className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} onClick={() => navigate(`/tables/${table}/records/${row.id}`)}
              className="cursor-pointer hover:bg-gray-50">
              {columns.map(c => (
                <td key={c} className="px-2 py-1 text-gray-700 whitespace-nowrap truncate max-w-[120px]">
                  {row[`${c}__display`] != null ? String(row[`${c}__display`]) : String(row[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No records</p>}
    </div>
  )
}
