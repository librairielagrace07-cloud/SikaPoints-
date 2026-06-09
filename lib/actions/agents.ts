'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { getLimits, getPlanLabel } from '@/lib/plan-limits'
import { uuidSchema, safeText, telephoneSchema, passwordSchema } from '@/lib/validation'

export type ActionState = { error?: string; success?: boolean }

export type Permissions = {
  peut_deposer: boolean
  peut_retirer: boolean
  peut_voir_rapports: boolean
  peut_modifier_uv: boolean
}

const AgentCompteSchema = z.object({
  nom_complet:       safeText(2, 100, 'Nom'),
  telephone:         telephoneSchema,
  point_de_vente_id: uuidSchema,
  mot_de_passe:      passwordSchema,
  peut_deposer:      z.boolean().default(true),
  peut_retirer:      z.boolean().default(true),
  peut_voir_rapports: z.boolean().default(false),
  peut_modifier_uv:  z.boolean().default(false),
})

/** Vérifie que l'agent appartient (via son point) à l'utilisateur connecté. */
async function verifierProprieteAgent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agentId: string,
  userId: string,
): Promise<{ agentUserId: string | null } | null> {
  const { data: agent } = await supabase
    .from('agents')
    .select('user_id, point_de_vente_id')
    .eq('id', agentId)
    .single()

  if (!agent) return null

  const { data: point } = await supabase
    .from('points_de_vente')
    .select('id')
    .eq('id', (agent as { point_de_vente_id: string }).point_de_vente_id)
    .eq('proprietaire_id', userId)
    .single()

  if (!point) return null
  return { agentUserId: (agent as { user_id: string | null }).user_id ?? null }
}

export async function creerCompteAgent(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = {
    nom_complet:        formData.get('nom_complet') as string,
    telephone:          formData.get('telephone') as string,
    point_de_vente_id:  formData.get('point_de_vente_id') as string,
    mot_de_passe:       formData.get('mot_de_passe') as string,
    peut_deposer:       formData.get('peut_deposer') === 'on',
    peut_retirer:       formData.get('peut_retirer') === 'on',
    peut_voir_rapports: formData.get('peut_voir_rapports') === 'on',
    peut_modifier_uv:   formData.get('peut_modifier_uv') === 'on',
  }

  const parsed = AgentCompteSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Vérifier que le point appartient à cet admin
  const { data: point } = await supabase
    .from('points_de_vente')
    .select('id, nom')
    .eq('id', parsed.data.point_de_vente_id)
    .eq('proprietaire_id', user.id)
    .single()

  if (!point) return { error: 'Point de vente introuvable ou non autorisé' }

  // Vérifier la limite d'agents du plan
  const { data: profil } = await supabase.from('profils').select('plan').eq('id', user.id).single()
  const plan = (profil as { plan: string | null } | null)?.plan
  const limits = getLimits(plan)
  if (limits.maxAgents < 999) {
    const { data: allPoints } = await supabase.from('points_de_vente').select('id').eq('proprietaire_id', user.id)
    const allIds = (allPoints ?? []).map(p => (p as { id: string }).id)
    const { count } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .in('point_de_vente_id', allIds.length > 0 ? allIds : ['none'])
      .eq('actif', true)
    if ((count ?? 0) >= limits.maxAgents) {
      return {
        error: `Plan ${getPlanLabel(plan)} : maximum ${limits.maxAgents} agent(s) actif(s). Passez au plan supérieur dans Paramètres → Abonnement.`,
      }
    }
  }

  const telephone = parsed.data.telephone

  // Vérifier que le téléphone n'est pas déjà utilisé
  const adminSupabase = createAdminClient()
  const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
  const alreadyExists = existingUsers?.users?.some(
    u => u.user_metadata?.telephone === telephone
  )
  if (alreadyExists) return { error: `Le numéro ${telephone} est déjà utilisé` }

  const fakeEmail = `${telephone.replace(/[\s\+\-\(\)]/g, '')}@mmmanager.local`
  const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email: fakeEmail,
    password: parsed.data.mot_de_passe,
    email_confirm: true,
    user_metadata: {
      nom_complet: parsed.data.nom_complet,
      telephone,
      role: 'AGENT',
    },
  })

  if (authError || !newUser.user) {
    return { error: authError?.message ?? 'Erreur création du compte' }
  }

  const { error: agentError } = await adminSupabase.from('agents').insert({
    user_id:           newUser.user.id,
    nom_complet:       parsed.data.nom_complet,
    telephone,
    email:             fakeEmail,
    point_de_vente_id: parsed.data.point_de_vente_id,
    actif:             true,
    peut_deposer:      parsed.data.peut_deposer,
    peut_retirer:      parsed.data.peut_retirer,
    peut_voir_rapports: parsed.data.peut_voir_rapports,
    peut_modifier_uv:  parsed.data.peut_modifier_uv,
  })

  if (agentError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    return { error: agentError.message }
  }

  revalidatePath('/dashboard/agents')
  revalidatePath(`/dashboard/points/${parsed.data.point_de_vente_id}`)
  return { success: true }
}

export async function modifierAgent(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const agentIdResult = uuidSchema.safeParse(formData.get('agent_id'))
  if (!agentIdResult.success) return { error: 'Identifiant agent invalide' }

  const nomResult = safeText(2, 100, 'Nom').safeParse(formData.get('nom_complet'))
  if (!nomResult.success) return { error: nomResult.error.issues[0].message }

  const telResult = telephoneSchema.safeParse(formData.get('telephone'))
  if (!telResult.success) return { error: telResult.error.issues[0].message }

  // Vérifier que l'agent appartient à un point de cet admin
  const ownership = await verifierProprieteAgent(supabase, agentIdResult.data, user.id)
  if (!ownership) return { error: 'Agent introuvable ou accès non autorisé' }

  const { data: agentCurrent } = await supabase
    .from('agents')
    .select('telephone')
    .eq('id', agentIdResult.data)
    .single()

  const { error } = await supabase.from('agents').update({
    nom_complet: nomResult.data,
    telephone:   telResult.data,
  }).eq('id', agentIdResult.data)

  if (error) return { error: error.message }

  if (ownership.agentUserId) {
    const adminSupabase = createAdminClient()
    const updates: Record<string, unknown> = { user_metadata: { nom_complet: nomResult.data, telephone: telResult.data } }
    if (telResult.data !== (agentCurrent as { telephone: string } | null)?.telephone) {
      const newFakeEmail = `${telResult.data.replace(/[\s\+\-\(\)]/g, '')}@mmmanager.local`
      updates.email = newFakeEmail
      await supabase.from('agents').update({ email: newFakeEmail }).eq('id', agentIdResult.data)
    }
    await adminSupabase.auth.admin.updateUserById(ownership.agentUserId, updates)
  }

  revalidatePath('/dashboard/agents')
  return { success: true }
}

export async function modifierPermissions(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const agentIdResult = uuidSchema.safeParse(formData.get('agent_id'))
  if (!agentIdResult.success) return { error: 'Identifiant agent invalide' }

  // Vérifier ownership
  const ownership = await verifierProprieteAgent(supabase, agentIdResult.data, user.id)
  if (!ownership) return { error: 'Agent introuvable ou accès non autorisé' }

  const { error } = await supabase.from('agents').update({
    peut_deposer:       formData.get('peut_deposer')       === 'on',
    peut_retirer:       formData.get('peut_retirer')       === 'on',
    peut_voir_rapports: formData.get('peut_voir_rapports') === 'on',
    peut_modifier_uv:   formData.get('peut_modifier_uv')   === 'on',
    actif:              formData.get('actif')               === 'on',
  }).eq('id', agentIdResult.data)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/agents')
  return { success: true }
}

export async function reinitialiserMotDePasse(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const agentIdResult = uuidSchema.safeParse(formData.get('agent_id'))
  if (!agentIdResult.success) return { error: 'Identifiant agent invalide' }

  const mdpResult = passwordSchema.safeParse(formData.get('nouveau_mdp'))
  if (!mdpResult.success) return { error: mdpResult.error.issues[0].message }

  // Vérifier ownership
  const ownership = await verifierProprieteAgent(supabase, agentIdResult.data, user.id)
  if (!ownership) return { error: 'Agent introuvable ou accès non autorisé' }
  if (!ownership.agentUserId) return { error: 'Compte agent introuvable' }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.auth.admin.updateUserById(
    ownership.agentUserId,
    { password: mdpResult.data }
  )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/agents')
  return { success: true }
}

export async function supprimerAgent(id: string, pointId: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const idResult      = uuidSchema.safeParse(id)
  const pointIdResult = uuidSchema.safeParse(pointId)
  if (!idResult.success || !pointIdResult.success) return { error: 'Identifiants invalides' }

  // Vérifier ownership
  const ownership = await verifierProprieteAgent(supabase, idResult.data, user.id)
  if (!ownership) return { error: 'Agent introuvable ou accès non autorisé' }

  const { error } = await supabase.from('agents').delete().eq('id', idResult.data)
  if (error) return { error: error.message }

  if (ownership.agentUserId) {
    const adminSupabase = createAdminClient()
    await adminSupabase.auth.admin.deleteUser(ownership.agentUserId)
  }

  revalidatePath('/dashboard/agents')
  revalidatePath(`/dashboard/points/${pointIdResult.data}`)
  return { success: true }
}
