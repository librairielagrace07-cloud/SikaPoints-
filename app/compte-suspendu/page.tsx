import { logout } from '@/lib/actions/auth'
import { ShieldOff } from 'lucide-react'

export default function CompteSuspenduPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Compte suspendu</h1>
        <p className="text-gray-500 text-sm mb-6">
          Votre accès a été suspendu. Contactez votre administrateur pour réactiver votre compte.
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
