'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import { Eye, EyeOff, MailCheck } from 'lucide-react'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, {})
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm

  // Écran de confirmation après inscription réussie
  if (state.success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Vérifiez votre boîte mail
        </h2>
        <p className="text-sm text-gray-500 mb-2">
          Un lien de confirmation a été envoyé à votre adresse email.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Cliquez sur le lien dans l'email pour activer votre compte et accéder au tableau de bord.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left">
          <p className="text-xs text-amber-700 font-medium mb-1">Vous ne trouvez pas l'email ?</p>
          <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
            <li>Vérifiez votre dossier Spam ou Courrier indésirable</li>
            <li>Le délai d'envoi peut prendre quelques minutes</li>
          </ul>
        </div>

        <Link
          href="/login"
          className="block w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Aller à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Créer un compte</h2>

      {state.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="nom_complet" className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet
          </label>
          <input
            id="nom_complet"
            name="nom_complet"
            type="text"
            required
            maxLength={100}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Jean-Luc Konan"
          />
        </div>

        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone <span className="text-gray-400">(optionnel)</span>
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            maxLength={20}
            pattern="[\d\s\+\-\(\)\.]+"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+225 07 00 00 00 00"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="vous@exemple.com"
          />
        </div>

        {/* Mot de passe */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPwd ? 'text' : 'password'}
              required
              minLength={6}
              maxLength={100}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Au moins 6 caractères"
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirmation mot de passe */}
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              id="confirm_password"
              name="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              required
              maxLength={100}
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                mismatch
                  ? 'border-red-400 focus:ring-red-400'
                  : confirm.length > 0 && !mismatch
                    ? 'border-green-400 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Répétez votre mot de passe"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mismatch && (
            <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas</p>
          )}
          {confirm.length > 0 && !mismatch && (
            <p className="mt-1 text-xs text-green-600">Les mots de passe correspondent</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending || mismatch || password.length < 6}
          className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
