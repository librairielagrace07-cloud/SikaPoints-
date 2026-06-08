import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ResultatData, LigneBalance } from '@/lib/comptabilite'

// ── Palette ────────────────────────────────────────────────────────────────────
const BLUE   = [37, 99, 235]    as [number, number, number]
const WHITE  = [255, 255, 255]  as [number, number, number]
const GRAY1  = [17, 24, 39]     as [number, number, number]
const GRAY5  = [107, 114, 128]  as [number, number, number]
const GRAY9  = [249, 250, 251]  as [number, number, number]
const GREEN  = [22, 163, 74]    as [number, number, number]
const GREEN2 = [220, 252, 231]  as [number, number, number]
const RED    = [220, 38, 38]    as [number, number, number]
const RED2   = [254, 226, 226]  as [number, number, number]

function fmtN(n: number) {
  const s = Math.round(Math.abs(n)).toString()
  const parts = s.split('')
  const intStr = parts.reduceRight<string[]>((acc, d, i, arr) => {
    acc.unshift(d)
    if ((arr.length - 1 - i) % 3 === 2 && i !== 0) acc.unshift(' ')
    return acc
  }, []).join('')
  return (n < 0 ? '-' : '') + intStr + ' FCFA'
}

export interface ResultatExportData {
  debut: string
  fin: string
  produits: ResultatData['produits']
  charges:  ResultatData['charges']
  totalProduits: number
  totalCharges:  number
  resultatNet:   number
  balance: LigneBalance[]
  nomPoint?: string   // si présent → rapport d'un point de vente spécifique
}

export function generateResultatPDF(data: ResultatExportData) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const debutFmt = format(new Date(data.debut), 'dd MMMM yyyy', { locale: fr })
  const finFmt   = format(new Date(data.fin),   'dd MMMM yyyy', { locale: fr })
  const genFmt   = format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })

  // ── En-tête ────────────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, W, 40, 'F')

  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('SikaPoints', 15, 17)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(
    data.nomPoint
      ? `Compte de résultat — ${data.nomPoint}`
      : 'Compte de résultat — Plan comptable SYSCOHADA',
    15, 26,
  )

  doc.setFontSize(9)
  doc.text(`Période : ${debutFmt} — ${finFmt}`, 15, 34)
  doc.text(`Généré le ${genFmt}`, W - 15, 34, { align: 'right' })

  let y = 50

  // ── Résultat net résumé ────────────────────────────────────────────────────
  const isPositif = data.resultatNet >= 0
  doc.setFillColor(...(isPositif ? GREEN2 : RED2))
  doc.roundedRect(15, y, W - 30, 22, 2, 2, 'F')
  doc.setDrawColor(...(isPositif ? GREEN : RED))
  doc.setLineWidth(0.5)
  doc.roundedRect(15, y, W - 30, 22, 2, 2, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...(isPositif ? GREEN : RED))
  doc.text('RÉSULTAT NET DE LA PÉRIODE', 22, y + 8)
  doc.setFontSize(14)
  doc.text(`${isPositif ? '+' : ''}${fmtN(data.resultatNet)}`, W - 22, y + 13, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY5)
  doc.text(`Produits ${fmtN(data.totalProduits)} − Charges ${fmtN(data.totalCharges)}`, 22, y + 17)
  y += 30

  // ── Tableau Produits ───────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GRAY1)
  doc.text('Classe 7 — Produits d\'exploitation', 15, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Code', 'Libellé du compte', 'Montant']],
    body: data.produits.length > 0
      ? data.produits.map(p => [p.code, p.libelle, fmtN(p.montant)])
      : [['', 'Aucun produit enregistré (configurez vos taux de commission)', '']],
    foot: [['', 'TOTAL PRODUITS', fmtN(data.totalProduits)]],
    headStyles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: GREEN2, textColor: [...GREEN], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: GRAY1 },
    alternateRowStyles: { fillColor: GRAY9 },
    columnStyles: { 0: { cellWidth: 20 }, 2: { halign: 'right', fontStyle: 'bold', textColor: [...GREEN] } },
    margin: { left: 15, right: 15 },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1,
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ── Tableau Charges ────────────────────────────────────────────────────────
  if (y + 40 > pageH - 20) { doc.addPage(); y = 20 }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GRAY1)
  doc.text('Classe 6 — Charges d\'exploitation', 15, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Code', 'Libellé du compte', 'Montant']],
    body: data.charges.length > 0
      ? data.charges.map(c => [c.code, c.libelle, fmtN(c.montant)])
      : [['', 'Aucune charge enregistrée', '']],
    foot: [['', 'TOTAL CHARGES', fmtN(data.totalCharges)]],
    headStyles: { fillColor: RED, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: RED2, textColor: [...RED], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: GRAY1 },
    alternateRowStyles: { fillColor: GRAY9 },
    columnStyles: { 0: { cellWidth: 20 }, 2: { halign: 'right', fontStyle: 'bold', textColor: [...RED] } },
    margin: { left: 15, right: 15 },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1,
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ── Balance des comptes ────────────────────────────────────────────────────
  if (y + 40 > pageH - 20) { doc.addPage(); y = 20 }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GRAY1)
  doc.text('Balance des comptes', 15, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Compte', 'Intitulé', 'Total Débit', 'Total Crédit', 'Sd. Débiteur', 'Sd. Créditeur']],
    body: data.balance.map(l => [
      l.code,
      l.libelle,
      fmtN(l.totalDebit),
      fmtN(l.totalCredit),
      l.soldeDebiteur  > 0 ? fmtN(l.soldeDebiteur)  : '',
      l.soldeCrediteur > 0 ? fmtN(l.soldeCrediteur) : '',
    ]),
    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: GRAY1 },
    alternateRowStyles: { fillColor: GRAY9 },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', textColor: [180, 120, 20] },
      5: { halign: 'right', textColor: [...GREEN] },
    },
    margin: { left: 15, right: 15 },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1,
  })

  // ── Pied de page ───────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(...BLUE)
    doc.rect(0, pageH - 10, W, 10, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...WHITE)
    doc.text('SikaPoints — Document confidentiel', 15, pageH - 3.5)
    doc.text(`Page ${i} / ${totalPages}`, W - 15, pageH - 3.5, { align: 'right' })
  }

  const slug  = data.nomPoint ? '_' + data.nomPoint.replace(/\s+/g, '_') : ''
  const fname = `SikaPoints_Compte_Resultat${slug}_${data.debut}_${data.fin}.pdf`
  doc.save(fname)
}
