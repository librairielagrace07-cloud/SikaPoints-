import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Palette ────────────────────────────────────────────────────────────────────
const BLUE   = [37, 99, 235]   as [number, number, number]  // blue-600
const BLUE2  = [219, 234, 254] as [number, number, number]  // blue-100
const GRAY1  = [17, 24, 39]    as [number, number, number]  // gray-900
const GRAY5  = [107, 114, 128] as [number, number, number]  // gray-500
const GRAY9  = [249, 250, 251] as [number, number, number]  // gray-50
const GREEN  = [22, 163, 74]   as [number, number, number]  // green-600
const ORANGE = [234, 88, 12]   as [number, number, number]  // orange-600
const WHITE  = [255, 255, 255] as [number, number, number]

export interface RapportData {
  dateDebut: Date
  dateFin: Date
  periodeLabel: string
  points: Array<{ id: string; nom: string }>
  totalDepots: number
  totalRetraits: number
  nbTransactions: number
  parReseau: Array<{
    nom: string
    couleur: string
    depots: number
    retraits: number
    nb: number
  }>
  transactions: Array<{
    date: string
    type: 'DEPOT' | 'RETRAIT'
    reseau: string
    montant: number
    point: string
  }>
  nomPoint?: string   // si présent → rapport d'un point de vente spécifique
}

function fmt(n: number) {
  // Séparateur de milliers manuel pour éviter les espaces insécables de fr-FR
  const parts = Math.round(n).toString().split('')
  const intStr = parts.reduceRight<string[]>((acc, d, i, arr) => {
    acc.unshift(d)
    if ((arr.length - 1 - i) % 3 === 2 && i !== 0) acc.unshift(' ')
    return acc
  }, []).join('')
  return intStr + ' FCFA'
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function generatePDF(data: RapportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  let y = 0

  // ── Fonctions helpers ────────────────────────────────────────────────────────
  const addPageIfNeeded = (needed = 30) => {
    if (y + needed > pageH - 20) {
      doc.addPage()
      y = 20
      drawPageHeader()
    }
  }

  const drawPageHeader = () => {
    // Bande bleue fine en haut de chaque page
    doc.setFillColor(...BLUE)
    doc.rect(0, 0, W, 8, 'F')
  }

  // ── Page 1 ───────────────────────────────────────────────────────────────────
  // En-tête principal
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, W, 42, 'F')

  // Logo texte
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('SikaPoints', 15, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    data.nomPoint ? `Rapport d'activité — ${data.nomPoint}` : 'Rapport d\'activité Mobile Money',
    15, 28,
  )

  // Période
  const periodeStr = `${format(data.dateDebut, 'dd MMMM yyyy', { locale: fr })} — ${format(data.dateFin, 'dd MMMM yyyy', { locale: fr })}`
  doc.setFontSize(9)
  doc.text(`Période : ${periodeStr}`, 15, 36)

  // Date de génération (coin droit)
  doc.setFontSize(8)
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, W - 15, 36, { align: 'right' })

  y = 52

  // ── Points de vente inclus ───────────────────────────────────────────────────
  if (data.points.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY5)
    const pointsStr = 'Points de vente : ' + data.points.map(p => p.nom).join(', ')
    doc.text(pointsStr, 15, y, { maxWidth: W - 30 })
    y += 8
  }

  // ── Résumé (4 cartes) ────────────────────────────────────────────────────────
  const cardW = (W - 30) / 2
  const cards = [
    { label: 'Total dépôts',      value: fmt(data.totalDepots),   color: GREEN },
    { label: 'Total retraits',    value: fmt(data.totalRetraits),  color: ORANGE },
    { label: 'Volume total',      value: fmt(data.totalDepots + data.totalRetraits), color: BLUE },
    { label: 'Nb transactions',   value: String(data.nbTransactions), color: GRAY5 },
  ]

  cards.forEach((card, i) => {
    const cx = 15 + (i % 2) * (cardW + 5)
    const cy = y + Math.floor(i / 2) * 22

    doc.setFillColor(...GRAY9)
    doc.roundedRect(cx, cy, cardW, 18, 2, 2, 'F')
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(cx, cy, cardW, 18, 2, 2, 'S')

    // Barre colorée à gauche
    doc.setFillColor(...card.color)
    doc.roundedRect(cx, cy, 3, 18, 1, 1, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY5)
    doc.text(card.label, cx + 7, cy + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...GRAY1)
    doc.text(card.value, cx + 7, cy + 13)
  })
  y += 50

  // ── Tableau par réseau ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GRAY1)
  doc.text('Répartition par réseau', 15, y)
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['Réseau', 'Dépôts', 'Retraits', 'Volume total', 'Transactions']],
    body: data.parReseau.map(r => [
      r.nom,
      fmt(r.depots),
      fmt(r.retraits),
      fmt(r.depots + r.retraits),
      String(r.nb),
    ]),
    foot: [['TOTAL', fmt(data.totalDepots), fmt(data.totalRetraits), fmt(data.totalDepots + data.totalRetraits), String(data.nbTransactions)]],

    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: BLUE2, textColor: BLUE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: GRAY1 },
    alternateRowStyles: { fillColor: GRAY9 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', textColor: [22, 163, 74] },
      2: { halign: 'right', textColor: [234, 88, 12] },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'center' },
    },
    margin: { left: 15, right: 15 },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1,
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12

  // ── Détail des transactions ───────────────────────────────────────────────────
  addPageIfNeeded(40)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GRAY1)
  doc.text(`Détail des transactions (${Math.min(data.transactions.length, 200)} premières sur ${data.transactions.length})`, 15, y)
  y += 6

  const txRows = data.transactions.slice(0, 200).map(t => [
    fmtDate(t.date),
    t.type,
    t.reseau,
    t.type === 'DEPOT' ? `+${fmt(t.montant)}` : `-${fmt(t.montant)}`,
    t.point,
  ])

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Type', 'Réseau', 'Montant', 'Point de vente']],
    body: txRows,

    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: GRAY1 },
    alternateRowStyles: { fillColor: GRAY9 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 30 },
      3: { halign: 'right' },
    },
    didParseCell: (hookData) => {
      if (hookData.column.index === 1 && hookData.row.section === 'body') {
        const val = hookData.cell.raw as string
        hookData.cell.styles.textColor = val === 'DEPOT' ? [22, 163, 74] : [234, 88, 12]
        hookData.cell.styles.fontStyle = 'bold'
      }
      if (hookData.column.index === 3 && hookData.row.section === 'body') {
        const val = hookData.cell.raw as string
        hookData.cell.styles.textColor = val.startsWith('+') ? [22, 163, 74] : [234, 88, 12]
        hookData.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: 15, right: 15 },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1,
  })

  // ── Pied de page sur toutes les pages ─────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(...BLUE)
    doc.rect(0, pageH - 10, W, 10, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...WHITE)
    doc.text('SikaPoints — Rapport confidentiel', 15, pageH - 3.5)
    doc.text(`Page ${i} / ${totalPages}`, W - 15, pageH - 3.5, { align: 'right' })
  }

  // Téléchargement
  const slug     = data.nomPoint ? '_' + data.nomPoint.replace(/\s+/g, '_') : ''
  const filename = `SikaPoints_Rapport${slug}_${format(data.dateDebut, 'yyyyMMdd')}_${format(data.dateFin, 'yyyyMMdd')}.pdf`
  doc.save(filename)
}
