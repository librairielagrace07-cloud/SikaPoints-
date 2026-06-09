'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { uuidSchema } from '@/lib/validation'

const VALID_PLANS = ['starter', 'solo', 'croissance', 'business'] as const

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profil } = await supabase
    .from('profils')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!(profil as { is_super_admin: boolean } | null)?.is_super_admin) {
    throw new Error('Accès refusé')
  }
}

export async function changerPlan(
  userId: string,
  plan: string,
  planFin: string | null = null,
): Promise<void> {
  await assertSuperAdmin()

  const userIdResult = uuidSchema.safeParse(userId)
  if (!userIdResult.success) throw new Error('Identifiant utilisateur invalide')

  if (!VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
    throw new Error('Plan invalide')
  }

  if (planFin !== null) {
    const d = new Date(planFin)
    if (isNaN(d.getTime())) throw new Error('Date d\'expiration invalide')
    if (d <= new Date()) throw new Error('La date d\'expiration doit être dans le futur')
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profils').update({
    plan,
    plan_debut: new Date().toISOString(),
    plan_fin:   planFin,
  }).eq('id', userIdResult.data)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/utilisateurs')
  revalidatePath('/admin/abonnements')
}
