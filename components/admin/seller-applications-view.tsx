"use client"

import { useMemo, useState } from "react"
import { CheckIcon, EyeIcon, SearchIcon, StoreIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSellerApplications, useUrlParam } from "@/lib/admin-hooks"
import type { SellerApplication, SellerApplicationDecision } from "@/lib/admin-types"
import {
  applicantEmail,
  display,
  formatDate,
  humanize,
  isAwaitingReview,
  ownerName,
  storeHandle,
  submittedAt,
  timestamp,
} from "@/lib/admin-format"
import { ApiError, approveSellerApplication, getErrorMessage, rejectSellerApplication } from "@/lib/api"
import { AdminConfirmDialog } from "./admin-confirm-dialog"
import { AdminDataTable, type AdminColumn } from "./admin-data-table"
import { AdminEmptyState } from "./admin-empty-state"
import { AdminError } from "./admin-error"
import { AdminTableSkeleton } from "./admin-loading"
import { AdminPageHeader } from "./admin-page-header"
import { AdminStatusBadge } from "./admin-status-badge"
import { SellerApplicationDetail } from "./seller-application-detail"

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "awaiting", label: "Awaiting review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

interface PendingAction {
  decision: SellerApplicationDecision
  application: SellerApplication
}

export function SellerApplicationsView() {
  const { data, error, isLoading, isValidating, mutate } = useSellerApplications()
  const [query, setQuery] = useUrlParam("q")
  const [status, setStatus] = useUrlParam("status", "all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [action, setAction] = useState<PendingAction | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const applications = useMemo(
    () => [...(data ?? [])].sort((a, b) => timestamp(submittedAt(b)) - timestamp(submittedAt(a))),
    [data],
  )

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return applications.filter((app) => {
      if (status === "awaiting" && !isAwaitingReview(app.status)) return false
      if (status !== "all" && status !== "awaiting" && app.status !== status) return false
      if (!term) return true
      return [app.brandName, applicantEmail(app), ownerName(app), storeHandle(app)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    })
  }, [applications, query, status])

  const awaitingCount = applications.filter((app) => isAwaitingReview(app.status)).length
  const selected = applications.find((app) => app.id === selectedId) ?? null

  const openDetail = (app: SellerApplication) => {
    setReviewNote("")
    setSelectedId(app.id)
  }

  const requestAction = (application: SellerApplication, decision: SellerApplicationDecision) => {
    if (application.id !== selectedId) setReviewNote("")
    setAction({ application, decision })
  }

  const confirmAction = async () => {
    if (!action || submitting) return
    const { application, decision } = action
    setSubmitting(true)
    try {
      if (decision === "APPROVED") await approveSellerApplication(application.id, reviewNote)
      else await rejectSellerApplication(application.id, reviewNote)
      toast.success(
        decision === "APPROVED"
          ? `${display(application.brandName)} was approved.`
          : `${display(application.brandName)} was rejected.`,
      )
      setAction(null)
      setSelectedId(null)
      setReviewNote("")
      await mutate()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("This application has already been reviewed. The list has been refreshed.")
        setAction(null)
        await mutate()
      } else {
        toast.error(getErrorMessage(err, "The review could not be saved."))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const rowActions = (app: SellerApplication) => (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button size="sm" variant="outline" onClick={() => openDetail(app)} aria-label={`View ${display(app.brandName)}`}>
        <EyeIcon data-icon="inline-start" />
        View
      </Button>
      {isAwaitingReview(app.status) && (
        <>
          <Button size="sm" onClick={() => requestAction(app, "APPROVED")} disabled={submitting}>
            <CheckIcon data-icon="inline-start" />
            Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => requestAction(app, "REJECTED")} disabled={submitting}>
            <XIcon data-icon="inline-start" />
            Reject
          </Button>
        </>
      )}
    </div>
  )

  const columns: AdminColumn<SellerApplication>[] = [
    {
      id: "submitted",
      header: "Submitted",
      cell: (app) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(submittedAt(app))}</span>,
    },
    {
      id: "brand",
      header: "Brand",
      cell: (app) => (
        <div className="flex max-w-56 flex-col">
          <span className="truncate font-medium">{display(app.brandName)}</span>
          <span className="truncate text-xs text-muted-foreground">
            {storeHandle(app) ? `@${storeHandle(app)}` : "No handle"}
          </span>
        </div>
      ),
    },
    { id: "type", header: "Business type", cell: (app) => humanize(app.businessType) },
    {
      id: "location",
      header: "Location",
      cell: (app) => (
        <div className="flex flex-col">
          <span>{display(app.country)}</span>
          <span className="text-xs text-muted-foreground">{display(app.region)}</span>
        </div>
      ),
    },
    {
      id: "email",
      header: "Applicant email",
      cell: (app) => <span className="block max-w-52 truncate">{display(applicantEmail(app))}</span>,
    },
    { id: "status", header: "Status", cell: (app) => <AdminStatusBadge status={app.status} /> },
    { id: "actions", header: <span className="sr-only">Actions</span>, cell: rowActions, headerClassName: "text-right" },
  ]

  return (
    <>
      <AdminPageHeader
        title="Seller applications"
        description="Review store applications, verify identity documents, and approve or reject sellers."
        meta={
          data && (
            <Badge variant="secondary">
              {awaitingCount} awaiting review · {applications.length} total
            </Badge>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="flex-1">
          <FieldLabel htmlFor="seller-search">Search</FieldLabel>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="seller-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Brand name, applicant email, or owner name"
              className="pl-8"
            />
          </div>
        </Field>
        <Field className="sm:w-52">
          <FieldLabel htmlFor="seller-status">Status</FieldLabel>
          <Select items={STATUS_FILTERS} value={status} onValueChange={(value) => setStatus(value as string)}>
            <SelectTrigger id="seller-status" className="w-full">
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
      </div>

      {isLoading ? (
        <AdminTableSkeleton label="Loading seller applications" />
      ) : error ? (
        <AdminError error={error} title="Unable to load seller applications" onRetry={() => mutate()} retrying={isValidating} />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={StoreIcon}
          title={applications.length ? "No matching applications" : "No seller applications"}
          description={
            applications.length
              ? "Try a different search term or status filter."
              : "New seller applications will appear here once they are submitted."
          }
        >
          {applications.length > 0 && (
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
        <AdminDataTable
          caption="Seller applications"
          columns={columns}
          rows={filtered}
          getRowId={(app) => app.id}
          renderMobileCard={(app) => (
            <Card size="sm">
              <CardHeader>
                <CardTitle className="truncate">{display(app.brandName)}</CardTitle>
                <CardDescription className="truncate">
                  {storeHandle(app) ? `@${storeHandle(app)} · ` : ""}
                  {display(applicantEmail(app))}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <AdminStatusBadge status={app.status} />
                  <span className="text-xs text-muted-foreground">{formatDate(submittedAt(app))}</span>
                </div>
                <p className="text-muted-foreground">
                  {humanize(app.businessType)} · {[app.region, app.country].filter(Boolean).join(", ") || "—"}
                </p>
              </CardContent>
              <CardFooter>{rowActions(app)}</CardFooter>
            </Card>
          )}
        />
      )}

      <SellerApplicationDetail
        application={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && !submitting && setSelectedId(null)}
        reviewNote={reviewNote}
        onReviewNoteChange={setReviewNote}
        onApprove={() => selected && requestAction(selected, "APPROVED")}
        onReject={() => selected && requestAction(selected, "REJECTED")}
        busy={submitting}
      />

      <AdminConfirmDialog
        open={Boolean(action)}
        onOpenChange={(open) => !open && setAction(null)}
        title={action?.decision === "APPROVED" ? "Approve seller application?" : "Reject seller application?"}
        description={
          action?.decision === "APPROVED"
            ? `${display(action.application.brandName)} will be approved and the applicant can start selling.`
            : `${display(action?.application.brandName)} will be rejected. The applicant will be notified of the decision.`
        }
        confirmLabel={action?.decision === "APPROVED" ? "Approve" : "Reject"}
        pendingLabel={action?.decision === "APPROVED" ? "Approving…" : "Rejecting…"}
        destructive={action?.decision === "REJECTED"}
        pending={submitting}
        onConfirm={confirmAction}
      >
        <Field>
          <FieldLabel htmlFor="confirm-review-note">Review note (optional)</FieldLabel>
          <Textarea
            id="confirm-review-note"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Add context for this decision"
            maxLength={1000}
            disabled={submitting}
          />
        </Field>
      </AdminConfirmDialog>
    </>
  )
}
