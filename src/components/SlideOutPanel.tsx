import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function SlideOutPanel({ open, onClose, title, children }: Props) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-xl border-l border-gray-200 z-40 transform transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100%-65px)]">
          {children}
        </div>
      </div>
    </>
  )
}
