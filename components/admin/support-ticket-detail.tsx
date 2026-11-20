"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowLeftIcon, MessagesSquareIcon, SendIcon, ShoppingCartIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Message, MessageContent, MessageHeader } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useSupportTicket } from "@/lib/admin-hooks"
import { TICKET_STATUSES, type TicketStatus } from "@/lib/admin-types"
import {
  formatDateTime,
  humanize,
  isStaffReply,
  personName,
  replyText,
  ticketCustomerName,
  ticketEmail,
  ticketNumber,
  ticketOrderNumber,
  ticketReplies,
  ticketTopic,
} from "@/lib/admin-format"
import { ApiError, getErrorMessage, replyToSupportTicket, updateSupportTicketStatus } from "@/lib/api"
import { AdminConfirmDialog } from "./admin-confirm-dialog"
import { AdminEmptyState } from "./admin-empty-state"
import { AdminError } from "./admin-error"
import { AdminStatusBadge } from "./admin-status-badge"

const STATUS_ITEMS = TICKET_STATUSES.map((status) => ({ value: status, label: humanize(status) }))
const MAX_REPLY = 5000

interface SupportTicketDetailProps {
  ticketId: string
  onBack: () => void
  onChanged: () => void
}

export function SupportTicketDetail({ ticketId, onBack, onChanged }: SupportTicketDetailProps) {
  const { data: ticket, error, isLoading, isValidating, mutate } = useSupportTicket(ticketId)
  const [reply, setReply] = useState("")
  const [replyError, setReplyError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)

  const applyStatus = async (status: TicketStatus) => {
    if (!ticket || updatingStatus || status === ticket.status) return
    setUpdatingStatus(true)
    try {
      await updateSupportTicketStatus(ticket.id, status)
      toast.success(`Ticket marked as ${humanize(status).toLowerCase()}.`)
      setPendingClose(false)
      await mutate()
      onChanged()
    } catch (err) {
      toast.error(getErrorMessage(err, "The status could not be updated."))
      if (err instanceof ApiError && err.status === 409) await mutate()
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleStatusChange = (value: string | null) => {
    if (!value) return
    if (value === "CLOSED") setPendingClose(true)
    else applyStatus(value as TicketStatus)
  }

  const sendReply = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!ticket || sending) return
    const message = reply.trim()
    if (!message) {
      setReplyError("Write a reply before sending.")
      return
    }
    setReplyError(null)
    setSending(true)
    try {
      await replyToSupportTicket(ticket.id, message)
      setReply("")
      toast.success("Reply sent.")
      await mutate()
      onChanged()
    } catch (err) {
      setReplyError(getErrorMessage(err, "The reply could not be sent."))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) sendReply()
  }

  const backButton = (
    <Button variant="ghost" size="sm" className="w-fit lg:hidden" onClick={onBack}>
      <ArrowLeftIcon data-icon="inline-start" />
      All tickets
    </Button>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4" role="status" aria-label="Loading ticket">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="ml-auto h-16 w-2/3" />
        <Skeleton className="h-16 w-2/3" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {backButton}
        <AdminError error={error} title="Unable to load ticket" onRetry={() => mutate()} retrying={isValidating} />
      </div>
    )
  }

  const replies = ticketReplies(ticket)
  const orderRef = ticketOrderNumber(ticket)
  const orderId = ticket.order?.id ?? ticket.orderId
  const closed = ticket.status === "CLOSED"

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b p-4">
        {backButton}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold">{ticketTopic(ticket)}</h2>
              <AdminStatusBadge status={ticket.status} />
            </div>
            <p className="truncate text-sm text-muted-foreground">
              <span className="font-mono">{ticketNumber(ticket)}</span> · {ticketCustomerName(ticket)}
              {ticketEmail(ticket) ? ` · ${ticketEmail(ticket)}` : ""}
            </p>
          </div>
          <Field className="w-full sm:w-56">
            <FieldLabel htmlFor="ticket-status" className="sr-only">
              Ticket status
            </FieldLabel>
            <Select items={STATUS_ITEMS} value={ticket.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
              <SelectTrigger id="ticket-status" className="w-full" aria-busy={updatingStatus}>
                {updatingStatus && <Spinner />}
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <dt>Created</dt>
            <dd className="text-foreground">{formatDateTime(ticket.createdAt)}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Updated</dt>
            <dd className="text-foreground">{formatDateTime(ticket.updatedAt)}</dd>
          </div>
          {orderRef && (
            <div className="flex items-center gap-1">
              <dt className="flex items-center gap-1">
                <ShoppingCartIcon className="size-3" aria-hidden="true" />
                Order
              </dt>
              <dd>
                {orderId ? (
                  <Link href={`/admin/orders?order=${encodeURIComponent(orderId)}`} className="text-primary hover:underline">
                    {orderRef}
                  </Link>
                ) : (
                  <span className="text-foreground">{orderRef}</span>
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <MessageScroller className="min-h-64 flex-1 bg-muted/30">
        <MessageScrollerViewport>
          <MessageScrollerContent className="gap-4 p-4" aria-label="Conversation" role="log">
            <MessageScrollerItem>
              <Message>
                <MessageContent>
                  <MessageHeader className="text-xs text-muted-foreground">
                    {ticketCustomerName(ticket)} · Original message · {formatDateTime(ticket.createdAt)}
                  </MessageHeader>
                  <Bubble variant="outline">
                    <BubbleContent className="whitespace-pre-line">{display(ticket.message)}</BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </MessageScrollerItem>
            {replies.length === 0 && (
              <MessageScrollerItem>
                <p className="py-2 text-center text-xs text-muted-foreground">No replies yet.</p>
              </MessageScrollerItem>
            )}
            {replies.map((item, index) => {
              const staff = isStaffReply(item)
              const author = personName(item.author) ?? (staff ? "Support team" : ticketCustomerName(ticket))
              return (
                <MessageScrollerItem key={item.id} scrollAnchor={index === replies.length - 1}>
                  <Message align={staff ? "end" : "start"}>
                    <MessageContent>
                      <MessageHeader className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{author}</span>
                        <Badge variant={staff ? "default" : "outline"} className="h-4 px-1.5 text-[10px]">
                          {staff ? "Admin" : "Customer"}
                        </Badge>
                        <span>{formatDateTime(item.createdAt)}</span>
                      </MessageHeader>
                      <Bubble variant={staff ? "default" : "outline"} align={staff ? "end" : "start"}>
                        <BubbleContent className="whitespace-pre-line">{replyText(item)}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )
            })}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>

      <form onSubmit={sendReply} className="flex flex-col gap-2 border-t bg-background p-4">
        <Field data-invalid={replyError ? true : undefined}>
          <FieldLabel htmlFor="ticket-reply">Reply to customer</FieldLabel>
          <Textarea
            id="ticket-reply"
            value={reply}
            onChange={(event) => {
              setReply(event.target.value)
              if (replyError) setReplyError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder={closed ? "This ticket is closed. Reopen it to reply." : "Write your reply…"}
            maxLength={MAX_REPLY}
            disabled={sending || closed}
            aria-invalid={replyError ? true : undefined}
            aria-describedby="ticket-reply-hint"
            className="min-h-20"
          />
          {replyError ? (
            <FieldDescription id="ticket-reply-hint" role="alert" className="text-destructive">
              {replyError}
            </FieldDescription>
          ) : (
            <FieldDescription id="ticket-reply-hint">Press Ctrl + Enter to send.</FieldDescription>
          )}
        </Field>
        <div className="flex justify-end">
          <Button type="submit" disabled={sending || closed || !reply.trim()}>
            {sending ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
            {sending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>

      <AdminConfirmDialog
        open={pendingClose}
        onOpenChange={setPendingClose}
        title="Close this ticket?"
        description="The customer will no longer be able to continue this conversation unless the ticket is reopened."
        confirmLabel="Close ticket"
        pendingLabel="Closing…"
        destructive
        pending={updatingStatus}
        onConfirm={() => applyStatus("CLOSED")}
      />
    </div>
  )
}

function display(value?: string | null) {
  return value && value.trim() ? value : "No message provided."
}

export function SupportNoSelection() {
  return (
    <AdminEmptyState
      icon={MessagesSquareIcon}
      title="Select a ticket"
      description="Choose a ticket from the list to read the conversation and reply."
      className="h-full rounded-none border-0"
    />
  )
}
