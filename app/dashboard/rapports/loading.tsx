import { Skeleton } from '@/components/ui/skeleton'

export default function RapportsLoading() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-7 w-36 mb-2" />
        <Skeleton className="h-4 w-52" />
      </div>
      {/* Barre de contrôle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-16 rounded-lg" />)}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      </div>
      {/* Cartes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
      {/* Graphique */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <Skeleton className="h-5 w-56 mb-4" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}
