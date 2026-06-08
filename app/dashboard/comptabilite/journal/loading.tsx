import { Skeleton, SkeletonTable } from '@/components/ui/skeleton'

export default function JournalLoading() {
  return (
    <div className="space-y-5">
      <div><Skeleton className="h-7 w-56 mb-2" /><Skeleton className="h-4 w-64" /></div>
      <SkeletonTable rows={8} cols={6} />
    </div>
  )
}
