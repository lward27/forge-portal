import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import type { RowData } from '../types'

interface Props {
  referenceTable: string
  value: unknown
  onChange: (value: unknown) => void
  nullable?: boolean
}

export function ReferenceSelect({ referenceTable, value, onChange, nullable }: Props) {
  const { tenantId, selectedDb } = useTenant()
  const [options, setOptions] = useState<{ id: number; label: string }[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !selectedDb) return
    setLoading(true)

    const basePath = `/tenants/${tenantId}/databases/${selectedDb.id}/tables/${referenceTable}/rows`
    const url = search
      ? `${basePath}?limit=50`
      : `${basePath}?limit=100`

    api.get<{ rows: RowData[] }>(url)
      .then(res => {
        setOptions(res.rows.map(r => {
          // Use first text-like column as display label
          const label = Object.entries(r)
            .find(([k, v]) => k !== 'id' && typeof v === 'string')?.[1] as string
            || `#${r.id}`
          return { id: r.id as number, label }
        }))
      })
      .finally(() => setLoading(false))
  }, [tenantId, selectedDb, referenceTable])

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="w-full px-3 py-2 border border-gray-300 rounded-t-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="border border-t-0 border-gray-300 rounded-b-md max-h-40 overflow-y-auto bg-white">
        {nullable && (
          <button
            type="button"
            onClick={() => { onChange(null); setSearch('') }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${value === null ? 'bg-blue-50 text-blue-700' : 'text-gray-500 italic'}`}
          >
            — None —
          </button>
        )}
        {loading ? (
          <p className="px-3 py-2 text-sm text-gray-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-400">No results</p>
        ) : (
          filtered.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.id); setSearch('') }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${value === o.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
            >
              {o.label} <span className="text-gray-400 text-xs">#{o.id}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
