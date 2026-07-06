export function ProductSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="skeleton aspect-square" />
          <div className="p-3 space-y-2">
            <div className="skeleton h-3 rounded w-2/3" />
            <div className="skeleton h-4 rounded w-full" />
            <div className="skeleton h-3 rounded w-1/2" />
            <div className="skeleton h-7 rounded-xl w-3/4 mt-2" />
            <div className="skeleton h-10 rounded-xl w-full mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}
