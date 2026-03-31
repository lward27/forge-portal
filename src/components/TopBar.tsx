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
    <header className="fixed top-0 left-0 right-0 h-14 bg-purple-700 dark:bg-purple-900 border-b border-purple-800 dark:border-purple-950 z-20 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80">
          <Anvil size={22} className="text-white" />
          <span className="font-bold text-white">Forge</span>
        </button>
        {selectedDb && (
          <span className="text-sm text-purple-200 ml-2">/ {selectedDb.name}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {me && <span className="text-sm text-purple-200">{me.tenant_name}</span>}
        <button onClick={onOpenChat} className="text-purple-200 hover:text-white" title="AI Assistant">
          <Bot size={18} />
        </button>
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        <button onClick={onLogout} className="text-purple-200 hover:text-white" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
