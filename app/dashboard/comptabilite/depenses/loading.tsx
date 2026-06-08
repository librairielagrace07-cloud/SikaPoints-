import { Skeleton, SkeletonTable } from '@/components/ui/skeleton'

export default function DepensesLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-7 w-32 mb-2" /><Skeleton className="h-4 w-56" /></div>
        <Skeleton className="h-9 w-40 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-48 rounded-lg" />
      <SkeletonTable rows={5} cols={5} />
    </div>
  )
}
