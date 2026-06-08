import { Skeleton } from '@/components/ui/skeleton'

export default function ParametresLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Skeleton className="h-7 w-44 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: i === 0 ? 1 : 2 }).map((_, j) => (
              <div key={j}>
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
