import { useEffect, useState } from 'react'
import { Plus, Pencil, Check, ChevronDown, Trash2, LayoutDashboard } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { useToast } from '../components/ToastProvider'
import { DashboardWidgetWrapper } from '../components/DashboardWidget'
import { ViewWidget } from '../components/ViewWidget'
import { FormWidget } from '../components/FormWidget'
import { StatWidget } from '../components/StatWidget'
import { AddWidgetDialog } from '../components/AddWidgetDialog'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { DashboardDef, DashboardWidget, DashboardConfig } from '../types'

export function DashboardPage() {
  const { tenantId, selectedDb } = useTenant()
  const { toast } = useToast()

  const [dashboards, setDashboards] = useState<DashboardDef[]>([])
  const [current, setCurrent] = useState<DashboardDef | null>(null)
  const [editing, setEditing] = useState(false)
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [showCreateDash, setShowCreateDash] = useState(false)
  const [newDashName, setNewDashName] = useState('')
  const [deleteDash, setDeleteDash] = useState<DashboardDef | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const basePath = `/tenants/${tenantId}/databases/${selectedDb?.id}/dashboards`

  useEffect(() => { loadDashboards() }, [tenantId, selectedDb])

  async function loadDashboards() {
    if (!tenantId || !selectedDb) return
    setLoading(true)
    try {
      const res = await api.get<{ dashboards: DashboardDef[] }>(basePath)
      setDashboards(res.dashboards)
      const def = res.dashboards.find(d => d.is_default) || res.dashboards[0]
      if (def) setCurrent(def)
      else setCurrent(null)
    } finally {
      setLoading(false)
    }
  }

  async function saveDashboard(config: DashboardConfig) {
    if (!current) return
    try {
      const res = await api.put<DashboardDef>(`${basePath}/${current.id}`, { config })
      setCurrent(res)
      toast('Dashboard saved', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error')
    }
  }

  function addWidget(partial: Omit<DashboardWidget, 'id' | 'x' | 'y'>) {
    if (!current) return
    const widgets = current.config.widgets || []

    // Find next available y position
    const maxY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0)

    const widget: DashboardWidget = {
      ...partial,
      id: `w${Date.now()}`,
      x: 0,
      y: maxY,
    }

    const newConfig = { ...current.config, widgets: [...widgets, widget] }
    setCurrent({ ...current, config: newConfig })
    saveDashboard(newConfig)
  }

  function removeWidget(widgetId: string) {
    if (!current) return
    const newConfig = {
      ...current.config,
      widgets: current.config.widgets.filter(w => w.id !== widgetId),
    }
    setCurrent({ ...current, config: newConfig })
    saveDashboard(newConfig)
  }

  function exitEditMode() {
    setEditing(false)
    if (current) saveDashboard(current.config)
  }

  async function handleCreateDash() {
    if (!newDashName.trim()) return
    try {
      const res = await api.post<DashboardDef>(basePath, {
        name: newDashName.trim(),
        is_default: dashboards.length === 0,
        config: { widgets: [], grid_cols: 12 },
      })
      setShowCreateDash(false)
      setNewDashName('')
      toast(`Dashboard "${res.name}" created`, 'success')
      await loadDashboards()
      setCurrent(res)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  async function handleDeleteDash() {
    if (!deleteDash) return
    try {
      await api.delete(`${basePath}/${deleteDash.id}`)
      toast('Dashboard deleted', 'success')
      setDeleteDash(null)
      await loadDashboards()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  if (loading) return <div className="animate-pulse bg-gray-100 rounded h-64" />

  if (!current) {
    return (
      <>
        <EmptyState
          icon={<LayoutDashboard size={48} />}
          title="No dashboards yet"
          description="Create a dashboard to build your custom workspace with views, forms, and stats."
          action={
            <button onClick={() => setShowCreateDash(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
              Create Dashboard
            </button>
          }
        />
        <Modal title="New Dashboard" open={showCreateDash} onClose={() => setShowCreateDash(false)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard Name</label>
            <input value={newDashName} onChange={(e) => setNewDashName(e.target.value)} placeholder="Sales Overview"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" autoFocus />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowCreateDash(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">Cancel</button>
            <button onClick={handleCreateDash} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Create</button>
          </div>
        </Modal>
      </>
    )
  }

  const widgets = current.config.widgets || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Dashboard picker */}
          <div className="relative">
            <button onClick={() => setPickerOpen(!pickerOpen)}
              className="flex items-center gap-1 text-lg font-bold text-gray-900 hover:text-blue-600">
              {current.name} <ChevronDown size={16} />
            </button>
            {pickerOpen && (
              <div className="absolute z-10 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg">
                {dashboards.map(d => (
                  <div key={d.id}
                    className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${d.id === current.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                    <span onClick={() => { setCurrent(d); setPickerOpen(false) }} className="flex-1">{d.name}</span>
                    {dashboards.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteDash(d); setPickerOpen(false) }} className="text-gray-400 hover:text-red-600 ml-2">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="border-t border-gray-200 px-3 py-2">
                  <button onClick={() => { setShowCreateDash(true); setPickerOpen(false) }} className="text-sm text-blue-600 hover:text-blue-700">+ New Dashboard</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <button onClick={exitEditMode} className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700">
              <Check size={16} /> Done
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <Pencil size={16} /> Edit
            </button>
          )}
          <button onClick={() => setShowAddWidget(true)} className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <Plus size={16} /> Widget
          </button>
        </div>
      </div>

      {/* Grid */}
      {widgets.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="mb-2">Empty dashboard</p>
          <button onClick={() => setShowAddWidget(true)} className="text-sm text-blue-600 hover:text-blue-700">+ Add your first widget</button>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: '80px' }}>
          {widgets.map(widget => (
            <DashboardWidgetWrapper
              key={widget.id}
              widget={widget}
              editing={editing}
              onRemove={() => removeWidget(widget.id)}
              onDragStart={() => {}}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {}}
            >
              {widget.type === 'view' && <ViewWidget table={widget.table} viewId={widget.view_id} />}
              {widget.type === 'form' && <FormWidget table={widget.table} />}
              {widget.type === 'stat' && <StatWidget table={widget.table} />}
            </DashboardWidgetWrapper>
          ))}
        </div>
      )}

      <AddWidgetDialog open={showAddWidget} onClose={() => setShowAddWidget(false)} onAdd={addWidget} />

      <Modal title="New Dashboard" open={showCreateDash} onClose={() => setShowCreateDash(false)}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard Name</label>
          <input value={newDashName} onChange={(e) => setNewDashName(e.target.value)} placeholder="Sales Overview"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" autoFocus />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setShowCreateDash(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">Cancel</button>
          <button onClick={handleCreateDash} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Create</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteDash} title="Delete Dashboard"
        message={`Delete "${deleteDash?.name}"? This cannot be undone.`}
        confirmLabel="Delete" destructive onConfirm={handleDeleteDash} onCancel={() => setDeleteDash(null)} />
    </div>
  )
}
