import { createClient } from '@/lib/supabase/server'
import { Users, Phone, Store } from 'lucide-react'
import NouvelAgentForm from './nouvel-agent-form'
import AgentCard from './agent-card'

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: points } = await supabase
    .from('points_de_vente')
    .select('id, nom')
    .eq('proprietaire_id', user!.id)

  const pointIds = (points as Array<{ id: string; nom: string }> | null)?.map(p => p.id) ?? []

  const { data: rawAgents } = await supabase
    .from('agents')
    .select('*, points_de_vente(nom)')
    .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none'])
    .order('created_at', { ascending: false })

  const agents = (rawAgents ?? []) as Array<{
    id: string
    nom_complet: string
    telephone: string | null
    actif: boolean
    peut_deposer: boolean
    peut_retirer: boolean
    peut_voir_rapports: boolean
    peut_modifier_uv: boolean
    points_de_vente: { nom: string } | null
  }>

  const typedPoints = (points ?? []) as Array<{ id: string; nom: string }>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-500 text-sm mt-1">{agents.length} agent(s)</p>
        </div>
        {typedPoints.length > 0 && (
          <NouvelAgentForm points={typedPoints} />
        )}
      </div>

      {typedPoints.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Créez d'abord un point de vente pour ajouter des agents</p>
        </div>
      ) : agents.length > 0 ? (
        <div className="space-y-3">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">Aucun agent</h3>
          <p className="text-gray-400 text-sm">Créez un compte agent pour lui donner accès à son point de vente</p>
        </div>
      )}
    </div>
  )
}
