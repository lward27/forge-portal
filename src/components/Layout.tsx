import { ReactNode, useState } from 'react'
import { Bot } from 'lucide-react'
import { TopBar } from './TopBar'
import { TableSidebar } from './TableSidebar'
import { ChatPanel } from './ChatPanel'

interface Props {
  children: ReactNode
  onLogout: () => void
  onNewTable: () => void
  dark: boolean
  onToggleTheme: () => void
}

export function Layout({ children, onLogout, onNewTable, dark, onToggleTheme }: Props) {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar onLogout={onLogout} dark={dark} onToggleTheme={onToggleTheme} />
      <TableSidebar onNewTable={onNewTable} />
      <main className="ml-56 mt-14 p-6">{children}</main>

      {/* Chat toggle button — semi-transparent, full opacity on hover */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-10 h-10 bg-blue-600/40 text-white/60 rounded-full shadow-md hover:bg-blue-600 hover:text-white hover:w-14 hover:h-14 hover:shadow-lg flex items-center justify-center z-20 transition-all duration-200"
        title="AI Assistant"
      >
        <Bot size={20} />
      </button>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
