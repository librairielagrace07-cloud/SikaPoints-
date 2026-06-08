import { Skeleton } from '@/components/ui/skeleton'

export default function ComptabiliteLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-7 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full rounded" />)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
