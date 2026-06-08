import { Skeleton, SkeletonTable } from '@/components/ui/skeleton'

export default function BilanLoading() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-7 w-56 mb-2" /><Skeleton className="h-4 w-40" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
