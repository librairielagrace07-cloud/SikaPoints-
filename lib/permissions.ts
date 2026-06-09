import { createClient } from '@/lib/supabase/server'

export interface UserPermissions {
  role: 'PROPRIETAIRE' | 'AGENT'
  plan: string
  peut_deposer: boolean
  peut_retirer: boolean
  peut_voir_rapports: boolean
  peut_modifier_uv: boolean
  point_de_vente_id: string | null
}

const AGENT_NO_ACCESS: UserPermissions = {
  role: 'AGENT',
  plan: 'starter',
  peut_deposer: false,
  peut_retirer: false,
  peut_voir_rapports: false,
  peut_modifier_uv: false,
  point_de_vente_id: null,
}

export async function getUserPermissions(userId?: string): Promise<UserPermissions> {
  const supabase = await createClient()

  let uid = userId
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser()
    uid = user?.id
  }
  if (!uid) return AGENT_NO_ACCESS

  const { data: profil } = await supabase
    .from('profils')
    .select('role, plan')
    .eq('id', uid)
    .single()

  const p = profil as { role: string; plan: string | null } | null
  const role = p?.role as 'PROPRIETAIRE' | 'AGENT' | undefined

  if (role === 'PROPRIETAIRE') {
    return {
      role: 'PROPRIETAIRE',
      plan: p?.plan ?? 'starter',
      peut_deposer: true,
      peut_retirer: true,
      peut_voir_rapports: true,
      peut_modifier_uv: true,
      point_de_vente_id: null,
    }
  }

  // C'est un agent — récupérer ses permissions
  const { data: agent } = await supabase
    .from('agents')
    .select('point_de_vente_id, peut_deposer, peut_retirer, peut_voir_rapports, peut_modifier_uv, actif')
    .eq('user_id', uid)
    .eq('actif', true)
    .single()

  if (!agent) return AGENT_NO_ACCESS

  const a = agent as {
    point_de_vente_id: string
    peut_deposer: boolean
    peut_retirer: boolean
    peut_voir_rapports: boolean
    peut_modifier_uv: boolean
  }

  return {
    role: 'AGENT',
    plan: 'starter',
    peut_deposer: a.peut_deposer,
    peut_retirer: a.peut_retirer,
    peut_voir_rapports: a.peut_voir_rapports,
    peut_modifier_uv: a.peut_modifier_uv,
    point_de_vente_id: a.point_de_vente_id,
  }
}
