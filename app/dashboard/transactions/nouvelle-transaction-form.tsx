'use client'

import { useActionState, useState, useEffect, useRef, startTransition } from 'react'
import { enregistrerTransaction } from '@/lib/actions/transactions'
import { createClient } from '@/lib/supabase/client'
import { addPendingTx } from '@/lib/offline/db'
import { useOffline } from '@/hooks/use-offline'
import { ArrowDownCircle, ArrowUpCircle, Plus, X, WifiOff, CloudOff, CheckCircle2, Mic, MicOff } from 'lucide-react'

const MONTANTS_RAPIDES = [5_000, 10_000, 20_000, 25_000, 50_000, 100_000, 200_000, 500_000]

interface Reseau { id: string; nom: string; couleur: string }
interface Point  { id: string; nom: string }
interface Agent  { id: string; nom_complet: string }

interface Props {
  points:              Point[]
  reseaux:             Reseau[]
  peut_deposer:        boolean
  peut_retirer:        boolean
  point_de_vente_fixe: string | null
  agent_id_fixe:       string | null
}

export default function NouvelleTransactionForm({
  points, reseaux, peut_deposer, peut_retirer, point_de_vente_fixe, agent_id_fixe,
}: Props) {
  const [open,            setOpen]           = useState(false)
  const [state, action, pending]            = useActionState(enregistrerTransaction, {})
  const [selectedPoint,   setSelectedPoint]  = useState(point_de_vente_fixe ?? '')
  const [selectedReseau,  setSelectedReseau] = useState('')
  const [agents,          setAgents]         = useState<Agent[]>([])
  const [offlineQueued,   setOfflineQueued]  = useState(false)
  const [offlineError,    setOfflineError]   = useState(false)
  const [voiceEnabled] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('voice_input_enabled') === 'true'
  )
  const [listeningFor,    setListeningFor]   = useState<string | null>(null)
  const { isOnline, refreshCount } = useOffline()

  const montantRef     = useRef<HTMLInputElement>(null)
  const teleRef        = useRef<HTMLInputElement>(null)
  const refTxRef       = useRef<HTMLInputElement>(null)
  const numeroPieceRef = useRef<HTMLInputElement>(null)
  const noteRef        = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const isVoiceSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const defaultType = peut_deposer ? 'DEPOT' : 'RETRAIT'

  // Réseau actuellement sélectionné (objet complet)
  const reseauChoisi = reseaux.find(r => r.id === selectedReseau) ?? null
  const isWave = reseauChoisi?.nom?.toLowerCase() === 'wave'

  useEffect(() => {
    if (!selectedPoint) return
    const supabase = createClient()
    supabase
      .from('agents')
      .select('id, nom_complet')
      .eq('point_de_vente_id', selectedPoint)
      .eq('actif', true)
      .then(({ data }) => setAgents(data ?? []))
  }, [selectedPoint])

  // Ferme le modal après une soumission en ligne réussie
  useEffect(() => {
    if (state.success) setTimeout(() => setOpen(false), 800)
  }, [state.success])

  function startVoice(field: string, ref: React.RefObject<HTMLInputElement | null>, digitsOnly = false) {
    if (!isVoiceSupported || !voiceEnabled) return
    if (listeningFor === field) {
      recognitionRef.current?.stop()
      setListeningFor(null)
      return
    }
    recognitionRef.current?.stop()
    const SR = (window.SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition)
    const rec = new SR()
    rec.lang = 'fr-FR'
    rec.interimResults = false
    rec.maxAlternatives = 1
    setListeningFor(field)
    rec.onresult = (e) => {
      let text = e.results[0][0].transcript
      if (digitsOnly) text = text.replace(/\D/g, '')
      if (ref.current) {
        ref.current.value = text
        ref.current.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
    rec.onend = () => setListeningFor(null)
    rec.onerror = () => setListeningFor(null)
    recognitionRef.current = rec
    rec.start()
  }

  const micBtn = (field: string, ref: React.RefObject<HTMLInputElement | null>, digitsOnly = false) => {
    if (!voiceEnabled || !isVoiceSupported) return null
    const active = listeningFor === field
    return (
      <button
        type="button"
        onClick={() => startVoice(field, ref, digitsOnly)}
        className={`ml-auto flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md transition-colors ${
          active ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
        }`}
      >
        {active ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
        {active ? 'Stop' : 'Voix'}
      </button>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    if (!navigator.onLine) {
      try {
        await addPendingTx({
          localId:           crypto.randomUUID(),
          point_de_vente_id: fd.get('point_de_vente_id') as string,
          reseau_id:         fd.get('reseau_id') as string,
          type:              fd.get('type') as 'DEPOT' | 'RETRAIT',
          montant:           Number(fd.get('montant')),
          note:              (fd.get('note') as string) || null,
          agent_id:          (fd.get('agent_id') as string) || null,
          created_at:        new Date().toISOString(),
        })
        await refreshCount()
        setOfflineQueued(true)
      } catch {
        setOfflineError(true)
      }
      return
    }

    startTransition(() => action(fd))
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Plus className="w-4 h-4" />
        Nouvelle transaction
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">

            {/* ── Écran de confirmation hors ligne ── */}
            {offlineQueued ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="relative mb-5">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
                    <CloudOff className="w-9 h-9 text-amber-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">Transaction sauvegardée</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Elle a été enregistrée localement sur cet appareil.
                </p>

                <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left space-y-2">
                  <div className="flex items-start gap-2">
                    <WifiOff className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800 font-medium">Mode hors ligne actif</p>
                  </div>
                  <p className="text-xs text-amber-700 pl-6">
                    La transaction sera automatiquement envoyée au serveur dès que la connexion internet sera rétablie.
                  </p>
                </div>

                <button
                  onClick={() => { setOfflineQueued(false); setOpen(false) }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Compris, fermer
                </button>
                <button
                  onClick={() => setOfflineQueued(false)}
                  className="mt-2 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Enregistrer une autre transaction
                </button>
              </div>
            ) : (
            <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Nouvelle transaction</h2>
                {!isOnline && (
                  <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    <WifiOff className="w-3 h-3" />
                    Hors ligne
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {state.error}
              </div>
            )}
            {state.success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                Transaction enregistrée !
              </div>
            )}
            {offlineError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                Impossible de sauvegarder hors ligne (stockage indisponible).
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                {peut_deposer && peut_retirer ? (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer has-checked:border-green-500 has-checked:bg-green-50">
                      <input type="radio" name="type" value="DEPOT" defaultChecked className="sr-only" />
                      <ArrowDownCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Dépôt</span>
                    </label>
                    <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer has-checked:border-orange-500 has-checked:bg-orange-50">
                      <input type="radio" name="type" value="RETRAIT" className="sr-only" />
                      <ArrowUpCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Retrait</span>
                    </label>
                  </div>
                ) : (
                  <div>
                    <input type="hidden" name="type" value={defaultType} />
                    <div className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 ${defaultType === 'DEPOT' ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
                      {defaultType === 'DEPOT'
                        ? <ArrowDownCircle className="w-4 h-4 text-green-600" />
                        : <ArrowUpCircle  className="w-4 h-4 text-orange-500" />
                      }
                      <span className="text-sm font-medium">{defaultType === 'DEPOT' ? 'Dépôt' : 'Retrait'}</span>
                      <span className="text-xs text-gray-400 ml-auto">(seule option autorisée)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Point de vente */}
              {point_de_vente_fixe ? (
                <>
                  <input type="hidden" name="point_de_vente_id" value={point_de_vente_fixe} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Point de vente</label>
                    <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600">
                      {points[0]?.nom ?? 'Votre point de vente'}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Point de vente *</label>
                  <select
                    name="point_de_vente_id"
                    required
                    value={selectedPoint}
                    onChange={e => setSelectedPoint(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir un point</option>
                    {points.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                </div>
              )}

              {/* Réseau */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Réseau *</label>
                <select
                  name="reseau_id"
                  required
                  value={selectedReseau}
                  onChange={e => setSelectedReseau(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir un réseau</option>
                  {reseaux.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
              </div>

              {/* Montant */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  Montant (FCFA) *
                  {micBtn('montant', montantRef, true)}
                </label>
                <input
                  ref={montantRef}
                  name="montant"
                  type="number"
                  min={1}
                  max={100000000}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 25000"
                />
                {/* Montants rapides */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {MONTANTS_RAPIDES.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        if (montantRef.current) montantRef.current.value = String(m)
                      }}
                      className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-full font-medium transition-colors"
                    >
                      {m >= 1000 ? `${m / 1000}k` : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Téléphone client — masqué pour Wave */}
              {!isWave && (
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    Numéro de téléphone client
                    {micBtn('telephone', teleRef, true)}
                  </label>
                  <input
                    ref={teleRef}
                    name="telephone_client"
                    type="tel"
                    maxLength={20}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 07 00 00 00 00"
                  />
                </div>
              )}

              {/* Pièce d'identité client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de pièce</label>
                  <select
                    name="type_piece"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Aucune —</option>
                    <option value="CNI">CNI</option>
                    <option value="PASSEPORT">Passeport</option>
                    <option value="PERMIS">Permis de conduire</option>
                    <option value="CARTE_CONSULAIRE">Carte consulaire</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    N° de pièce
                    {micBtn('numero_piece', numeroPieceRef)}
                  </label>
                  <input
                    ref={numeroPieceRef}
                    name="numero_piece"
                    type="text"
                    maxLength={50}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: CI0123456"
                  />
                </div>
              </div>

              {/* Référence / ID de transaction */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  ID de transaction
                  {reseauChoisi && (
                    <span className="ml-1 text-gray-400 font-normal text-xs">
                      ({reseauChoisi.nom})
                    </span>
                  )}
                  {micBtn('reference', refTxRef)}
                </label>
                <input
                  ref={refTxRef}
                  name="reference_transaction"
                  type="text"
                  maxLength={100}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: TXN-1234567890"
                />
              </div>

              {/* Agent */}
              {agent_id_fixe ? (
                <input type="hidden" name="agent_id" value={agent_id_fixe} />
              ) : (
                agents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                    <select name="agent_id" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Sélectionner —</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.nom_complet}</option>)}
                    </select>
                  </div>
                )
              )}

              {/* Note */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  Note
                  {micBtn('note', noteRef)}
                </label>
                <input
                  ref={noteRef}
                  name="note"
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optionnel"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending || offlineQueued}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
                    !isOnline
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {pending        ? 'Enregistrement...'
                   : offlineQueued ? 'Sauvegardé !'
                   : !isOnline     ? 'Sauvegarder hors ligne'
                   : 'Enregistrer'}
                </button>
              </div>

              {!isOnline && (
                <p className="text-xs text-amber-600 text-center -mt-1">
                  La transaction sera envoyée automatiquement à la reconnexion
                </p>
              )}
            </form>
            </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
