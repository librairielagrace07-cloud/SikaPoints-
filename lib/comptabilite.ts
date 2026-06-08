// ══════════════════════════════════════════════════════════════════════════════
// Plan Comptable SYSCOHADA — Mobile Money
// ══════════════════════════════════════════════════════════════════════════════

export const COMPTES_CHARGES = [
  // ── Achats ─────────────────────────────────────────────────────────────────
  { code: '601',  libelle: 'Achats de marchandises',          groupe: 'Achats' },
  { code: '604',  libelle: 'Achats de fournitures de bureau', groupe: 'Achats' },
  { code: '608',  libelle: 'Autres achats non stockés',       groupe: 'Achats' },
  // ── Services extérieurs ────────────────────────────────────────────────────
  { code: '622',  libelle: 'Locations et charges locatives',  groupe: 'Services extérieurs' },
  { code: '624',  libelle: 'Entretien et réparations',        groupe: 'Services extérieurs' },
  { code: '625',  libelle: "Primes d'assurance",              groupe: 'Services extérieurs' },
  { code: '628',  libelle: 'Frais de télécommunications',     groupe: 'Services extérieurs' },
  { code: '629',  libelle: 'Autres services extérieurs',      groupe: 'Services extérieurs' },
  // ── Charges financières ────────────────────────────────────────────────────
  { code: '631',  libelle: 'Frais et commissions bancaires',  groupe: 'Charges financières' },
  { code: '632',  libelle: 'Commissions versées aux réseaux', groupe: 'Charges financières' },
  { code: '671',  libelle: 'Intérêts et charges financières', groupe: 'Charges financières' },
  // ── Impôts et taxes ────────────────────────────────────────────────────────
  { code: '641',  libelle: 'Impôts et taxes divers',          groupe: 'Impôts et taxes' },
  { code: '6411', libelle: 'Patente et taxe professionnelle', groupe: 'Impôts et taxes' },
  { code: '6414', libelle: 'Taxes sur salaires',              groupe: 'Impôts et taxes' },
  { code: '6419', libelle: 'Autres impôts et taxes',          groupe: 'Impôts et taxes' },
  // ── Charges de personnel ───────────────────────────────────────────────────
  { code: '6611', libelle: 'Salaires et traitements',         groupe: 'Personnel' },
  { code: '6612', libelle: 'Primes et gratifications',        groupe: 'Personnel' },
  { code: '6613', libelle: 'Indemnités et avantages',         groupe: 'Personnel' },
  { code: '662',  libelle: 'Cotisations sociales (CNPS)',     groupe: 'Personnel' },
  { code: '663',  libelle: 'Prestations sociales directes',   groupe: 'Personnel' },
  // ── Autres charges ─────────────────────────────────────────────────────────
  { code: '658',  libelle: 'Charges diverses',                groupe: 'Autres charges' },
  { code: '681',  libelle: 'Dotations aux amortissements',    groupe: 'Autres charges' },
] as const

export const COMPTES_TRESORERIE = [
  { code: '571',  libelle: 'Caisse (espèces)' },
  { code: '521',  libelle: 'Banque' },
  { code: '5211', libelle: 'Fonds Wave' },
  { code: '5212', libelle: 'Fonds Orange Money' },
  { code: '5213', libelle: 'Fonds MTN MoMo' },
  { code: '5214', libelle: 'Fonds Moov Money' },
] as const

export const MODES_PAIEMENT = [
  { value: 'ESPECES',      label: 'Espèces' },
  { value: 'VIREMENT',     label: 'Virement bancaire' },
  { value: 'CHEQUE',       label: 'Chèque' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
] as const

// Compte produits (Classe 7)
export const COMPTE_COMMISSION_DEPOT   = { code: '7061', libelle: 'Commissions sur dépôts' }
export const COMPTE_COMMISSION_RETRAIT = { code: '7062', libelle: 'Commissions sur retraits' }
export const COMPTE_CAISSE             = { code: '571',  libelle: 'Caisse' }

// Mapping nom réseau → compte float SYSCOHADA
export function getCompteReseau(nomReseau: string): { code: string; libelle: string } {
  const n = nomReseau.toLowerCase()
  if (n.includes('wave'))   return { code: '5211', libelle: 'Fonds Wave' }
  if (n.includes('orange')) return { code: '5212', libelle: 'Fonds Orange Money' }
  if (n.includes('mtn'))    return { code: '5213', libelle: 'Fonds MTN MoMo' }
  if (n.includes('moov'))   return { code: '5214', libelle: 'Fonds Moov Money' }
  return { code: '521', libelle: 'Fonds Mobile Money' }
}

// ── Types d'écritures générées ────────────────────────────────────────────────

export interface LigneJournal {
  date: string           // ISO date
  reference: string
  libelle: string
  compteDebit:  { code: string; libelle: string }
  compteCredit: { code: string; libelle: string }
  montant: number
  source: 'TRANSACTION' | 'DEPENSE'
}

export interface TauxMap {
  [reseauId: string]: { taux_depot: number; taux_retrait: number }
}

export interface TransactionRow {
  id: string
  type: 'DEPOT' | 'RETRAIT'
  montant: number
  reseau_id: string
  point_de_vente_id: string
  created_at: string
  reseaux: { nom: string; couleur: string }
  points_de_vente: { nom: string } | null
}

export interface DepenseRow {
  id: string
  date_depense: string
  libelle: string
  montant: number
  compte_code: string
  compte_libelle: string
  compte_contrepartie: string
  libelle_contrepartie: string
  point_de_vente_id: string | null
  mode_paiement: string
  note: string | null
  created_at: string
  points_de_vente: { nom: string } | null
}

// ── Génération des écritures du journal ───────────────────────────────────────

export function transactionToLignes(tx: TransactionRow, taux: TauxMap): LigneJournal[] {
  const reseau = getCompteReseau(tx.reseaux.nom)
  const rate = tx.type === 'DEPOT'
    ? (taux[tx.reseau_id]?.taux_depot ?? 0)
    : (taux[tx.reseau_id]?.taux_retrait ?? 0)
  const commission = Math.round(tx.montant * rate)
  const lignes: LigneJournal[] = []
  const ref = `TX-${tx.id.slice(0, 8).toUpperCase()}`

  if (tx.type === 'DEPOT') {
    lignes.push({
      date: tx.created_at,
      reference: ref,
      libelle: `Dépôt client — ${tx.reseaux.nom}`,
      compteDebit:  COMPTE_CAISSE,
      compteCredit: reseau,
      montant: tx.montant,
      source: 'TRANSACTION',
    })
    if (commission > 0) {
      lignes.push({
        date: tx.created_at,
        reference: ref + '-C',
        libelle: `Commission dépôt — ${tx.reseaux.nom}`,
        compteDebit:  reseau,
        compteCredit: COMPTE_COMMISSION_DEPOT,
        montant: commission,
        source: 'TRANSACTION',
      })
    }
  } else {
    lignes.push({
      date: tx.created_at,
      reference: ref,
      libelle: `Retrait client — ${tx.reseaux.nom}`,
      compteDebit:  reseau,
      compteCredit: COMPTE_CAISSE,
      montant: tx.montant,
      source: 'TRANSACTION',
    })
    if (commission > 0) {
      lignes.push({
        date: tx.created_at,
        reference: ref + '-C',
        libelle: `Commission retrait — ${tx.reseaux.nom}`,
        compteDebit:  reseau,
        compteCredit: COMPTE_COMMISSION_RETRAIT,
        montant: commission,
        source: 'TRANSACTION',
      })
    }
  }

  return lignes
}

export function depenseToLigne(dep: DepenseRow): LigneJournal {
  return {
    date: dep.date_depense + 'T00:00:00',
    reference: `DEP-${dep.id.slice(0, 8).toUpperCase()}`,
    libelle: dep.libelle,
    compteDebit:  { code: dep.compte_code, libelle: dep.compte_libelle },
    compteCredit: { code: dep.compte_contrepartie, libelle: dep.libelle_contrepartie },
    montant: dep.montant,
    source: 'DEPENSE',
  }
}

// ── Balance des comptes ────────────────────────────────────────────────────────

export interface LigneBalance {
  code: string
  libelle: string
  totalDebit: number
  totalCredit: number
  soldeDebiteur: number
  soldeCrediteur: number
}

export function computeBalance(lignes: LigneJournal[]): LigneBalance[] {
  const map: Record<string, { libelle: string; debit: number; credit: number }> = {}

  const add = (code: string, libelle: string, debit: number, credit: number) => {
    if (!map[code]) map[code] = { libelle, debit: 0, credit: 0 }
    map[code].debit  += debit
    map[code].credit += credit
  }

  lignes.forEach(l => {
    add(l.compteDebit.code,  l.compteDebit.libelle,  l.montant, 0)
    add(l.compteCredit.code, l.compteCredit.libelle, 0, l.montant)
  })

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, { libelle, debit, credit }]) => ({
      code,
      libelle,
      totalDebit:     debit,
      totalCredit:    credit,
      soldeDebiteur:  debit > credit ? debit - credit : 0,
      soldeCrediteur: credit > debit ? credit - debit : 0,
    }))
}

// ── Compte de résultat ────────────────────────────────────────────────────────

export interface ResultatData {
  produits: Array<{ code: string; libelle: string; montant: number }>
  charges:  Array<{ code: string; libelle: string; montant: number }>
  totalProduits: number
  totalCharges:  number
  resultatNet:   number
}

export function computeResultat(balance: LigneBalance[]): ResultatData {
  const produits = balance
    .filter(l => l.code.startsWith('7'))
    .map(l => ({ code: l.code, libelle: l.libelle, montant: l.soldeCrediteur - l.soldeDebiteur }))
    .filter(l => l.montant !== 0)

  const charges = balance
    .filter(l => l.code.startsWith('6'))
    .map(l => ({ code: l.code, libelle: l.libelle, montant: l.soldeDebiteur - l.soldeCrediteur }))
    .filter(l => l.montant !== 0)

  const totalProduits = produits.reduce((s, l) => s + l.montant, 0)
  const totalCharges  = charges.reduce((s, l) => s + l.montant, 0)

  return { produits, charges, totalProduits, totalCharges, resultatNet: totalProduits - totalCharges }
}
