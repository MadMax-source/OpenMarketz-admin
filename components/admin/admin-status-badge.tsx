import { Badge } from "@/components/ui/badge"
import { humanize } from "@/lib/admin-format"
import { cn } from "@/lib/utils"

type Tone = "success" | "warning" | "info" | "danger" | "neutral"

const TONES: Record<string, Tone> = {
  APPROVED: "success",
  ACTIVE: "success",
  DELIVERED: "success",
  RESOLVED: "success",
  PAID: "success",
  SUCCEEDED: "success",
  COMPLETED: "success",
  CONFIRMED: "info",
  PENDING: "warning",
  SUBMITTED: "warning",
  UNDER_REVIEW: "warning",
  IN_REVIEW: "warning",
  PENDING_PAYMENT: "warning",
  WAITING_FOR_CUSTOMER: "warning",
  OPEN: "info",
  IN_PROGRESS: "info",
  PLACED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "info",
  IN_TRANSIT: "info",
  REJECTED: "danger",
  CANCELLED: "danger",
  FAILED: "danger",
  REFUNDED: "neutral",
  CLOSED: "neutral",
}

const DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground",
}

export function AdminStatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return <span className="text-sm text-muted-foreground">—</span>
  const tone = TONES[status.toUpperCase()] ?? "neutral"
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", className)}>
      <span className={cn("size-1.5 rounded-full", DOT[tone])} aria-hidden="true" />
      {humanize(status)}
    </Badge>
  )
}
