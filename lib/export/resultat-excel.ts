import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ResultatExportData } from './resultat-pdf'

export function generateResultatExcel(data: ResultatExportData) {
  const wb = XLSX.utils.book_new()
  const debutFmt = format(new Date(data.debut), 'dd/MM/yyyy', { locale: fr })
  const finFmt   = format(new Date(data.fin),   'dd/MM/yyyy', { locale: fr })
  const genFmt   = format(new Date(), 'dd/MM/yyyy à HH:mm',   { locale: fr })
  const periode  = `${debutFmt} – ${finFmt}`

  const titre = data.nomPoint
    ? `SikaPoints — Compte de résultat : ${data.nomPoint}`
    : 'SikaPoints — Compte de résultat (SYSCOHADA)'

  // ── Feuille 1 : Compte de résultat ────────────────────────────────────────
  const wsResultat = XLSX.utils.aoa_to_sheet([
    [titre],
    [`Période : ${periode}`],
    [`Généré le : ${genFmt}`],
    [],
    // Produits
    ['PRODUITS (Classe 7)', ''],
    ['Code', 'Libellé', 'Montant (FCFA)'],
    ...( data.produits.length > 0
      ? data.produits.map(p => [p.code, p.libelle, p.montant])
      : [['', 'Aucun produit enregistré', 0]] ),
    ['', 'TOTAL PRODUITS', data.totalProduits],
    [],
    // Charges
    ['CHARGES (Classe 6)', ''],
    ['Code', 'Libellé', 'Montant (FCFA)'],
    ...( data.charges.length > 0
      ? data.charges.map(c => [c.code, c.libelle, c.montant])
      : [['', 'Aucune charge enregistrée', 0]] ),
    ['', 'TOTAL CHARGES', data.totalCharges],
    [],
    // Résultat
    ['RÉSULTAT NET', '', data.totalProduits - data.totalCharges],
  ])

  wsResultat['!cols'] = [{ wch: 12 }, { wch: 42 }, { wch: 20 }]
  wsResultat['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
  ]
  XLSX.utils.book_append_sheet(wb, wsResultat, 'Compte de résultat')

  // ── Feuille 2 : Balance des comptes ───────────────────────────────────────
  const titreBalance = data.nomPoint
    ? `SikaPoints — Balance des comptes : ${data.nomPoint}`
    : 'SikaPoints — Balance des comptes (SYSCOHADA)'
  const wsBalance = XLSX.utils.aoa_to_sheet([
    [titreBalance],
    [`Période : ${periode}`],
    [],
    ['Compte', 'Intitulé', 'Total Débit', 'Total Crédit', 'Solde Débiteur', 'Solde Créditeur'],
    ...data.balance.map(l => [
      l.code,
      l.libelle,
      l.totalDebit,
      l.totalCredit,
      l.soldeDebiteur  > 0 ? l.soldeDebiteur  : '',
      l.soldeCrediteur > 0 ? l.soldeCrediteur : '',
    ]),
    [
      'TOTAUX',
      '',
      data.balance.reduce((s, l) => s + l.totalDebit, 0),
      data.balance.reduce((s, l) => s + l.totalCredit, 0),
      data.balance.reduce((s, l) => s + l.soldeDebiteur, 0),
      data.balance.reduce((s, l) => s + l.soldeCrediteur, 0),
    ],
  ])

  wsBalance['!cols'] = [{ wch: 12 }, { wch: 38 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
  wsBalance['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]
  XLSX.utils.book_append_sheet(wb, wsBalance, 'Balance des comptes')

  const slug  = data.nomPoint ? '_' + data.nomPoint.replace(/\s+/g, '_') : ''
  const fname = `SikaPoints_Compte_Resultat${slug}_${data.debut}_${data.fin}.xlsx`
  XLSX.writeFile(wb, fname)
}
