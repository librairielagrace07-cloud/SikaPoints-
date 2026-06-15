'use client'

import { useEffect, useState } from 'react'
import { useTheme, type Theme } from '@/lib/providers/theme-provider'
import { Sun, Moon, Check, Mic } from 'lucide-react'

const OPTIONS: { value: Theme; label: string; desc: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  {
    value: 'light',
    label: 'Mode clair',
    desc: 'Interface lumineuse, fond blanc',
    Icon: Sun,
  },
  {
    value: 'dark',
    label: 'Mode sombre',
    desc: 'Repose les yeux, fond sombre',
    Icon: Moon,
  },
]

export default function ThemeSection() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  useEffect(() => {
    setMounted(true)
    setVoiceEnabled(localStorage.getItem('voice_input_enabled') === 'true')
  }, [])

  function toggleVoice() {
    const next = !voiceEnabled
    setVoiceEnabled(next)
    localStorage.setItem('voice_input_enabled', String(next))
  }

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 animate-pulse bg-gray-100 rounded-xl" />
        <div className="h-28 animate-pulse bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(({ value, label, desc, Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-left ${
                active
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Check badge */}
              {active && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Aperçu mini */}
              <div className={`w-full rounded-lg overflow-hidden border ${active ? 'border-blue-200' : 'border-gray-200'}`}>
                {value === 'light' ? <LightPreview /> : <DarkPreview />}
              </div>

              {/* Icône + texte */}
              <div className="flex items-center gap-2 self-start">
                <div className={`p-1.5 rounded-lg ${active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-400">
        La préférence est sauvegardée localement sur cet appareil.
      </p>

      {/* Toggle saisie vocale */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${voiceEnabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Mic className={`w-4 h-4 ${voiceEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Saisie vocale</p>
              <p className="text-xs text-gray-400">Dicter les champs du formulaire de transaction</p>
            </div>
          </div>
          <button
            onClick={toggleVoice}
            className={`relative w-11 h-6 rounded-full transition-colors ${voiceEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${voiceEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

function LightPreview() {
  return (
    <div className="bg-gray-50 p-2 space-y-1.5">
      <div className="flex gap-1.5">
        <div className="w-8 bg-blue-600 rounded h-5" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 bg-gray-300 rounded w-3/4" />
          <div className="h-1 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="bg-white rounded p-1.5 space-y-1">
        <div className="h-1.5 bg-gray-200 rounded w-full" />
        <div className="h-1.5 bg-gray-200 rounded w-5/6" />
        <div className="h-1.5 bg-blue-100 rounded w-2/3" />
      </div>
    </div>
  )
}

function DarkPreview() {
  return (
    <div className="bg-slate-900 p-2 space-y-1.5">
      <div className="flex gap-1.5">
        <div className="w-8 bg-blue-500 rounded h-5" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 bg-slate-500 rounded w-3/4" />
          <div className="h-1 bg-slate-600 rounded w-1/2" />
        </div>
      </div>
      <div className="bg-slate-800 rounded p-1.5 space-y-1">
        <div className="h-1.5 bg-slate-600 rounded w-full" />
        <div className="h-1.5 bg-slate-600 rounded w-5/6" />
        <div className="h-1.5 bg-blue-900 rounded w-2/3" />
      </div>
    </div>
  )
}
