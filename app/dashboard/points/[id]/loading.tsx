import { Skeleton } from '@/components/ui/skeleton'

export default function PointDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      {/* UV cards */}
      <div>
        <Skeleton className="h-5 w-36 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-2 w-full rounded-full mb-2" />
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
      {/* Agents */}
      <div>
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-36 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
