import { Skeleton } from '@/components/ui/skeleton'

export default function AgentsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 mb-1.5" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
