import { createClient } from '@/lib/supabase/server'
import RapportsClient from './rapports-client'
import { subMonths } from 'date-fns'

export default async function RapportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: points } = await supabase
    .from('points_de_vente')
    .select('id, nom')
    .eq('proprietaire_id', user!.id)

  const pointIds = (points as Array<{ id: string }> | null)?.map(p => p.id) ?? []

  // Charger 12 mois — le filtrage par période se fait côté client
  const since = subMonths(new Date(), 12).toISOString()

  const [{ data: rawTransactions }, { data: rawReseaux }] = await Promise.all([
    supabase
      .from('transactions')
      .select('type, montant, reseau_id, point_de_vente_id, created_at, reseaux(nom, couleur), points_de_vente(nom)')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none'])
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabase.from('reseaux').select('id, nom, couleur'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <p className="text-gray-500 text-sm mt-1">Analyse et export de vos données</p>
      </div>
      <RapportsClient
        transactions={(rawTransactions ?? []) as unknown as Parameters<typeof RapportsClient>[0]['transactions']}
        reseaux={(rawReseaux ?? []) as unknown as Parameters<typeof RapportsClient>[0]['reseaux']}
        points={(points ?? []) as Array<{ id: string; nom: string }>}
      />
    </div>
  )
}
