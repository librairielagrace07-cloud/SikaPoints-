'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { getLimits, getPlanLabel } from '@/lib/plan-limits'

export type ActionState = { error?: string; success?: boolean }

export type Permissions = {
  peut_deposer: boolean
  peut_retirer: boolean
  peut_voir_rapports: boolean
  peut_modifier_uv: boolean
}

const AgentCompteSchema = z.object({
  nom_complet: z.string().min(2, 'Nom requis (min 2 caractères)'),
  telephone: z.string().min(8, 'Numéro de téléphone requis'),
  point_de_vente_id: z.string().uuid('Point de vente requis'),
  mot_de_passe: z.string().min(6, 'Mot de passe: au moins 6 caractères'),
  peut_deposer: z.boolean().default(true),
  peut_retirer: z.boolean().default(true),
  peut_voir_rapports: z.boolean().default(false),
  peut_modifier_uv: z.boolean().default(false),
})

export async function creerCompteAgent(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier que le point appartient à cet admin
  const { data: point } = await supabase
    .from('points_de_vente')
    .select('id, nom')
    .eq('id', formData.get('point_de_vente_id') as string)
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

  const raw = {
    nom_complet: formData.get('nom_complet') as string,
    telephone: formData.get('telephone') as string,
    point_de_vente_id: formData.get('point_de_vente_id') as string,
    mot_de_passe: formData.get('mot_de_passe') as string,
    peut_deposer: formData.get('peut_deposer') === 'on',
    peut_retirer: formData.get('peut_retirer') === 'on',
    peut_voir_rapports: formData.get('peut_voir_rapports') === 'on',
    peut_modifier_uv: formData.get('peut_modifier_uv') === 'on',
  }

  const parsed = AgentCompteSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const telephone = parsed.data.telephone.trim()

  // Vérifier que le téléphone n'est pas déjà utilisé
  const adminSupabase = createAdminClient()
  const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
  const alreadyExists = existingUsers?.users?.some(
    u => u.user_metadata?.telephone === telephone
  )
  if (alreadyExists) return { error: `Le numéro ${telephone} est déjà utilisé` }

  // Créer l'utilisateur dans Supabase Auth (email fictif basé sur le téléphone)
  const fakeEmail = `${telephone.replace(/\s+/g, '')}@mmmanager.local`
  const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email: fakeEmail,
    password: parsed.data.mot_de_passe,
    email_confirm: true, // Pas de confirmation email nécessaire
    user_metadata: {
      nom_complet: parsed.data.nom_complet,
      telephone,
      role: 'AGENT',
    },
  })

  if (authError || !newUser.user) {
    return { error: authError?.message ?? 'Erreur création du compte' }
  }

  // Créer l'enregistrement agent lié à ce user
  const { error: agentError } = await adminSupabase.from('agents').insert({
    user_id: newUser.user.id,
    nom_complet: parsed.data.nom_complet,
    telephone,
    email: fakeEmail,
    point_de_vente_id: parsed.data.point_de_vente_id,
    actif: true,
    peut_deposer: parsed.data.peut_deposer,
    peut_retirer: parsed.data.peut_retirer,
    peut_voir_rapports: parsed.data.peut_voir_rapports,
    peut_modifier_uv: parsed.data.peut_modifier_uv,
  })

  if (agentError) {
    // Annuler la création du user si l'agent échoue
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

  const agentId = formData.get('agent_id') as string
  const nom_complet = (formData.get('nom_complet') as string)?.trim()
  const telephone = (formData.get('telephone') as string)?.trim()

  if (!nom_complet || nom_complet.length < 2) return { error: 'Nom requis (min 2 caractères)' }
  if (!telephone || telephone.length < 8) return { error: 'Numéro de téléphone requis' }

  // Récupérer l'agent pour mettre à jour aussi les metadata auth
  const { data: agent } = await supabase
    .from('agents')
    .select('user_id, telephone')
    .eq('id', agentId)
    .single()

  if (!agent) return { error: 'Agent introuvable' }

  // Mettre à jour dans la table agents
  const { error } = await supabase.from('agents').update({
    nom_complet,
    telephone,
  }).eq('id', agentId)

  if (error) return { error: error.message }

  // Mettre à jour les metadata auth + l'email fictif si le téléphone a changé
  if (agent.user_id && telephone !== (agent as { telephone: string | null }).telephone) {
    const adminSupabase = createAdminClient()
    const newFakeEmail = `${telephone.replace(/\s+/g, '')}@mmmanager.local`
    await adminSupabase.auth.admin.updateUserById(agent.user_id as string, {
      email: newFakeEmail,
      user_metadata: { nom_complet, telephone },
    })
    // Mettre à jour l'email dans agents aussi
    await supabase.from('agents').update({ email: newFakeEmail }).eq('id', agentId)
  } else if (agent.user_id) {
    const adminSupabase = createAdminClient()
    await adminSupabase.auth.admin.updateUserById(agent.user_id as string, {
      user_metadata: { nom_complet, telephone },
    })
  }

  revalidatePath('/dashboard/agents')
  return { success: true }
}

export async function modifierPermissions(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const agentId = formData.get('agent_id') as string

  const { error } = await supabase.from('agents').update({
    peut_deposer: formData.get('peut_deposer') === 'on',
    peut_retirer: formData.get('peut_retirer') === 'on',
    peut_voir_rapports: formData.get('peut_voir_rapports') === 'on',
    peut_modifier_uv: formData.get('peut_modifier_uv') === 'on',
    actif: formData.get('actif') === 'on',
  }).eq('id', agentId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/agents')
  return { success: true }
}

export async function reinitialiserMotDePasse(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const agentId = formData.get('agent_id') as string
  const nouveauMdp = formData.get('nouveau_mdp') as string

  if (!nouveauMdp || nouveauMdp.length < 6) {
    return { error: 'Le mot de passe doit avoir au moins 6 caractères' }
  }

  // Récupérer le user_id de l'agent
  const { data: agent } = await supabase
    .from('agents')
    .select('user_id')
    .eq('id', agentId)
    .single()

  if (!agent?.user_id) return { error: 'Agent introuvable' }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.auth.admin.updateUserById(
    agent.user_id as string,
    { password: nouveauMdp }
  )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/agents')
  return { success: true }
}

export async function supprimerAgent(id: string, pointId: string): Promise<ActionState> {
  const supabase = await createClient()

  // Récupérer le user_id avant suppression
  const { data: agent } = await supabase
    .from('agents')
    .select('user_id')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('agents').delete().eq('id', id)
  if (error) return { error: error.message }

  // Supprimer aussi le compte auth si c'est un compte agent
  if (agent?.user_id) {
    const adminSupabase = createAdminClient()
    await adminSupabase.auth.admin.deleteUser(agent.user_id as string)
  }

  revalidatePath('/dashboard/agents')
  revalidatePath(`/dashboard/points/${pointId}`)
  return { success: true }
}
