import { z } from 'zod'

// ── Primitives réutilisables ──────────────────────────────────────────────────

export const uuidSchema = z.string().uuid('Identifiant invalide')

/** Texte sûr : trim + strip HTML + longueur bornée */
export function safeText(min: number, max: number, label = 'Ce champ') {
  return z
    .string()
    .min(min, `${label} : minimum ${min} caractère(s)`)
    .max(max, `${label} : maximum ${max} caractères`)
    .transform(s => s.trim().replace(/<[^>]*>/g, '').replace(/\0/g, ''))
    .refine(s => s.length >= min, `${label} : minimum ${min} caractère(s) après nettoyage`)
}

/** Montant FCFA : entier positif, max 100 millions */
export const montantSchema = z.coerce
  .number()
  .int('Le montant doit être un entier')
  .positive('Le montant doit être positif')
  .max(100_000_000, 'Montant trop élevé (max 100 000 000 FCFA)')

/** Numéro de téléphone : chiffres, espaces, +, -, (, ), entre 8 et 20 chars */
export const telephoneSchema = z
  .string()
  .min(8, 'Numéro de téléphone invalide (min 8 caractères)')
  .max(20, 'Numéro de téléphone invalide (max 20 caractères)')
  .regex(/^[\d\s\+\-\(\)\.]+$/, 'Format de numéro invalide (chiffres et +/- uniquement)')
  .transform(s => s.trim())

/** Mot de passe : 6–100 chars (borné pour éviter les attaques bcrypt) */
export const passwordSchema = z
  .string()
  .min(6, 'Mot de passe : au moins 6 caractères')
  .max(100, 'Mot de passe : maximum 100 caractères')

/** Date future (ISO string) */
export const futureDateSchema = z
  .string()
  .datetime({ message: 'Date invalide' })
  .refine(s => new Date(s) > new Date(), 'La date doit être dans le futur')
