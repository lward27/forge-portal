import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { useToast } from './ToastProvider'
import { FieldInput } from './FieldInput'
import type { TableDef, ColumnDef } from '../types'

interface Props {
  table: string
}

export function FormWidget({ table }: Props) {
  const { tenantId, selectedDb } = useTenant()
  const { toast } = useToast()
  const [tableDef, setTableDef] = useState<TableDef | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tenantId || !selectedDb) return
    api.get<TableDef>(`/tenants/${tenantId}/databases/${selectedDb.id}/tables/${table}`)
      .then(tbl => {
        setTableDef(tbl)
        resetForm(tbl.columns)
      })
  }, [tenantId, selectedDb, table])

  function resetForm(columns: ColumnDef[]) {
    const initial: Record<string, unknown> = {}
    columns.filter(c => !c.primary_key).forEach(c => {
      if (c.type === 'boolean') initial[c.name] = c.default === 'true'
      else initial[c.name] = null
    })
    setFormData(initial)
    setError('')
  }

  async function handleSave() {
    if (!tenantId || !selectedDb || !tableDef) return
    setError('')
    try {
      await api.post(`/tenants/${tenantId}/databases/${selectedDb.id}/tables/${table}/rows`, formData)
      toast('Record created', 'success')
      resetForm(tableDef.columns)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed'
      setError(msg)
      toast(msg, 'error')
    }
  }

  if (!tableDef) return <div className="animate-pulse bg-gray-100 rounded h-full" />

  const writableCols = tableDef.columns.filter(c => !c.primary_key).slice(0, 6)

  return (
    <div className="overflow-auto h-full space-y-2 text-sm">
      {writableCols.map(col => (
        <div key={col.name} className="space-y-0.5">
          <FieldInput
            column={col}
            value={formData[col.name]}
            onChange={(val) => setFormData(prev => ({ ...prev, [col.name]: val }))}
          />
        </div>
      ))}
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button onClick={handleSave} className="w-full px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">
        Save
      </button>
    </div>
  )
}
