import { Sun, Moon } from 'lucide-react'

interface Props {
  dark: boolean
  onToggle: () => void
}

export function ThemeToggle({ dark, onToggle }: Props) {
  return (
    <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" title="Toggle theme">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
