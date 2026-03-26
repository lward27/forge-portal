import { TYPE_LABELS } from '../types'

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-100 text-blue-800',
  integer: 'bg-green-100 text-green-800',
  biginteger: 'bg-green-100 text-green-800',
  decimal: 'bg-yellow-100 text-yellow-800',
  boolean: 'bg-purple-100 text-purple-800',
  date: 'bg-orange-100 text-orange-800',
  timestamp: 'bg-orange-100 text-orange-800',
  json: 'bg-gray-100 text-gray-800',
  serial: 'bg-gray-100 text-gray-600',
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[type] || 'bg-gray-100 text-gray-600'}`}>
      {TYPE_LABELS[type] || type}
    </span>
  )
}
