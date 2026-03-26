import { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { TableSidebar } from './TableSidebar'

interface Props {
  children: ReactNode
  onLogout: () => void
  onNewTable: () => void
}

export function Layout({ children, onLogout, onNewTable }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar onLogout={onLogout} />
      <TableSidebar onNewTable={onNewTable} />
      <main className="ml-56 mt-14 p-6">{children}</main>
    </div>
  )
}
