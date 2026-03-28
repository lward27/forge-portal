import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Table2, Plus, ChevronDown } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import type { TableDef, Database } from '../types'

interface Props {
  onNewTable: () => void
}

export function TableSidebar({ onNewTable }: Props) {
  const { tenantId, databases, selectedDb, selectDb, refreshKey } = useTenant()
  const [tables, setTables] = useState<TableDef[]>([])

  useEffect(() => {
    if (tenantId && selectedDb) {
      api.get<{ tables: TableDef[] }>(`/tenants/${tenantId}/databases/${selectedDb.id}/tables`)
        .then(res => setTables(res.tables))
        .catch(() => setTables([]))
    } else {
      setTables([])
    }
  }, [tenantId, selectedDb, refreshKey])

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-gray-200 flex flex-col">
      {databases.length > 1 && (
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <select
              value={selectedDb?.id || ''}
              onChange={(e) => {
                const db = databases.find(d => d.id === e.target.value)
                if (db) selectDb(db)
              }}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {databases.map((db: Database) => (
                <option key={db.id} value={db.id}>{db.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Tables</p>
        {tables.map(t => (
          <NavLink
            key={t.name}
            to={`/tables/${t.name}`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <Table2 size={16} />
            {t.name}
          </NavLink>
        ))}
        {tables.length === 0 && selectedDb && (
          <p className="px-3 py-4 text-sm text-gray-400 text-center">No tables yet</p>
        )}
      </nav>

      {selectedDb && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={onNewTable}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            <Plus size={16} /> New Table
          </button>
        </div>
      )}
    </aside>
  )
}
