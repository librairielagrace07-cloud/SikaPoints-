import { Skeleton } from '@/components/ui/skeleton'

export default function NotificationsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-44 mb-2" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
            <Skeleton className="w-10 h-10 rounded-full shrink-0 mt-0.5" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="w-2 h-2 rounded-full mt-2 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
