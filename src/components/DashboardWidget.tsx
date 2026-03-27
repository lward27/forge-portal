import { ReactNode, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GripVertical, X, Minus, Plus } from 'lucide-react'
import type { DashboardWidget as WidgetType } from '../types'

interface Props {
  widget: WidgetType
  editing: boolean
  onRemove: () => void
  onResize: (w: number, h: number) => void
  onMove: (x: number, y: number) => void
  children: ReactNode
}

export function DashboardWidgetWrapper({ widget, editing, onRemove, onResize, onMove, children }: Props) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
      }}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col relative ${editing ? 'ring-2 ring-blue-200' : ''}`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {editing && <GripVertical size={14} className="text-gray-300 shrink-0" />}
          <span
            onClick={() => !editing && navigate(`/tables/${widget.table}`)}
            className={`text-xs font-medium text-gray-700 truncate ${!editing ? 'cursor-pointer hover:text-blue-600' : ''}`}
          >
            {widget.title}
          </span>
        </div>
        {editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onRemove} className="text-gray-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 p-2 overflow-hidden">
        {children}
      </div>

      {/* Resize/move controls in edit mode */}
      {editing && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-blue-50 border-t border-blue-200 text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <span>W:</span>
            <button onClick={() => onResize(Math.max(2, widget.w - 1), widget.h)} className="text-gray-400 hover:text-gray-600"><Minus size={12} /></button>
            <span className="w-4 text-center">{widget.w}</span>
            <button onClick={() => onResize(Math.min(12, widget.w + 1), widget.h)} className="text-gray-400 hover:text-gray-600"><Plus size={12} /></button>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <span>H:</span>
            <button onClick={() => onResize(widget.w, Math.max(1, widget.h - 1))} className="text-gray-400 hover:text-gray-600"><Minus size={12} /></button>
            <span className="w-4 text-center">{widget.h}</span>
            <button onClick={() => onResize(widget.w, widget.h + 1)} className="text-gray-400 hover:text-gray-600"><Plus size={12} /></button>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <span>X:</span>
            <button onClick={() => onMove(Math.max(0, widget.x - 1), widget.y)} className="text-gray-400 hover:text-gray-600"><Minus size={12} /></button>
            <span className="w-4 text-center">{widget.x}</span>
            <button onClick={() => onMove(Math.min(12 - widget.w, widget.x + 1), widget.y)} className="text-gray-400 hover:text-gray-600"><Plus size={12} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
