import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { RapportData } from './pdf'

export function generateExcel(data: RapportData) {
  const wb = XLSX.utils.book_new()

  const periodeStr = `${format(data.dateDebut, 'dd/MM/yyyy', { locale: fr })} – ${format(data.dateFin, 'dd/MM/yyyy', { locale: fr })}`
  const genereStr  = format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })

  const titreResume = data.nomPoint
    ? `SikaPoints — Rapport d'activité : ${data.nomPoint}`
    : 'SikaPoints — Rapport d\'activité Mobile Money'

  // ── Feuille 1 : Résumé ────────────────────────────────────────────────────────
  const wsResume = XLSX.utils.aoa_to_sheet([
    [titreResume],
    [`Période : ${periodeStr}`],
    [`Généré le : ${genereStr}`],
    [`Points de vente : ${data.points.map(p => p.nom).join(', ')}`],
    [],
    ['RÉSUMÉ', ''],
    ['Indicateur', 'Valeur'],
    ['Total dépôts (FCFA)',   data.totalDepots],
    ['Total retraits (FCFA)', data.totalRetraits],
    ['Volume total (FCFA)',   data.totalDepots + data.totalRetraits],
    ['Nombre de transactions', data.nbTransactions],
    ['Solde net (FCFA)',      data.totalDepots - data.totalRetraits],
  ])

  // Largeurs colonnes
  wsResume['!cols'] = [{ wch: 32 }, { wch: 22 }]

  // Fusionner la ligne de titre
  wsResume['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]

  XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé')

  // ── Feuille 2 : Par réseau ────────────────────────────────────────────────────
  const reseauHeader = ['Réseau', 'Dépôts (FCFA)', 'Retraits (FCFA)', 'Volume total (FCFA)', 'Transactions', '% Volume']
  const totalVol = data.totalDepots + data.totalRetraits

  const reseauRows = data.parReseau.map(r => [
    r.nom,
    r.depots,
    r.retraits,
    r.depots + r.retraits,
    r.nb,
    totalVol > 0 ? +((r.depots + r.retraits) / totalVol * 100).toFixed(1) : 0,
  ])

  // Ligne total
  reseauRows.push([
    'TOTAL',
    data.totalDepots,
    data.totalRetraits,
    data.totalDepots + data.totalRetraits,
    data.nbTransactions,
    100,
  ])

  const titreReseau = data.nomPoint
    ? `SikaPoints — Répartition par réseau : ${data.nomPoint}`
    : 'SikaPoints — Répartition par réseau'
  const wsReseau = XLSX.utils.aoa_to_sheet([
    [titreReseau],
    [`Période : ${periodeStr}`],
    [],
    reseauHeader,
    ...reseauRows,
  ])

  wsReseau['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 12 }]
  wsReseau['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]

  XLSX.utils.book_append_sheet(wb, wsReseau, 'Par réseau')

  // ── Feuille 3 : Transactions ──────────────────────────────────────────────────
  const txHeader = ['Date', 'Heure', 'Type', 'Réseau', 'Montant (FCFA)', 'Point de vente']
  const txRows = data.transactions.map(t => {
    const d = new Date(t.date)
    return [
      format(d, 'dd/MM/yyyy', { locale: fr }),
      format(d, 'HH:mm', { locale: fr }),
      t.type,
      t.reseau,
      t.type === 'DEPOT' ? t.montant : -t.montant,
      t.point,
    ]
  })

  const wsTransactions = XLSX.utils.aoa_to_sheet([
    ['SikaPoints — Détail des transactions'],
    [`Période : ${periodeStr}`],
    [`Total : ${data.transactions.length} transaction(s)`],
    [],
    txHeader,
    ...txRows,
  ])

  wsTransactions['!cols'] = [
    { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 24 },
  ]
  wsTransactions['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]

  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions')

  // ── Téléchargement ────────────────────────────────────────────────────────────
  const slug     = data.nomPoint ? '_' + data.nomPoint.replace(/\s+/g, '_') : ''
  const filename = `SikaPoints_Rapport${slug}_${format(data.dateDebut, 'yyyyMMdd')}_${format(data.dateFin, 'yyyyMMdd')}.xlsx`
  XLSX.writeFile(wb, filename)
}
