import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { TypeBadge } from '../components/TypeBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { TableDef, ColumnDef } from '../types'
import { FIELD_TYPES, TYPE_LABELS } from '../types'

export function SchemaBuilderPage() {
  const { tableName } = useParams<{ tableName: string }>()
  const navigate = useNavigate()
  const { tenantId, selectedDb } = useTenant()

  const [tableDef, setTableDef] = useState<TableDef | null>(null)
  const [loading, setLoading] = useState(true)

  const [allTables, setAllTables] = useState<TableDef[]>([])

  // Add field form
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState('text')
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [newFieldUnique, setNewFieldUnique] = useState(false)
  const [newFieldRefTable, setNewFieldRefTable] = useState('')
  const [addError, setAddError] = useState('')

  // Delete field
  const [deleteField, setDeleteField] = useState<ColumnDef | null>(null)

  // Delete table
  const [showDeleteTable, setShowDeleteTable] = useState(false)

  const basePath = `/tenants/${tenantId}/databases/${selectedDb?.id}/tables/${tableName}`

  useEffect(() => {
    loadTable()
  }, [tenantId, selectedDb, tableName])

  async function loadTable() {
    if (!tenantId || !selectedDb || !tableName) return
    setLoading(true)
    try {
      const [tbl, tablesRes] = await Promise.all([
        api.get<TableDef>(basePath),
        api.get<{ tables: TableDef[] }>(`/tenants/${tenantId}/databases/${selectedDb.id}/tables`),
      ])
      setTableDef(tbl)
      setAllTables(tablesRes.tables)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddField(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    try {
      const col: Record<string, unknown> = {
        name: newFieldName,
        type: newFieldType,
        nullable: !newFieldRequired,
        unique: newFieldUnique,
      }
      if (newFieldType === 'reference') {
        col.reference_table = newFieldRefTable
      }
      await api.put<TableDef>(basePath, { add_columns: [col] })
      setNewFieldName('')
      setNewFieldType('text')
      setNewFieldRequired(false)
      setNewFieldUnique(false)
      setNewFieldRefTable('')
      loadTable()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleDeleteField() {
    if (!deleteField) return
    try {
      await api.put<TableDef>(basePath, { drop_columns: [deleteField.name] })
      setDeleteField(null)
      loadTable()
    } catch {
      // handled
    }
  }

  async function handleDeleteTable() {
    await api.delete(basePath)
    navigate('/')
  }

  if (loading) return <div className="text-gray-500">Loading...</div>
  if (!tableDef) return <div className="text-gray-500">Table not found</div>

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate(`/tables/${tableName}`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} /> Back to {tableName}
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-6">Table Settings — {tableName}</h1>

      {/* Fields list */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Fields</h2>
        <div className="bg-white rounded-lg border border-gray-200 divide-y">
          {tableDef.columns.map(col => (
            <div key={col.name} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900 text-sm">{col.name}</span>
                <TypeBadge type={col.type} />
                {col.reference_table && <span className="text-xs text-indigo-600">→ {col.reference_table}</span>}
                {!col.nullable && <span className="text-xs text-orange-600">Required</span>}
                {col.unique && <span className="text-xs text-purple-600">Unique</span>}
              </div>
              {!col.primary_key && (
                <button onClick={() => setDeleteField(col)} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add field form */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Add Field</h2>
        <form onSubmit={handleAddField} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={newFieldName} onChange={(e) => setNewFieldName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="field_name" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {FIELD_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                ))}
              </select>
            </div>
          </div>
          {newFieldType === 'reference' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">References Table</label>
              <select value={newFieldRefTable} onChange={(e) => {
                setNewFieldRefTable(e.target.value)
                if (!newFieldName && e.target.value) setNewFieldName(`${e.target.value}_id`)
              }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select a table...</option>
                {allTables.filter(t => t.name !== tableName).map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {newFieldType !== 'reference' && (
            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} className="rounded" />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={newFieldUnique} onChange={(e) => setNewFieldUnique(e.target.checked)} className="rounded" />
                Unique
              </label>
            </div>
          )}
          {addError && <p className="text-red-600 text-sm mb-3">{addError}</p>}
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            <Plus size={16} /> Add Field
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <h2 className="text-sm font-medium text-red-800 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-600 mb-3">Deleting this table will permanently remove all data.</p>
        <button onClick={() => setShowDeleteTable(true)} className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">
          Delete Table
        </button>
      </div>

      <ConfirmDialog open={!!deleteField} title="Remove Field"
        message={`Remove "${deleteField?.name}"? Existing data in this field will be lost.`}
        confirmLabel="Remove" destructive onConfirm={handleDeleteField} onCancel={() => setDeleteField(null)} />

      <ConfirmDialog open={showDeleteTable} title="Delete Table"
        message={`Delete "${tableName}"? This will permanently remove the table and ALL its data.`}
        confirmLabel="Delete Table" destructive onConfirm={handleDeleteTable} onCancel={() => setShowDeleteTable(false)} />
    </div>
  )
}
