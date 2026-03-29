import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Table2, Plus, ChevronDown, ChevronRight, Bot, LayoutGrid } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import type { TableDef, Database } from '../types'

interface Props {
  onNewTable: () => void
}

export function TableSidebar({ onNewTable }: Props) {
  const { tenantId, databases, selectedDb, selectDb, refreshKey } = useTenant()
  const [tables, setTables] = useState<TableDef[]>([])
  const [collapsedApps, setCollapsedApps] = useState<Set<string>>(new Set())

  function toggleApp(app: string) {
    setCollapsedApps(prev => {
      const next = new Set(prev)
      if (next.has(app)) next.delete(app)
      else next.add(app)
      return next
    })
  }

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
    <aside className="fixed left-0 top-14 bottom-0 w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
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
        {(() => {
          // Group tables by app
          const apps: Record<string, TableDef[]> = {}
          const ungrouped: TableDef[] = []
          tables.forEach(t => {
            if (t.app_name) {
              (apps[t.app_name] = apps[t.app_name] || []).push(t)
            } else {
              ungrouped.push(t)
            }
          })
          const appNames = Object.keys(apps).sort()
          const hasApps = appNames.length > 0

          return (
            <>
              {appNames.map(app => (
                <div key={app}>
                  <button onClick={() => toggleApp(app)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider w-full hover:text-gray-600 dark:hover:text-gray-300">
                    {collapsedApps.has(app) ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    {app}
                  </button>
                  {!collapsedApps.has(app) && apps[app].map(t => (
                    <NavLink key={t.name} to={`/tables/${t.name}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 pl-6 py-1.5 rounded-md text-sm transition-colors ${
                          isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`
                      }>
                      <Table2 size={14} /> {t.name}
                    </NavLink>
                  ))}
                </div>
              ))}
              {ungrouped.length > 0 && (
                <div>
                  {hasApps && <p className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ungrouped</p>}
                  {!hasApps && <p className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tables</p>}
                  {ungrouped.map(t => (
                    <NavLink key={t.name} to={`/tables/${t.name}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`
                      }>
                      <Table2 size={14} /> {t.name}
                    </NavLink>
                  ))}
                </div>
              )}
              {tables.length === 0 && selectedDb && (
                <p className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">No tables yet</p>
              )}
            </>
          )
        })()}
      </nav>

      {selectedDb && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <button
            onClick={onNewTable}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            <Plus size={16} /> New Table
          </button>
        </div>
      )}

      <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
        <NavLink to="/templates" className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`
        }>
          <LayoutGrid size={16} /> Templates
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`
        }>
          <Bot size={16} /> AI Chat
        </NavLink>
      </div>
    </aside>
  )
}
