'use client'

import { useRef, useState, useTransition, useCallback } from 'react'
import { uploadAvatar, supprimerAvatar } from '@/lib/actions/parametres'
import { Camera, Trash2, Loader2, ZoomIn, ZoomOut, Check, X } from 'lucide-react'
import Image from 'next/image'

interface Props {
  userId: string
  nom: string
  avatarUrl: string | null
}

const PREVIEW_PX = 224  // taille du cercle de prévisualisation (w-56)
const OUTPUT_PX  = 400  // taille de l'image finale (canvas)

export default function AvatarUpload({ nom, avatarUrl }: Props) {
  const [current,  setCurrent]  = useState<string | null>(avatarUrl)
  const [cropData, setCropData] = useState<{ objectUrl: string; file: File } | null>(null)
  const [zoom,     setZoomRaw]  = useState(1)
  const [offset,   setOffset]   = useState({ x: 0, y: 0 })
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)
  const [uploading,  setUploading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Drag state — refs pour éviter les re-renders pendant le glissement
  const isDragging  = useRef(false)
  const dragOrigin  = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  const initial = nom?.charAt(0)?.toUpperCase() ?? '?'
  const loading = uploading || isPending

  // ── Calcule la limite de déplacement pour éviter les bords vides ──────────
  const maxOffset = useCallback((z: number, nat: { w: number; h: number } | null) => {
    if (!nat) return { x: 0, y: 0 }
    const base = Math.max(PREVIEW_PX / nat.w, PREVIEW_PX / nat.h)
    const iw   = nat.w * base * z
    const ih   = nat.h * base * z
    return { x: (iw - PREVIEW_PX) / 2, y: (ih - PREVIEW_PX) / 2 }
  }, [])

  const clamp = useCallback((ox: number, oy: number, z: number, nat: typeof imgNatural) => {
    const lim = maxOffset(z, nat)
    return { x: Math.max(-lim.x, Math.min(lim.x, ox)), y: Math.max(-lim.y, Math.min(lim.y, oy)) }
  }, [maxOffset])

  const setZoom = (z: number) => {
    const clamped = Math.max(1, Math.min(3, z))
    setZoomRaw(clamped)
    setOffset(prev => clamp(prev.x, prev.y, clamped, imgNatural))
  }

  // ── Sélection fichier ─────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null); setSuccess(null)
    setZoomRaw(1); setOffset({ x: 0, y: 0 }); setImgNatural(null)
    setCropData({ objectUrl: URL.createObjectURL(file), file })
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Drag souris ────────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const { mx, my, ox, oy } = dragOrigin.current
    setOffset(clamp(ox + e.clientX - mx, oy + e.clientY - my, zoom, imgNatural))
  }
  const onMouseUp = () => { isDragging.current = false }

  // ── Drag tactile ───────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    isDragging.current = true
    dragOrigin.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!isDragging.current) return
    const t = e.touches[0]
    const { mx, my, ox, oy } = dragOrigin.current
    setOffset(clamp(ox + t.clientX - mx, oy + t.clientY - my, zoom, imgNatural))
  }
  const onTouchEnd = () => { isDragging.current = false }

  // ── Confirmer : canvas → blob → server action ──────────────────────────────
  const confirmerCrop = async () => {
    if (!cropData) return
    setUploading(true); setError(null)
    try {
      const blob = await cropToBlob(cropData.objectUrl, zoom, offset, imgNatural)
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' })
      const fd   = new FormData()
      fd.append('avatar', file)

      // Fermer le modal immédiatement
      URL.revokeObjectURL(cropData.objectUrl)
      setCropData(null)

      startTransition(async () => {
        const res = await uploadAvatar({}, fd)
        if (res.error) setError(res.error)
        else if (res.url) { setCurrent(res.url); setSuccess('Photo de profil mise à jour') }
        setUploading(false)
      })
    } catch (err) {
      setError((err as Error).message ?? "Erreur lors du traitement")
      setUploading(false)
    }
  }

  const annulerCrop = () => {
    if (cropData) URL.revokeObjectURL(cropData.objectUrl)
    setCropData(null); setZoomRaw(1); setOffset({ x: 0, y: 0 })
  }

  const handleSupprimer = () => {
    setError(null); setSuccess(null)
    startTransition(async () => {
      const res = await supprimerAvatar({}, new FormData())
      if (res.error) setError(res.error)
      else { setCurrent(null); setSuccess('Photo supprimée') }
    })
  }

  return (
    <>
      {/* ── Avatar courant ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div
            className="w-24 h-24 rounded-full overflow-hidden cursor-pointer ring-4 ring-white shadow-lg transition-transform duration-200 group-hover:scale-105"
            onClick={() => !loading && inputRef.current?.click()}
          >
            {current ? (
              <Image src={current} alt={nom} width={96} height={96} className="w-full h-full object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-700 leading-none">{initial}</span>
              </div>
            )}
            {!loading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} disabled={loading} />
        </div>

        {error   && <p className="text-sm text-red-600 text-center">{error}</p>}
        {success && <p className="text-sm text-green-600 text-center">{success}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <Camera className="w-3.5 h-3.5" />
            {current ? 'Changer' : 'Ajouter une photo'}
          </button>
          {current && (
            <button type="button" onClick={handleSupprimer} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">JPG, PNG ou WebP · Max 5 Mo</p>
      </div>

      {/* ── Modal recadrage ────────────────────────────────────────────────── */}
      {cropData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Positionner la photo</h3>
              <button onClick={annulerCrop} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-5 px-5 py-6">
              {/* Hint */}
              <p className="text-xs text-gray-400 text-center">
                Maintenez et glissez pour repositionner · Utilisez le curseur pour agrandir
              </p>

              {/* Zone de recadrage interactive */}
              <div
                className="w-56 h-56 rounded-full overflow-hidden border-4 border-blue-100 shadow-inner bg-gray-100 relative select-none"
                style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cropData.objectUrl}
                  alt="Aperçu"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                    transition: isDragging.current ? 'none' : 'transform 0.05s',
                  }}
                  onLoad={e => {
                    const img = e.currentTarget
                    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
                  }}
                />
              </div>

              {/* Slider zoom */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                  <span>Taille</span>
                  <span className="tabular-nums text-blue-600">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setZoom(zoom - 0.1)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input type="range" min={1} max={3} step={0.05} value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer" />
                  <button type="button" onClick={() => setZoom(zoom + 0.1)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Vue complète</span>
                  <span>Recadré serré</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button type="button" onClick={annulerCrop}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="button" onClick={confirmerCrop} disabled={uploading}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {uploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</>
                  : <><Check className="w-4 h-4" /> Enregistrer</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Canvas : recadre l'image en tenant compte de l'offset de glissement ────────
async function cropToBlob(
  objectUrl: string,
  zoom: number,
  offset: { x: number; y: number },
  nat: { w: number; h: number } | null,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = OUTPUT_PX
      canvas.height = OUTPUT_PX
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas non supporté'))

      // Reproduire le même rendu que la prévisualisation, mis à l'échelle vers OUTPUT_PX
      const pxRatio  = OUTPUT_PX / PREVIEW_PX
      const baseScale = Math.max(OUTPUT_PX / img.naturalWidth, OUTPUT_PX / img.naturalHeight)
      const scale     = baseScale * zoom
      const w = img.naturalWidth  * scale
      const h = img.naturalHeight * scale

      // L'offset est en pixels de prévisualisation → convertir en pixels canvas
      const cx = -(w - OUTPUT_PX) / 2 + offset.x * pxRatio
      const cy = -(h - OUTPUT_PX) / 2 + offset.y * pxRatio

      ctx.drawImage(img, cx, cy, w, h)

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Conversion échouée')),
        'image/jpeg',
        0.88,
      )
    }
    img.onerror = () => reject(new Error("Impossible de charger l'image"))
    img.src = objectUrl
  })
}
