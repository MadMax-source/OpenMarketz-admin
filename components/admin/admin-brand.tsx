import Link from "next/link"
import { StoreIcon } from "lucide-react"

export function AdminBrand() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <StoreIcon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">OpenMarketz</span>
        <span className="text-xs text-muted-foreground">Admin console</span>
      </span>
    </Link>
  )
}
