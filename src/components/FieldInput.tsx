import { ReferenceSelect } from './ReferenceSelect'
import type { ColumnDef } from '../types'

interface Props {
  column: ColumnDef
  value: unknown
  onChange: (value: unknown) => void
  error?: string
}

export function FieldInput({ column, value, onChange, error }: Props) {
  if (column.primary_key) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">{column.name}</label>
        <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">{String(value ?? 'Auto-generated')}</p>
      </div>
    )
  }

  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {column.name}
      {!column.nullable && <span className="text-red-500 ml-1">*</span>}
    </label>
  )

  let input
  switch (column.type) {
    case 'reference':
      input = column.reference_table ? (
        <ReferenceSelect
          referenceTable={column.reference_table}
          value={value}
          onChange={onChange}
          nullable={column.nullable}
        />
      ) : (
        <p className="text-sm text-gray-400">No reference table configured</p>
      )
      break
    case 'boolean':
      input = (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      )
      break
    case 'date':
      input = (
        <input
          type="date"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )
      break
    case 'timestamp':
      input = (
        <input
          type="datetime-local"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )
      break
    case 'integer':
    case 'biginteger':
      input = (
        <input
          type="number"
          step="1"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )
      break
    case 'decimal':
      input = (
        <input
          type="number"
          step="any"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )
      break
    case 'json':
      input = (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value ?? '', null, 2)}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )
      break
    default:
      input = (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )
  }

  return (
    <div>
      {label}
      {input}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
