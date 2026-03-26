import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, SlidersHorizontal } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { useToast } from '../components/ToastProvider'
import { FieldInput } from '../components/FieldInput'
import { RelatedTable } from '../components/RelatedTable'
import { SlideOutPanel } from '../components/SlideOutPanel'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CardSkeleton } from '../components/Skeleton'
import { FormCustomizer } from '../components/FormCustomizer'
import { FormPicker } from '../components/FormPicker'
import type { TableDef, RowData, ColumnDef, FormDef } from '../types'

interface RelatedGroup {
  table: string
  column: string
  count: number
  rows: RowData[]
}

export function RecordDetailPage() {
  const { tableName, recordId } = useParams<{ tableName: string; recordId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tenantId, selectedDb } = useTenant()
  const { toast } = useToast()

  const [tableDef, setTableDef] = useState<TableDef | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [related, setRelated] = useState<RelatedGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  // Form config
  const [allForms, setAllForms] = useState<FormDef[]>([])
  const [formDef, setFormDef] = useState<FormDef | null>(null)
  const [showFormCustomizer, setShowFormCustomizer] = useState(false)
  const [deleteFormTarget, setDeleteFormTarget] = useState<FormDef | null>(null)

  // Add child slide-out
  const [addChildTable, setAddChildTable] = useState<{ table: string; column: string } | null>(null)
  const [childFormData, setChildFormData] = useState<Record<string, unknown>>({})
  const [childTableDef, setChildTableDef] = useState<TableDef | null>(null)

  const basePath = `/tenants/${tenantId}/databases/${selectedDb?.id}/tables/${tableName}`

  useEffect(() => {
    loadRecord()
  }, [tenantId, selectedDb, tableName, recordId])

  async function loadRecord() {
    if (!tenantId || !selectedDb || !tableName || !recordId) return
    setLoading(true)
    try {
      const [tbl, row, relRes, formsRes] = await Promise.all([
        api.get<TableDef>(basePath),
        api.get<RowData>(`${basePath}/rows/${recordId}`),
        api.get<{ related: RelatedGroup[] }>(`${basePath}/rows/${recordId}/related`),
        api.get<{ forms: FormDef[] }>(`${basePath}/forms`).catch(() => ({ forms: [] })),
      ])
      setTableDef(tbl)
      setAllForms(formsRes.forms)
      const formParam = searchParams.get('form')
      const selectedForm = formParam
        ? formsRes.forms.find(f => f.id === formParam)
        : formsRes.forms.find(f => f.is_default)
      if (selectedForm) setFormDef(selectedForm)

      const data: Record<string, unknown> = {}
      tbl.columns.filter(c => !c.primary_key).forEach(c => {
        data[c.name] = row[c.name] ?? null
      })
      setFormData(data)
      setRelated(relRes.related)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setFormError('')
    setSaving(true)
    try {
      await api.put(`${basePath}/rows/${recordId}`, formData)
      toast('Record saved', 'success')
      loadRecord()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      setFormError(msg)
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`${basePath}/rows/${recordId}`)
      toast('Record deleted', 'success')
      navigate(`/tables/${tableName}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  async function openAddChild(table: string, column: string) {
    if (!tenantId || !selectedDb) return
    const tbl = await api.get<TableDef>(`/tenants/${tenantId}/databases/${selectedDb.id}/tables/${table}`)
    setChildTableDef(tbl)

    const initial: Record<string, unknown> = {}
    tbl.columns.filter(c => !c.primary_key).forEach(c => {
      if (c.name === column) initial[c.name] = Number(recordId)
      else if (c.type === 'boolean') initial[c.name] = c.default === 'true'
      else initial[c.name] = null
    })
    setChildFormData(initial)
    setAddChildTable({ table, column })
  }

  async function handleSaveChild() {
    if (!addChildTable || !tenantId || !selectedDb) return
    try {
      await api.post(
        `/tenants/${tenantId}/databases/${selectedDb.id}/tables/${addChildTable.table}/rows`,
        childFormData,
      )
      toast('Record created', 'success')
      setAddChildTable(null)
      loadRecord()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create', 'error')
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto space-y-4"><CardSkeleton /><CardSkeleton /></div>
  if (!tableDef) return <div className="text-gray-500">Not found</div>

  // Apply form config: filter and order visible fields
  const formFields = formDef?.config?.sections?.[0]?.fields
  let writableCols = tableDef.columns.filter(c => !c.primary_key)
  if (formFields) {
    const visibleFields = new Set(formFields.filter(f => f.visible).map(f => f.field))
    const ordered = formFields.filter(f => f.visible).map(f => tableDef.columns.find(c => c.name === f.field)).filter(Boolean) as ColumnDef[]
    const inConfig = new Set(formFields.map(f => f.field))
    const extra = tableDef.columns.filter(c => !c.primary_key && !inConfig.has(c.name))
    writableCols = [...ordered, ...extra]
  }

  // Apply form config: filter visible related tables
  const formRelated = formDef?.config?.related_tables
  const visibleRelated = formRelated
    ? related.filter(r => {
        const cfg = formRelated.find(fr => fr.table === r.table && fr.reference_column === r.column)
        return !cfg || cfg.visible
      })
    : related
  const childWritableCols = childTableDef?.columns.filter((c: ColumnDef) => !c.primary_key) || []

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate(`/tables/${tableName}`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={16} /> Back to {tableName}
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Record #{recordId}</h1>
            <FormPicker
              forms={allForms}
              selected={formDef}
              onSelect={(f) => {
                setFormDef(f)
                setSearchParams(f.is_default ? {} : { form: f.id })
              }}
              onDelete={(f) => setDeleteFormTarget(f)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {formDef && (
            <button onClick={() => setShowFormCustomizer(true)} className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" title="Customize Form">
              <SlidersHorizontal size={16} />
            </button>
          )}
          <button onClick={() => setShowDelete(true)} className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50">
            <Trash2 size={16} /> Delete
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">id</label>
            <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">{recordId}</p>
          </div>
          {writableCols.map(col => (
            <FieldInput
              key={col.name}
              column={col}
              value={formData[col.name]}
              onChange={(val) => setFormData(prev => ({ ...prev, [col.name]: val }))}
            />
          ))}
          {formError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">{formError}</p>}
        </div>
      </div>

      {/* Related records */}
      {visibleRelated.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Related Records</h2>
          {visibleRelated.map(group => (
            <RelatedTable
              key={`${group.table}-${group.column}`}
              tableName={group.table}
              column={group.column}
              count={group.count}
              rows={group.rows}
              onAdd={() => openAddChild(group.table, group.column)}
            />
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog open={showDelete} title="Delete Record"
        message={`Delete record #${recordId}? This cannot be undone.`}
        confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />

      {/* Add child slide-out */}
      <SlideOutPanel
        open={!!addChildTable}
        onClose={() => setAddChildTable(null)}
        title={addChildTable ? `New ${addChildTable.table} record` : ''}
      >
        <div className="space-y-4">
          {childWritableCols.map((col: ColumnDef) => (
            <FieldInput
              key={col.name}
              column={col}
              value={childFormData[col.name]}
              onChange={(val) => setChildFormData(prev => ({ ...prev, [col.name]: val }))}
            />
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button onClick={() => setAddChildTable(null)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
          <button onClick={handleSaveChild} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
        </div>
      </SlideOutPanel>

      {/* Form Customizer */}
      {formDef && (
        <FormCustomizer
          open={showFormCustomizer}
          onClose={() => setShowFormCustomizer(false)}
          config={formDef.config}
          onSave={async (newConfig) => {
            try {
              await api.put(`${basePath}/forms/${formDef.id}`, { config: newConfig })
              toast('Form saved', 'success')
              loadRecord()
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Failed to save form', 'error')
            }
          }}
          onSaveAsNew={async (name, newConfig) => {
            try {
              const res = await api.post<FormDef>(`${basePath}/forms`, { name, config: newConfig })
              toast(`Form "${name}" created`, 'success')
              setSearchParams({ form: res.id })
              loadRecord()
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Failed to create form', 'error')
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteFormTarget}
        title="Delete Form"
        message={`Delete form "${deleteFormTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteFormTarget) return
          try {
            await api.delete(`${basePath}/forms/${deleteFormTarget.id}`)
            toast('Form deleted', 'success')
            setDeleteFormTarget(null)
            if (formDef?.id === deleteFormTarget.id) setSearchParams({})
            loadRecord()
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Failed to delete', 'error')
          }
        }}
        onCancel={() => setDeleteFormTarget(null)}
      />
    </div>
  )
}
