import { useState } from 'react'
import { Database, Table2 } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'

export function GettingStartedPage() {
  const { tenantId, databases, selectedDb, refreshDatabases } = useTenant()
  const [showCreateDb, setShowCreateDb] = useState(false)
  const [dbName, setDbName] = useState('')
  const [error, setError] = useState('')

  async function handleCreateDb(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/tenants/${tenantId}/databases`, { name: dbName })
      setShowCreateDb(false)
      setDbName('')
      await refreshDatabases()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  if (databases.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Database size={48} />}
          title="Welcome to Forge!"
          description="Create a database to get started. Your database is where all your tables and data will live."
          action={
            <button onClick={() => setShowCreateDb(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
              Create Database
            </button>
          }
        />
        <Modal title="Create Database" open={showCreateDb} onClose={() => setShowCreateDb(false)}>
          <form onSubmit={handleCreateDb}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
            <input value={dbName} onChange={(e) => setDbName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="my_database" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowCreateDb(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Create</button>
            </div>
          </form>
        </Modal>
      </>
    )
  }

  if (selectedDb) {
    return (
      <EmptyState
        icon={<Table2 size={48} />}
        title="No tables yet"
        description="Create your first table to start organizing your data."
      />
    )
  }

  return (
    <EmptyState
      icon={<Database size={48} />}
      title="Select a database"
      description="Choose a database from the sidebar to get started."
    />
  )
}
