import { Skeleton } from "@/components/ui/skeleton"

export function AdminDashboardSkeleton() {
  return (
    <div className="flex min-h-svh" role="status" aria-label="Loading admin dashboard">
      <div className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 lg:flex">
        <Skeleton className="h-8 w-36" />
        <div className="flex flex-col gap-2 pt-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <div className="flex flex-col gap-6 p-6">
          <Skeleton className="h-8 w-64" />
          <AdminStatsSkeleton />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function AdminStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}

export function AdminTableSkeleton({ rows = 6, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4" role="status" aria-label={label}>
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  )
}

export function AdminListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
