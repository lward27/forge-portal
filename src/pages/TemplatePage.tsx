import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Package, Kanban, Headphones, Loader2 } from 'lucide-react'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { useToast } from '../components/ToastProvider'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface Template {
  id: string
  name: string
  description: string
  icon: string
  table_count: number
}

const ICONS: Record<string, React.ReactNode> = {
  users: <Users size={32} />,
  package: <Package size={32} />,
  kanban: <Kanban size={32} />,
  headphones: <Headphones size={32} />,
}

export function TemplatePage() {
  const { tenantId, selectedDb, triggerRefresh } = useTenant()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [deployTarget, setDeployTarget] = useState<Template | null>(null)

  useEffect(() => {
    api.get<{ templates: Template[] }>('/templates')
      .then(res => setTemplates(res.templates))
      .finally(() => setLoading(false))
  }, [])

  async function handleDeploy() {
    if (!deployTarget || !tenantId || !selectedDb) return
    setDeploying(true)
    try {
      const res = await api.post<{ template: string; tables_created: string[] }>(
        `/tenants/${tenantId}/databases/${selectedDb.id}/deploy-template`,
        { template_id: deployTarget.id }
      )
      toast(`${res.template} deployed — ${res.tables_created.length} tables created`, 'success')
      triggerRefresh()
      setDeployTarget(null)
      navigate('/')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to deploy', 'error')
    } finally {
      setDeploying(false)
    }
  }

  if (loading) return <div className="text-gray-500 dark:text-gray-400">Loading templates...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Templates</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Deploy a pre-built app to get started quickly.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setDeployTarget(t)}>
            <div className="flex items-start gap-4">
              <div className="text-blue-500 dark:text-blue-400 shrink-0">
                {ICONS[t.icon] || <Package size={32} />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t.table_count} tables</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deployTarget}
        title={`Deploy ${deployTarget?.name}?`}
        message={`This will create ${deployTarget?.table_count} tables with pre-configured fields and relationships. You can customize everything after deployment.`}
        confirmLabel={deploying ? 'Deploying...' : 'Deploy'}
        onConfirm={handleDeploy}
        onCancel={() => setDeployTarget(null)}
      />
    </div>
  )
}
