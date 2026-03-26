import { useEffect, useState, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tenantId || !selectedDb) return
    setLoading(true)

    const basePath = `/tenants/${tenantId}/databases/${selectedDb.id}/tables/${referenceTable}/rows`
    api.get<{ rows: RowData[] }>(`${basePath}?limit=100`)
      .then(res => {
        setOptions(res.rows.map(r => {
          const label = Object.entries(r)
            .find(([k, v]) => k !== 'id' && typeof v === 'string' && !k.endsWith('__display'))?.[1] as string
            || `#${r.id}`
          return { id: r.id as number, label }
        }))
      })
      .finally(() => setLoading(false))
  }, [tenantId, selectedDb, referenceTable])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selectedLabel = options.find(o => o.id === value)?.label

  return (
    <div ref={ref} className="relative">
      {/* Collapsed display */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel || (value ? `#${value}` : 'Select...')}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 border-b border-gray-200 text-sm focus:outline-none"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto">
            {nullable && (
              <button
                type="button"
                onClick={() => { onChange(null); setSearch(''); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-gray-500 italic"
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
                  onClick={() => { onChange(o.id); setSearch(''); setOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${value === o.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                >
                  {o.label} <span className="text-gray-400 text-xs">#{o.id}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
