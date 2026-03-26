import { useState } from 'react'
import { Anvil } from 'lucide-react'
import { api } from '../api/client'
import type { AuthMe } from '../types'

interface Props {
  onLogin: (key: string) => void
}

export function LoginPage({ onLogin }: Props) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    localStorage.setItem('forge_portal_key', key)

    try {
      const me = await api.get<AuthMe>('/auth/me')
      if (!me.tenant_id) {
        setError('This key does not have tenant access')
        localStorage.removeItem('forge_portal_key')
        return
      }
      onLogin(key)
    } catch {
      localStorage.removeItem('forge_portal_key')
      setError('Invalid API key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Anvil size={28} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Forge Portal</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="forge_..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            disabled={!key || loading}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
