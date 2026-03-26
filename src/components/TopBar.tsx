import { Anvil, LogOut } from 'lucide-react'
import { useTenant } from '../context/TenantContext'

interface Props {
  onLogout: () => void
}

export function TopBar({ onLogout }: Props) {
  const { me, selectedDb } = useTenant()

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Anvil size={22} className="text-blue-600" />
        <span className="font-bold text-gray-900">Forge</span>
        {selectedDb && (
          <span className="text-sm text-gray-500 ml-2">/ {selectedDb.name}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {me && <span className="text-sm text-gray-500">{me.tenant_name}</span>}
        <button onClick={onLogout} className="text-gray-400 hover:text-gray-600" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
