import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { GripVertical, X } from 'lucide-react'
import type { DashboardWidget as WidgetType } from '../types'

interface Props {
  widget: WidgetType
  editing: boolean
  onRemove: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  children: ReactNode
}

export function DashboardWidgetWrapper({ widget, editing, onRemove, onDragStart, onDragOver, onDrop, children }: Props) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
      }}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col ${editing ? 'ring-2 ring-blue-200' : ''}`}
      draggable={editing}
      onDragStart={editing ? onDragStart : undefined}
      onDragOver={editing ? onDragOver : undefined}
      onDrop={editing ? onDrop : undefined}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {editing && <GripVertical size={14} className="text-gray-300 cursor-move shrink-0" />}
          <span
            onClick={() => !editing && navigate(`/tables/${widget.table}`)}
            className={`text-xs font-medium text-gray-700 truncate ${!editing ? 'cursor-pointer hover:text-blue-600' : ''}`}
          >
            {widget.title}
          </span>
        </div>
        {editing && (
          <button onClick={onRemove} className="text-gray-400 hover:text-red-600 shrink-0">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 p-2 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
