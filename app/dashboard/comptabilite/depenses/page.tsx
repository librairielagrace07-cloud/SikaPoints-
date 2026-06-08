import { createClient } from '@/lib/supabase/server'
import { getPeriode } from '@/lib/periode'
import DepensesClient from './depenses-client'

export default async function DepensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { debut, fin } = getPeriode(params)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rawDep }, { data: rawPoints }] = await Promise.all([
    supabase
      .from('depenses')
      .select('id, date_depense, libelle, montant, compte_code, compte_libelle, compte_contrepartie, libelle_contrepartie, point_de_vente_id, mode_paiement, note, created_at, points_de_vente(nom)')
      .eq('proprietaire_id', user!.id)
      .gte('date_depense', debut)
      .lte('date_depense', fin)
      .order('date_depense', { ascending: false }),
    supabase.from('points_de_vente').select('id, nom').eq('proprietaire_id', user!.id),
  ])

  return (
    <DepensesClient
      depenses={(rawDep ?? []) as unknown as Parameters<typeof DepensesClient>[0]['depenses']}
      points={(rawPoints ?? []) as Array<{ id: string; nom: string }>}
      debut={debut}
      fin={fin}
    />
  )
}
