import { ReactNode, useState } from 'react'
import { Bot } from 'lucide-react'
import { TopBar } from './TopBar'
import { TableSidebar } from './TableSidebar'
import { ChatPanel } from './ChatPanel'

interface Props {
  children: ReactNode
  onLogout: () => void
  onNewTable: () => void
}

export function Layout({ children, onLogout, onNewTable }: Props) {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar onLogout={onLogout} />
      <TableSidebar onNewTable={onNewTable} />
      <main className="ml-56 mt-14 p-6">{children}</main>

      {/* Chat toggle button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-20 transition-transform hover:scale-105"
        title="AI Assistant"
      >
        <Bot size={24} />
      </button>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
