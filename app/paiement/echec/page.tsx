import Link from 'next/link'
import { XCircle } from 'lucide-react'
import Logo from '@/components/ui/logo'

export default async function PaiementEchecPage({
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
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement annulé</h1>
          <p className="text-gray-500 mb-8">
            Votre paiement n'a pas abouti. Vous pouvez réessayer à tout moment.
          </p>

          <div className="space-y-3">
            {plan && (
              <Link
                href={`/abonnement?plan=${plan}`}
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-center"
              >
                Réessayer le paiement
              </Link>
            )}
            <Link
              href="/#tarifs"
              className="block w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-center text-sm"
            >
              Voir tous les plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
