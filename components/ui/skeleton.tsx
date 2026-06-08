export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-36 mb-1" />
      <Skeleton className="h-2 w-16" />
    </div>
  )
}

const COL_WIDTHS  = ['w-16', 'w-20', 'w-24', 'w-28', 'w-32', 'w-36']
const ROW_WIDTHS  = ['w-14', 'w-20', 'w-28', 'w-16', 'w-24', 'w-32']

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex gap-8">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${COL_WIDTHS[i % COL_WIDTHS.length]}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-3 ${ROW_WIDTHS[(i + j) % ROW_WIDTHS.length]}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
