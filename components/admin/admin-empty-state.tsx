import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

interface AdminEmptyStateProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  children?: ReactNode
  className?: string
}

export function AdminEmptyState({ icon: Icon, title, description, children, className }: AdminEmptyStateProps) {
  return (
    <Empty className={cn("rounded-xl border bg-card", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  )
}
