"use client"

import type { SupportTicket } from "@/lib/admin-types"
import {
  formatDate,
  ticketCustomerName,
  ticketEmail,
  ticketNumber,
  ticketTopic,
} from "@/lib/admin-format"
import { cn } from "@/lib/utils"
import { AdminStatusBadge } from "./admin-status-badge"

interface SupportTicketListProps {
  tickets: SupportTicket[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function SupportTicketList({ tickets, selectedId, onSelect }: SupportTicketListProps) {
  return (
    <ul className="flex flex-col divide-y" aria-label="Support tickets">
      {tickets.map((ticket) => {
        const active = ticket.id === selectedId
        return (
          <li key={ticket.id}>
            <button
              type="button"
              onClick={() => onSelect(ticket.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex w-full flex-col gap-1.5 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                active && "bg-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">{ticketNumber(ticket)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(ticket.updatedAt ?? ticket.createdAt)}
                </span>
              </div>
              <span className="truncate text-sm font-medium">{ticketCustomerName(ticket)}</span>
              <span className="truncate text-xs text-muted-foreground">
                {ticketTopic(ticket)}
                {ticketEmail(ticket) ? ` · ${ticketEmail(ticket)}` : ""}
              </span>
              <AdminStatusBadge status={ticket.status} className="mt-0.5" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
