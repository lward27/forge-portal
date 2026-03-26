import { useState } from 'react'
import { Eye, EyeOff, GripVertical } from 'lucide-react'
import { SlideOutPanel } from './SlideOutPanel'
import type { FormConfig, FormFieldConfig, FormRelatedConfig } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  config: FormConfig
  onSave: (config: FormConfig) => void
  onSaveAsNew?: (name: string, config: FormConfig) => void
}

export function FormCustomizer({ open, onClose, config, onSave, onSaveAsNew }: Props) {
  const [newFormName, setNewFormName] = useState('')
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [sections, setSections] = useState(config.sections.map(s => ({
    ...s,
    fields: [...s.fields],
  })))
  const [related, setRelated] = useState<FormRelatedConfig[]>([...config.related_tables])
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  function toggleField(sectionIdx: number, fieldIdx: number) {
    const next = sections.map((s, si) => si === sectionIdx ? {
      ...s,
      fields: s.fields.map((f, fi) => fi === fieldIdx ? { ...f, visible: !f.visible } : f),
    } : s)
    setSections(next)
  }

  function handleFieldDragStart(i: number) {
    setDragIdx(i)
  }

  function handleFieldDragOver(e: React.DragEvent, sectionIdx: number, fieldIdx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === fieldIdx) return
    const next = sections.map((s, si) => {
      if (si !== sectionIdx) return s
      const fields = [...s.fields]
      const [moved] = fields.splice(dragIdx, 1)
      fields.splice(fieldIdx, 0, moved)
      return { ...s, fields }
    })
    setSections(next)
    setDragIdx(fieldIdx)
  }

  function toggleRelated(i: number) {
    const next = [...related]
    next[i] = { ...next[i], visible: !next[i].visible }
    setRelated(next)
  }

  function toggleRelatedCollapsed(i: number) {
    const next = [...related]
    next[i] = { ...next[i], collapsed: !next[i].collapsed }
    setRelated(next)
  }

  function handleSave() {
    onSave({ sections, related_tables: related })
    onClose()
  }

  return (
    <SlideOutPanel open={open} onClose={onClose} title="Customize Form">
      <div className="space-y-6">
        {sections.map((section, si) => (
          <div key={si}>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{section.title}</h3>
            <p className="text-xs text-gray-400 mb-3">Drag to reorder. Click eye to show/hide.</p>
            <div className="space-y-1">
              {section.fields.map((field: FormFieldConfig, fi: number) => (
                <div
                  key={field.field}
                  draggable
                  onDragStart={() => handleFieldDragStart(fi)}
                  onDragOver={(e) => handleFieldDragOver(e, si, fi)}
                  onDragEnd={() => setDragIdx(null)}
                  className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md cursor-move ${dragIdx === fi ? 'opacity-50' : ''}`}
                >
                  <GripVertical size={14} className="text-gray-300" />
                  <span className={`flex-1 text-sm ${field.visible ? 'text-gray-900' : 'text-gray-400'}`}>{field.field}</span>
                  <button type="button" onClick={() => toggleField(si, fi)} className="text-gray-400 hover:text-gray-600">
                    {field.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {related.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Related Tables</h3>
            <div className="space-y-2">
              {related.map((rel, i) => (
                <div key={`${rel.table}-${rel.reference_column}`} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-md">
                  <span className="text-sm text-gray-900">{rel.table}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={rel.collapsed} onChange={() => toggleRelatedCollapsed(i)} className="rounded" />
                      Collapsed
                    </label>
                    <button type="button" onClick={() => toggleRelated(i)} className="text-gray-400 hover:text-gray-600">
                      {rel.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
        {onSaveAsNew && !showSaveAs && (
          <button onClick={() => setShowSaveAs(true)} className="text-sm text-blue-600 hover:text-blue-700">
            Save as New Form...
          </button>
        )}
        {showSaveAs && (
          <div className="flex gap-2">
            <input value={newFormName} onChange={(e) => setNewFormName(e.target.value)} placeholder="Form name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" autoFocus />
            <button onClick={() => {
              if (newFormName.trim()) {
                onSaveAsNew?.(newFormName.trim(), { sections, related_tables: related })
                setNewFormName('')
                setShowSaveAs(false)
                onClose()
              }
            }} className="px-3 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700">Save</button>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Form</button>
        </div>
      </div>
    </SlideOutPanel>
  )
}
