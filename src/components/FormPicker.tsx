import { ChevronDown, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { FormDef } from '../types'

interface Props {
  forms: FormDef[]
  selected: FormDef | null
  onSelect: (form: FormDef) => void
  onDelete: (form: FormDef) => void
}

export function FormPicker({ forms, selected, onSelect, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (forms.length <= 1) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
      >
        {selected?.name || 'Default Form'}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg">
          {forms.map(f => (
            <div
              key={f.id}
              className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${f.id === selected?.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
            >
              <span onClick={() => { onSelect(f); setOpen(false) }} className="flex-1">
                {f.name}{f.is_default ? ' (default)' : ''}
              </span>
              {!f.is_default && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(f) }} className="text-gray-400 hover:text-red-600 ml-2">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
