"use client"

import { useMemo } from "react"
import { InboxIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminError } from "@/components/admin/admin-error"
import { AdminListSkeleton } from "@/components/admin/admin-loading"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { SupportNoSelection, SupportTicketDetail } from "@/components/admin/support-ticket-detail"
import { SupportTicketList } from "@/components/admin/support-ticket-list"
import { useAdminSupportTickets, useUrlParam } from "@/lib/admin-hooks"
import { TICKET_STATUSES } from "@/lib/admin-types"
import {
  humanize,
  ticketCustomerName,
  ticketEmail,
  ticketNumber,
  ticketTopic,
  timestamp,
} from "@/lib/admin-format"
import { cn } from "@/lib/utils"

const STATUS_FILTERS = [{ value: "all", label: "All statuses" }, ...TICKET_STATUSES.map((s) => ({ value: s, label: humanize(s) }))]
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
]

export function AdminSupport() {
  const { data, error, isLoading, isValidating, mutate } = useAdminSupportTickets()
  const [query, setQuery] = useUrlParam("q")
  const [status, setStatus] = useUrlParam("status", "all")
  const [sort, setSort] = useUrlParam("sort", "newest")
  const [selectedId, setSelectedId] = useUrlParam("ticket")

  const tickets = useMemo(() => data ?? [], [data])

  const counts = useMemo(() => {
    const result: Record<string, number> = {}
    for (const ticket of tickets) result[ticket.status] = (result[ticket.status] ?? 0) + 1
    return result
  }, [tickets])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return tickets
      .filter((ticket) => {
        if (status !== "all" && ticket.status !== status) return false
        if (!term) return true
        return [ticketNumber(ticket), ticketCustomerName(ticket), ticketEmail(ticket), ticketTopic(ticket)]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term))
      })
      .sort((a, b) => {
        const diff = timestamp(b.createdAt) - timestamp(a.createdAt)
        return sort === "oldest" ? -diff : diff
      })
  }, [query, sort, status, tickets])

  return (
    <>
      <AdminPageHeader
        title="Support inbox"
        description="Respond to customer tickets, update their status, and follow linked orders."
      />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Ticket counts">
        <li>
          <CountTile label="All tickets" value={data ? tickets.length : undefined} active={status === "all"} onClick={() => setStatus(null)} />
        </li>
        {TICKET_STATUSES.map((item) => (
          <li key={item}>
            <CountTile
              label={humanize(item)}
              value={data ? (counts[item] ?? 0) : undefined}
              active={status === item}
              onClick={() => setStatus(item)}
            />
          </li>
        ))}
      </ul>

      <div className="flex min-h-[640px] overflow-hidden rounded-xl border bg-card lg:h-[calc(100svh-18rem)]">
        <section
          aria-label="Ticket list"
          className={cn("flex w-full min-w-0 flex-col border-r lg:w-96 lg:shrink-0", selectedId && "hidden lg:flex")}
        >
          <div className="flex flex-col gap-3 border-b p-4">
            <Field>
              <FieldLabel htmlFor="ticket-search" className="sr-only">
                Search tickets
              </FieldLabel>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ticket-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ticket number, name, email, topic"
                  className="pl-8"
                />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel htmlFor="ticket-status-filter" className="sr-only">
                  Status filter
                </FieldLabel>
                <Select items={STATUS_FILTERS} value={status} onValueChange={(value) => setStatus(value as string)}>
                  <SelectTrigger id="ticket-status-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATUS_FILTERS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="ticket-sort" className="sr-only">
                  Sort order
                </FieldLabel>
                <Select items={SORT_OPTIONS} value={sort} onValueChange={(value) => setSort(value as string)}>
                  <SelectTrigger id="ticket-sort" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4">
                <AdminListSkeleton rows={6} />
              </div>
            ) : error ? (
              <div className="p-4">
                <AdminError error={error} title="Unable to load tickets" onRetry={() => mutate()} retrying={isValidating} />
              </div>
            ) : filtered.length === 0 ? (
              <AdminEmptyState
                icon={InboxIcon}
                title={tickets.length ? "No matching tickets" : "Inbox is empty"}
                description={tickets.length ? "Try a different search or filter." : "New customer tickets will appear here."}
                className="rounded-none border-0"
              >
                {tickets.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery(null)
                      setStatus(null)
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </AdminEmptyState>
            ) : (
              <SupportTicketList tickets={filtered} selectedId={selectedId || null} onSelect={setSelectedId} />
            )}
          </div>
        </section>

        <section aria-label="Ticket detail" className={cn("min-w-0 flex-1 flex-col", selectedId ? "flex" : "hidden lg:flex")}>
          {selectedId ? (
            <SupportTicketDetail
              key={selectedId}
              ticketId={selectedId}
              onBack={() => setSelectedId(null)}
              onChanged={() => mutate()}
            />
          ) : (
            <SupportNoSelection />
          )}
        </section>
      </div>
    </>
  )
}

function CountTile({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full flex-col gap-1 rounded-xl border bg-card px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "border-primary/50 bg-primary/5",
      )}
    >
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value ?? "—"}</span>
    </button>
  )
}
