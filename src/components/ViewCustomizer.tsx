import { useState } from 'react'
import { Eye, EyeOff, GripVertical } from 'lucide-react'
import { SlideOutPanel } from './SlideOutPanel'
import type { ViewConfig, ViewColumnConfig } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  config: ViewConfig
  onSave: (config: ViewConfig) => void
}

export function ViewCustomizer({ open, onClose, config, onSave }: Props) {
  const [columns, setColumns] = useState<ViewColumnConfig[]>([...config.columns])
  const [sortField, setSortField] = useState(config.default_sort.field)
  const [sortDir, setSortDir] = useState(config.default_sort.direction)
  const [pageSize, setPageSize] = useState(config.page_size)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  function toggleVisibility(i: number) {
    const next = [...columns]
    next[i] = { ...next[i], visible: !next[i].visible }
    setColumns(next)
  }

  function handleDragStart(i: number) {
    setDragIdx(i)
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    const next = [...columns]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setColumns(next)
    setDragIdx(i)
  }

  function handleSave() {
    onSave({
      columns,
      default_sort: { field: sortField, direction: sortDir },
      page_size: pageSize,
    })
    onClose()
  }

  return (
    <SlideOutPanel open={open} onClose={onClose} title="Customize View">
      <div className="space-y-6">
        {/* Column visibility and order */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Columns</h3>
          <p className="text-xs text-gray-400 mb-3">Drag to reorder. Click eye to show/hide.</p>
          <div className="space-y-1">
            {columns.map((col, i) => (
              <div
                key={col.field}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={() => setDragIdx(null)}
                className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md cursor-move ${dragIdx === i ? 'opacity-50' : ''}`}
              >
                <GripVertical size={14} className="text-gray-300" />
                <span className={`flex-1 text-sm ${col.visible ? 'text-gray-900' : 'text-gray-400'}`}>{col.field}</span>
                <button type="button" onClick={() => toggleVisibility(i)} className="text-gray-400 hover:text-gray-600">
                  {col.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Default sort */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Default Sort</h3>
          <div className="flex gap-2">
            <select value={sortField} onChange={(e) => setSortField(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
              {columns.map(c => <option key={c.field} value={c.field}>{c.field}</option>)}
            </select>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Page size */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Page Size</h3>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} rows</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Save View</button>
      </div>
    </SlideOutPanel>
  )
}
