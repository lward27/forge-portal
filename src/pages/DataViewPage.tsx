import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowUpDown, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { SlideOutPanel } from '../components/SlideOutPanel'
import { FieldInput } from '../components/FieldInput'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { TableDef, RowData, RowListResponse, ColumnDef } from '../types'

const PAGE_SIZE = 25

export function DataViewPage() {
  const { tableName } = useParams<{ tableName: string }>()
  const navigate = useNavigate()
  const { tenantId, selectedDb } = useTenant()

  const [tableDef, setTableDef] = useState<TableDef | null>(null)
  const [rows, setRows] = useState<RowData[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDesc, setSortDesc] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Slide-out
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<RowData | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<RowData | null>(null)

  const basePath = `/tenants/${tenantId}/databases/${selectedDb?.id}/tables/${tableName}`

  const loadData = useCallback(async () => {
    if (!tenantId || !selectedDb || !tableName) return
    setLoading(true)
    try {
      const tbl = await api.get<TableDef>(`${basePath}`)
      setTableDef(tbl)

      let url = `${basePath}/rows?limit=${PAGE_SIZE}&offset=${offset}`
      if (sortCol) url += `&sort=${sortDesc ? '-' : ''}${sortCol}`
      if (search) {
        const textCols = tbl.columns.filter(c => c.type === 'text' && !c.primary_key)
        if (textCols.length > 0) {
          url += `&filter=${textCols[0].name}:like:${encodeURIComponent('%' + search + '%')}`
        }
      }

      const res = await api.get<RowListResponse>(url)
      setRows(res.rows)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [tenantId, selectedDb, tableName, offset, sortCol, sortDesc, search, basePath])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { setOffset(0) }, [tableName, search])

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
      } else {
        await api.post(`${basePath}/rows`, formData)
      }
      setPanelOpen(false)
      loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await api.delete(`${basePath}/rows/${deleteTarget.id}`)
    setDeleteTarget(null)
    setPanelOpen(false)
    loadData()
  }

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDesc(!sortDesc)
    } else {
      setSortCol(col)
      setSortDesc(false)
    }
  }

  function formatCell(value: unknown, col: ColumnDef): string {
    if (value === null || value === undefined) return ''
    if (col.type === 'boolean') return value ? 'Yes' : 'No'
    if (col.type === 'decimal') return Number(value).toFixed(2)
    return String(value)
  }

  if (loading && !tableDef) return <div className="text-gray-500">Loading...</div>
  if (!tableDef) return <div className="text-gray-500">Table not found</div>

  const columns = tableDef.columns

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{tableName}</h1>
          <button onClick={() => navigate(`/tables/${tableName}/settings`)} className="text-gray-400 hover:text-gray-600" title="Table settings">
            <Settings size={18} />
          </button>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
          <Plus size={16} /> Add Record
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          {search ? 'No matching records found.' : "No records yet. Click 'Add Record' to create your first one."}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
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
                <tr key={i} onClick={() => openEdit(row)} className="cursor-pointer hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col.name} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate">
                      {formatCell(row[col.name], col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
              className="px-3 py-1 border rounded-md disabled:opacity-30 hover:bg-gray-100">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
              className="px-3 py-1 border rounded-md disabled:opacity-30 hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
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
            <FieldInput
              key={col.name}
              column={col}
              value={formData[col.name]}
              onChange={(val) => setFormData(prev => ({ ...prev, [col.name]: val }))}
            />
          ))}
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
        </div>
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
    </div>
  )
}
