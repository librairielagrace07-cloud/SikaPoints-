'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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

export async function changerPlan(userId: string, plan: string): Promise<void> {
  await assertSuperAdmin()

  if (!VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
    throw new Error('Plan invalide')
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profils').update({ plan }).eq('id', userId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/utilisateurs')
}
