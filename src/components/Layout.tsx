import { ReactNode, useState } from 'react'
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
      <TopBar onLogout={onLogout} dark={dark} onToggleTheme={onToggleTheme} onOpenChat={() => setChatOpen(true)} />
      <TableSidebar onNewTable={onNewTable} />
      <main className="ml-56 mt-14 p-6">{children}</main>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
