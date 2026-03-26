import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { TenantProvider, useTenant } from './context/TenantContext'
import { ToastProvider } from './components/ToastProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { Modal } from './components/Modal'
import { LoginPage } from './pages/LoginPage'
import { GettingStartedPage } from './pages/GettingStartedPage'
import { DataViewPage } from './pages/DataViewPage'
import { SchemaBuilderPage } from './pages/SchemaBuilderPage'
import { api } from './api/client'
import { FIELD_TYPES, TYPE_LABELS } from './types'

function PortalRoutes() {
  const { logout } = useAuth()
  const { tenantId, selectedDb } = useTenant()
  const navigate = useNavigate()

  // New table dialog state
  const [showNewTable, setShowNewTable] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableFields, setNewTableFields] = useState([
    { name: 'name', type: 'text', nullable: false, unique: false },
  ])
  const [newTableError, setNewTableError] = useState('')

  function addField() {
    setNewTableFields([...newTableFields, { name: '', type: 'text', nullable: true, unique: false }])
  }

  function updateField(i: number, updates: Partial<typeof newTableFields[0]>) {
    const fields = [...newTableFields]
    fields[i] = { ...fields[i], ...updates }
    setNewTableFields(fields)
  }

  function removeField(i: number) {
    setNewTableFields(newTableFields.filter((_, idx) => idx !== i))
  }

  async function handleCreateTable(e: React.FormEvent) {
    e.preventDefault()
    setNewTableError('')
    if (!tenantId || !selectedDb) return

    const columns = newTableFields
      .filter(f => f.name.trim())
      .map(f => ({ name: f.name, type: f.type, nullable: f.nullable, unique: f.unique }))

    if (columns.length === 0) {
      setNewTableError('Add at least one field')
      return
    }

    try {
      await api.post(`/tenants/${tenantId}/databases/${selectedDb.id}/tables`, {
        name: newTableName,
        columns,
      })
      setShowNewTable(false)
      setNewTableName('')
      setNewTableFields([{ name: 'name', type: 'text', nullable: false, unique: false }])
      navigate(`/tables/${newTableName}`)
      // Force sidebar refresh by navigating
      window.location.href = `/tables/${newTableName}`
    } catch (err) {
      setNewTableError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <>
      <Layout onLogout={logout} onNewTable={() => setShowNewTable(true)}>
        <Routes>
          <Route path="/" element={<GettingStartedPage />} />
          <Route path="/tables/:tableName" element={<DataViewPage />} />
          <Route path="/tables/:tableName/settings" element={<SchemaBuilderPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>

      {/* New Table Modal */}
      <Modal title="New Table" open={showNewTable} onClose={() => setShowNewTable(false)} wide>
        <form onSubmit={handleCreateTable}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
            <input value={newTableName} onChange={(e) => setNewTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="customers" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fields</label>
            <p className="text-xs text-gray-400 mb-2">An <code>id</code> field is added automatically.</p>
            <div className="space-y-2">
              {newTableFields.map((field, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={field.name}
                    onChange={(e) => updateField(i, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="field_name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select value={field.type} onChange={(e) => updateField(i, { type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                    <input type="checkbox" checked={!field.nullable} onChange={(e) => updateField(i, { nullable: !e.target.checked })} className="rounded" />
                    Req
                  </label>
                  {newTableFields.length > 1 && (
                    <button type="button" onClick={() => removeField(i)} className="text-gray-400 hover:text-red-600 text-sm">X</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addField} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ Add another field</button>
          </div>

          {newTableError && <p className="text-red-600 text-sm mb-3">{newTableError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowNewTable(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Create Table</button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default function App() {
  const { isAuthenticated, login, logout } = useAuth()

  if (isAuthenticated === null) return null

  return (
    <ToastProvider>
      <ErrorBoundary>
        <BrowserRouter>
          {!isAuthenticated ? (
            <Routes>
              <Route path="/login" element={<LoginPage onLogin={login} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          ) : (
            <TenantProvider>
              <PortalRoutes />
            </TenantProvider>
          )}
        </BrowserRouter>
      </ErrorBoundary>
    </ToastProvider>
  )
}
