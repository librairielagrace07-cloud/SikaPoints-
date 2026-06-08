import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import Logo from '@/components/ui/logo'

const NOMS: Record<string, string> = {
  solo: 'Solo', croissance: 'Croissance', business: 'Business',
}

export default async function PaiementSuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo className="h-12 w-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement réussi !</h1>
          <p className="text-gray-500 mb-1">
            Votre abonnement{plan && NOMS[plan] ? ` Plan ${NOMS[plan]}` : ''} est en cours d'activation.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Votre tableau de bord sera mis à jour dans quelques instants.
          </p>

          <Link
            href="/dashboard"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-center"
          >
            Accéder au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
