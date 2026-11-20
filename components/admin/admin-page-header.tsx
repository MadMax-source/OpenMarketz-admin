import type { ReactNode } from "react"

interface AdminPageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}

export function AdminPageHeader({ title, description, actions, meta }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
          {meta}
        </div>
        {description && <p className="max-w-2xl text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
