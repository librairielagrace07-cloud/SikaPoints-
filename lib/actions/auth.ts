'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { safeText, telephoneSchema, passwordSchema } from '@/lib/validation'

export type AuthState = {
  error?: string
  success?: boolean
}

const LoginEmailSchema = z.object({
  email:    z.string().email('Email invalide').max(320),
  password: z.string().min(1, 'Mot de passe requis').max(100, 'Mot de passe trop long'),
})

const LoginPhoneSchema = z.object({
  telephone: telephoneSchema,
  password:  z.string().min(1, 'Mot de passe requis').max(100, 'Mot de passe trop long'),
})

const RegisterSchema = z.object({
  nom_complet:      safeText(2, 100, 'Nom complet'),
  telephone:        telephoneSchema.optional().or(z.literal('')).optional(),
  email:            z.string().email('Email invalide').max(320),
  password:         passwordSchema,
  confirm_password: z.string().min(1, 'Confirmation requise').max(100),
}).refine(d => d.password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const mode = formData.get('mode') as string
  const supabase = await createClient()

  if (mode === 'phone') {
    const raw = {
      telephone: (formData.get('telephone') as string)?.trim(),
      password:  formData.get('password') as string,
    }
    const parsed = LoginPhoneSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const adminClient = createAdminClient()
    const { data: usersData } = await adminClient.auth.admin.listUsers()
    const matchedUser = usersData?.users?.find(
      u => u.user_metadata?.telephone === parsed.data.telephone
        || u.user_metadata?.telephone === parsed.data.telephone.replace(/\s/g, '')
    )

    if (!matchedUser) return { error: 'Numéro de téléphone non trouvé' }

    const { error } = await supabase.auth.signInWithPassword({
      email:    matchedUser.email!,
      password: parsed.data.password,
    })
    if (error) return { error: 'Numéro ou mot de passe incorrect' }

  } else {
    const raw = {
      email:    formData.get('email') as string,
      password: formData.get('password') as string,
    }
    const parsed = LoginEmailSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase.auth.signInWithPassword(parsed.data)
    if (error) return { error: 'Email ou mot de passe incorrect' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    nom_complet:      formData.get('nom_complet') as string,
    telephone:        formData.get('telephone') as string,
    email:            formData.get('email') as string,
    password:         formData.get('password') as string,
    confirm_password: formData.get('confirm_password') as string,
  }

  const parsed = RegisterSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        nom_complet: parsed.data.nom_complet,
        telephone:   parsed.data.telephone || null,
        role:        'PROPRIETAIRE',
      },
    },
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
