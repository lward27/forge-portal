import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { Modal } from './Modal'
import type { TableDef, ViewDef, DashboardWidget } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (widget: Omit<DashboardWidget, 'id' | 'x' | 'y'>) => void
}

export function AddWidgetDialog({ open, onClose, onAdd }: Props) {
  const { tenantId, selectedDb } = useTenant()
  const [tables, setTables] = useState<TableDef[]>([])
  const [views, setViews] = useState<ViewDef[]>([])

  const [widgetType, setWidgetType] = useState<'view' | 'form' | 'stat'>('view')
  const [table, setTable] = useState('')
  const [viewId, setViewId] = useState<string>('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!open || !tenantId || !selectedDb) return
    api.get<{ tables: TableDef[] }>(`/tenants/${tenantId}/databases/${selectedDb.id}/tables`)
      .then(res => {
        setTables(res.tables)
        if (res.tables.length > 0 && !table) setTable(res.tables[0].name)
      })
  }, [open, tenantId, selectedDb])

  useEffect(() => {
    if (!table || !tenantId || !selectedDb) { setViews([]); return }
    api.get<{ views: ViewDef[] }>(`/tenants/${tenantId}/databases/${selectedDb.id}/tables/${table}/views`)
      .then(res => setViews(res.views))
      .catch(() => setViews([]))
  }, [table, tenantId, selectedDb])

  function handleAdd() {
    const w = widgetType === 'stat' ? 2 : widgetType === 'form' ? 4 : 6
    const h = widgetType === 'stat' ? 2 : widgetType === 'form' ? 4 : 4
    onAdd({
      type: widgetType,
      title: title || `${table} ${widgetType}`,
      table,
      view_id: widgetType === 'view' && viewId ? viewId : null,
      w, h,
    })
    setTitle('')
    setViewId('')
    onClose()
  }

  return (
    <Modal title="Add Widget" open={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Widget Type</label>
          <div className="flex gap-2">
            {(['view', 'form', 'stat'] as const).map(t => (
              <button key={t} onClick={() => setWidgetType(t)}
                className={`px-4 py-2 text-sm rounded-md border ${widgetType === t ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {t === 'view' ? 'Table View' : t === 'form' ? 'Quick Add Form' : 'Stat Counter'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
          <select value={table} onChange={(e) => setTable(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
        </div>

        {widgetType === 'view' && views.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select value={viewId} onChange={(e) => setViewId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">Default View</option>
              {views.filter(v => !v.is_default).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={`${table} ${widgetType}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">Cancel</button>
        <button onClick={handleAdd} disabled={!table} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">Add Widget</button>
      </div>
    </Modal>
  )
}
