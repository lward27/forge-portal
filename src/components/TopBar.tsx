import { useNavigate } from 'react-router-dom'
import { Anvil, LogOut, Bot } from 'lucide-react'
import { useTenant } from '../context/TenantContext'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  onLogout: () => void
  dark: boolean
  onToggleTheme: () => void
  onOpenChat: () => void
}

export function TopBar({ onLogout, dark, onToggleTheme, onOpenChat }: Props) {
  const { me, selectedDb } = useTenant()
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80">
          <Anvil size={22} className="text-blue-600" />
          <span className="font-bold text-gray-900 dark:text-gray-100">Forge</span>
        </button>
        {selectedDb && (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">/ {selectedDb.name}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {me && <span className="text-sm text-gray-500 dark:text-gray-400">{me.tenant_name}</span>}
        <button onClick={onOpenChat} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="AI Assistant">
          <Bot size={18} />
        </button>
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        <button onClick={onLogout} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
