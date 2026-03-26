import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ArrowUpDown, Settings, ChevronLeft, ChevronRight, Download, X, SlidersHorizontal } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { useToast } from '../components/ToastProvider'
import { SlideOutPanel } from '../components/SlideOutPanel'
import { FieldInput } from '../components/FieldInput'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { RelatedRecords } from '../components/RelatedRecords'
import { BulkActionBar } from '../components/BulkActionBar'
import { TableSkeleton } from '../components/Skeleton'
import { ViewCustomizer } from '../components/ViewCustomizer'
import { ViewPicker } from '../components/ViewPicker'
import { ConfirmDialog as ViewDeleteConfirm } from '../components/ConfirmDialog'
import { generateCsv, downloadCsv } from '../utils/csv'
import type { TableDef, RowData, RowListResponse, ColumnDef, ViewDef, ViewConfig } from '../types'

const DEFAULT_PAGE_SIZE = 25

export function DataViewPage() {
  const { tableName } = useParams<{ tableName: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tenantId, selectedDb } = useTenant()
  const { toast } = useToast()

  const [tableDef, setTableDef] = useState<TableDef | null>(null)
  const [rows, setRows] = useState<RowData[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDesc, setSortDesc] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // View config
  const [allViews, setAllViews] = useState<ViewDef[]>([])
  const [viewDef, setViewDef] = useState<ViewDef | null>(null)
  const [showViewCustomizer, setShowViewCustomizer] = useState(false)
  const [deleteViewTarget, setDeleteViewTarget] = useState<ViewDef | null>(null)

  // Bulk select
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)

  // Slide-out
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<RowData | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<RowData | null>(null)

  const basePath = `/tenants/${tenantId}/databases/${selectedDb?.id}/tables/${tableName}`
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceTimer.current)
  }, [search])

  const pageSize = viewDef?.config?.page_size || DEFAULT_PAGE_SIZE

  const loadData = useCallback(async () => {
    if (!tenantId || !selectedDb || !tableName) return
    setLoading(true)
    try {
      const [tbl, viewsRes] = await Promise.all([
        api.get<TableDef>(`${basePath}`),
        api.get<{ views: ViewDef[] }>(`${basePath}/views`).catch(() => ({ views: [] })),
      ])
      setTableDef(tbl)
      setAllViews(viewsRes.views)

      // Select view from URL param or default
      const viewParam = searchParams.get('view')
      const selectedView = viewParam
        ? viewsRes.views.find(v => v.id === viewParam)
        : viewsRes.views.find(v => v.is_default)
      if (selectedView) setViewDef(selectedView)

      const ps = selectedView?.config?.page_size || DEFAULT_PAGE_SIZE
      let url = `${basePath}/rows?limit=${ps}&offset=${offset}`
      if (sortCol) url += `&sort=${sortDesc ? '-' : ''}${sortCol}`

      if (debouncedSearch) {
        const textCols = tbl.columns.filter(c => c.type === 'text' && !c.primary_key)
        if (textCols.length > 0) {
          url += `&filter=${textCols[0].name}:like:${encodeURIComponent('%' + debouncedSearch + '%')}`
        }
      }

      const res = await api.get<RowListResponse>(url)
      setRows(res.rows)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [tenantId, selectedDb, tableName, offset, sortCol, sortDesc, debouncedSearch, basePath])

  useEffect(() => { loadData() }, [loadData])

  // Reset all state when switching tables
  useEffect(() => {
    setOffset(0)
    setSelected(new Set())
    setViewDef(null)
    setSortCol(null)
    setSortDesc(false)
    setSearch('')
    setDebouncedSearch('')
  }, [tableName])

  // Apply view's default sort once loaded (only if user hasn't manually sorted)
  useEffect(() => {
    if (viewDef && !sortCol) {
      const ds = viewDef.config?.default_sort
      if (ds) {
        setSortCol(ds.field)
        setSortDesc(ds.direction === 'desc')
      }
    }
  }, [viewDef?.id]) // only when a new view loads

  useEffect(() => { setOffset(0) }, [debouncedSearch])

  const writableCols = tableDef?.columns.filter(c => !c.primary_key) || []

  function openNew() {
    setEditingRow(null)
    const initial: Record<string, unknown> = {}
    writableCols.forEach(c => {
      if (c.type === 'boolean') initial[c.name] = c.default === 'true'
      else initial[c.name] = null
    })
    setFormData(initial)
    setFormError('')
    setPanelOpen(true)
  }

  function openEdit(row: RowData) {
    setEditingRow(row)
    const data: Record<string, unknown> = {}
    writableCols.forEach(c => { data[c.name] = row[c.name] ?? null })
    setFormData(data)
    setFormError('')
    setPanelOpen(true)
  }

  async function handleSave() {
    setFormError('')
    try {
      if (editingRow) {
        await api.put(`${basePath}/rows/${editingRow.id}`, formData)
        toast('Record updated', 'success')
      } else {
        await api.post(`${basePath}/rows`, formData)
        toast('Record created', 'success')
      }
      setPanelOpen(false)
      loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      setFormError(msg)
      toast(msg, 'error')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`${basePath}/rows/${deleteTarget.id}`)
      toast('Record deleted', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
    setDeleteTarget(null)
    setPanelOpen(false)
    loadData()
  }

  async function handleBulkDelete() {
    try {
      const ids = Array.from(selected)
      const res = await api.post<{ deleted: number }>(`${basePath}/rows/bulk-delete`, { ids })
      toast(`${res.deleted} record${res.deleted > 1 ? 's' : ''} deleted`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
    setSelected(new Set())
    setShowBulkDelete(false)
    loadData()
  }

  async function handleExport() {
    try {
      let url = `${basePath}/rows?limit=10000`
      if (sortCol) url += `&sort=${sortDesc ? '-' : ''}${sortCol}`
      const res = await api.get<RowListResponse>(url)
      const colNames = tableDef?.columns.map(c => c.name) || []
      const csv = generateCsv(colNames, res.rows)
      downloadCsv(`${tableName}.csv`, csv)
      toast(`Exported ${res.rows.length} records`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error')
    }
  }

  function handleSort(col: string) {
    if (sortCol === col) setSortDesc(!sortDesc)
    else { setSortCol(col); setSortDesc(false) }
  }

  function toggleSelect(id: number) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleSelectAll() {
    if (selected.size === rows.length) setSelected(new Set())
    else setSelected(new Set(rows.map(r => r.id as number)))
  }

  function formatCell(row: RowData, col: ColumnDef): string {
    // For reference columns, show the __display value if available
    if (col.type === 'reference') {
      const display = row[`${col.name}__display`]
      if (display != null) return String(display)
      const val = row[col.name]
      return val != null ? `#${val}` : ''
    }
    const value = row[col.name]
    if (value === null || value === undefined) return ''
    if (col.type === 'boolean') return value ? 'Yes' : 'No'
    if (col.type === 'decimal') return Number(value).toFixed(2)
    return String(value)
  }

  if (loading && !tableDef) return <div className="p-4"><TableSkeleton /></div>
  if (!tableDef) return <div className="text-gray-500">Table not found</div>

  // Apply view config: filter visible columns and respect order
  const viewColOrder = viewDef?.config?.columns
  let columns = tableDef.columns
  if (viewColOrder) {
    const visibleFields = new Set(viewColOrder.filter(c => c.visible).map(c => c.field))
    const ordered = viewColOrder.filter(c => c.visible).map(c => tableDef.columns.find(tc => tc.name === c.field)).filter(Boolean) as ColumnDef[]
    // Add any columns not in the view config (newly added)
    const inConfig = new Set(viewColOrder.map(c => c.field))
    const extra = tableDef.columns.filter(c => !inConfig.has(c.name))
    columns = [...ordered, ...extra]
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{tableName}</h1>
          <ViewPicker
            views={allViews}
            selected={viewDef}
            onSelect={(v) => {
              setViewDef(v)
              setSearchParams(v.is_default ? {} : { view: v.id })
            }}
            onDelete={(v) => setDeleteViewTarget(v)}
          />
          <button onClick={() => navigate(`/tables/${tableName}/settings`)} className="text-gray-400 hover:text-gray-600" title="Table settings">
            <Settings size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {viewDef && (
            <button onClick={() => setShowViewCustomizer(true)} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" title="Customize View">
              <SlidersHorizontal size={16} />
            </button>
          )}
          <button onClick={handleExport} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <Download size={16} /> Export
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative inline-block">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
        {search !== debouncedSearch && <span className="ml-2 text-xs text-gray-400">Searching...</span>}
      </div>

      {/* Bulk action bar */}
      <BulkActionBar count={selected.size} onDelete={() => setShowBulkDelete(true)} onClear={() => setSelected(new Set())} />

      {/* Table */}
      {loading ? <TableSkeleton cols={columns.length} /> : rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          {debouncedSearch ? 'No matching records found.' : "No records yet. Click 'Add Record' to create your first one."}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                {columns.map(col => (
                  <th key={col.name} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort(col.name)}>
                    <span className="flex items-center gap-1">
                      {col.name}
                      {sortCol === col.name && <ArrowUpDown size={12} className="text-blue-500" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${selected.has(row.id as number) ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.has(row.id as number)} onChange={() => toggleSelect(row.id as number)} className="rounded" />
                  </td>
                  {columns.map(col => (
                    <td key={col.name} onClick={() => navigate(`/tables/${tableName}/records/${row.id}`)} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate cursor-pointer">
                      {formatCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Showing {offset + 1}–{Math.min(offset + pageSize, total)} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setOffset(Math.max(0, offset - pageSize))} disabled={offset === 0}
              className="px-3 py-1 border rounded-md disabled:opacity-30 hover:bg-gray-100"><ChevronLeft size={16} /></button>
            <button onClick={() => setOffset(offset + pageSize)} disabled={offset + pageSize >= total}
              className="px-3 py-1 border rounded-md disabled:opacity-30 hover:bg-gray-100"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Slide-out panel */}
      <SlideOutPanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editingRow ? `Record #${editingRow.id}` : 'New Record'}>
        <div className="space-y-4">
          {editingRow && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">id</label>
              <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">{String(editingRow.id)}</p>
            </div>
          )}
          {writableCols.map(col => (
            <FieldInput key={col.name} column={col} value={formData[col.name]}
              onChange={(val) => setFormData(prev => ({ ...prev, [col.name]: val }))} />
          ))}
          {formError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">{formError}</p>}
        </div>
        {editingRow && tableName && (
          <RelatedRecords tableName={tableName} rowId={editingRow.id as number} />
        )}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          {editingRow ? (
            <button onClick={() => setDeleteTarget(editingRow)} className="text-sm text-red-600 hover:text-red-700">Delete</button>
          ) : <div />}
          <div className="flex gap-3">
            <button onClick={() => setPanelOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
          </div>
        </div>
      </SlideOutPanel>

      <ConfirmDialog open={!!deleteTarget} title="Delete Record" message={`Delete record #${deleteTarget?.id}? This cannot be undone.`}
        confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      <ConfirmDialog open={showBulkDelete} title="Delete Records"
        message={`Delete ${selected.size} selected record${selected.size > 1 ? 's' : ''}? This cannot be undone.`}
        confirmLabel={`Delete ${selected.size}`} destructive onConfirm={handleBulkDelete} onCancel={() => setShowBulkDelete(false)} />

      {/* View Customizer */}
      {viewDef && (
        <ViewCustomizer
          open={showViewCustomizer}
          onClose={() => setShowViewCustomizer(false)}
          config={viewDef.config}
          onSave={async (newConfig) => {
            try {
              await api.put(`${basePath}/views/${viewDef.id}`, { config: newConfig })
              toast('View saved', 'success')
              loadData()
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Failed to save view', 'error')
            }
          }}
          onSaveAsNew={async (name, newConfig) => {
            try {
              const res = await api.post<ViewDef>(`${basePath}/views`, { name, config: newConfig })
              toast(`View "${name}" created`, 'success')
              setSearchParams({ view: res.id })
              loadData()
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Failed to create view', 'error')
            }
          }}
        />
      )}

      <ViewDeleteConfirm
        open={!!deleteViewTarget}
        title="Delete View"
        message={`Delete view "${deleteViewTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteViewTarget) return
          try {
            await api.delete(`${basePath}/views/${deleteViewTarget.id}`)
            toast('View deleted', 'success')
            setDeleteViewTarget(null)
            if (viewDef?.id === deleteViewTarget.id) {
              setSearchParams({})
            }
            loadData()
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Failed to delete', 'error')
          }
        }}
        onCancel={() => setDeleteViewTarget(null)}
      />
    </div>
  )
}
