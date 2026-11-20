import Link from "next/link"
import { ArrowRightIcon, type LucideIcon } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminStatCardProps {
  label: string
  icon: LucideIcon
  value?: number | null
  loading?: boolean
  unavailableMessage?: string
  errorMessage?: string
  hint?: string
  href?: string
}

export function AdminStatCard({
  label,
  icon: Icon,
  value,
  loading,
  unavailableMessage,
  errorMessage,
  hint,
  href,
}: AdminStatCardProps) {
  const unavailable = unavailableMessage !== undefined

  return (
    <Card size="sm" className="relative">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardAction>
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </CardAction>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : unavailable || errorMessage || value === null || value === undefined ? (
            <span className="text-muted-foreground" aria-label="Unavailable">
              —
            </span>
          ) : (
            value.toLocaleString()
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground text-pretty">
          {unavailableMessage ?? errorMessage ?? hint}
        </p>
        {href && !unavailable && (
          <Link
            href={href}
            className="flex w-fit items-center gap-1 text-xs font-medium text-primary after:absolute after:inset-0 hover:underline"
          >
            View details
            <ArrowRightIcon className="size-3" aria-hidden="true" />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
