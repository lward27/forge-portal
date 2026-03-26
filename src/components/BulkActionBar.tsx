import { Trash2, X } from 'lucide-react'

interface Props {
  count: number
  onDelete: () => void
  onClear: () => void
}

export function BulkActionBar({ count, onDelete, onClear }: Props) {
  if (count === 0) return null

  return (
    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-between mb-4">
      <span className="text-sm font-medium">{count} record{count > 1 ? 's' : ''} selected</span>
      <div className="flex items-center gap-3">
        <button onClick={onDelete} className="flex items-center gap-1 text-sm px-3 py-1 bg-red-500 rounded-md hover:bg-red-600">
          <Trash2 size={14} /> Delete
        </button>
        <button onClick={onClear} className="text-white/80 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
