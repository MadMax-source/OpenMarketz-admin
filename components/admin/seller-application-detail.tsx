"use client"

import type { ReactNode } from "react"
import { CheckIcon, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { SellerApplication } from "@/lib/admin-types"
import {
  applicantEmail,
  categoryNames,
  display,
  formatDate,
  formatDateTime,
  humanize,
  identityMediaId,
  isAwaitingReview,
  ownerName,
  selfieMediaId,
  storeHandle,
  submittedAt,
} from "@/lib/admin-format"
import { AdminStatusBadge } from "./admin-status-badge"
import { PrivateMediaViewer } from "./private-media-viewer"

interface SellerApplicationDetailProps {
  application: SellerApplication | null
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewNote: string
  onReviewNoteChange: (note: string) => void
  onApprove: () => void
  onReject: () => void
  busy: boolean
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-sm break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function SellerApplicationDetail({
  application,
  open,
  onOpenChange,
  reviewNote,
  onReviewNoteChange,
  onApprove,
  onReject,
  busy,
}: SellerApplicationDetailProps) {
  const reviewable = application ? isAwaitingReview(application.status) : false
  const categories = application ? categoryNames(application) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        {application && (
          <>
            <SheetHeader className="border-b">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <SheetTitle className="truncate">{display(application.brandName)}</SheetTitle>
                <AdminStatusBadge status={application.status} />
              </div>
              <SheetDescription>
                {storeHandle(application) ? `@${storeHandle(application)} · ` : ""}Submitted{" "}
                {formatDateTime(submittedAt(application))}
              </SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
              <Section title="Store">
                <DetailList
                  items={[
                    ["Brand name", display(application.brandName)],
                    ["Store handle", storeHandle(application) ? `@${storeHandle(application)}` : "—"],
                    ["Applicant email", display(applicantEmail(application))],
                    ["Submitted", formatDateTime(submittedAt(application))],
                  ]}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Description</span>
                  <p className="text-sm text-pretty whitespace-pre-line">{display(application.description)}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Categories</span>
                  {categories.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map((category) => (
                        <Badge key={category} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm">—</span>
                  )}
                </div>
              </Section>

              <Separator />
              <Section title="Business">
                <DetailList
                  items={[
                    ["Business type", humanize(application.businessType)],
                    ["Registration number", display(application.registrationNumber)],
                    ["Business phone", display(application.businessPhone)],
                    ["Business email", display(application.businessEmail)],
                    ["Country", display(application.country)],
                    ["Region", display(application.region)],
                    ["City", display(application.city)],
                    ["Address", display(application.address)],
                  ]}
                />
              </Section>

              <Separator />
              <Section title="Owner & identity">
                <DetailList
                  items={[
                    ["Owner name", display(ownerName(application))],
                    ["Date of birth", formatDate(application.ownerBirthDate ?? application.dateOfBirth)],
                    ["ID type", humanize(application.idType)],
                  ]}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <PrivateMediaViewer
                    applicationId={application.id}
                    mediaId={identityMediaId(application)}
                    label="Identity document"
                  />
                  <PrivateMediaViewer applicationId={application.id} mediaId={selfieMediaId(application)} label="Selfie" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Documents load through short-lived secure links and are never stored in the browser.
                </p>
              </Section>

              <Separator />
              <Section title="Payout">
                <DetailList
                  items={[
                    ["Bank name", display(application.bankName)],
                    ["Account name", display(application.accountName)],
                  ]}
                />
              </Section>

              {reviewable ? (
                <>
                  <Separator />
                  <Field>
                    <FieldLabel htmlFor="review-note">Review note</FieldLabel>
                    <Textarea
                      id="review-note"
                      value={reviewNote}
                      onChange={(event) => onReviewNoteChange(event.target.value)}
                      placeholder="Optional note shared with the decision"
                      maxLength={1000}
                      disabled={busy}
                    />
                    <FieldDescription>Included with the approval or rejection when provided.</FieldDescription>
                  </Field>
                </>
              ) : (
                application.reviewNote && (
                  <>
                    <Separator />
                    <Section title="Review note">
                      <p className="text-sm whitespace-pre-line">{application.reviewNote}</p>
                    </Section>
                  </>
                )
              )}
            </div>

            {reviewable && (
              <SheetFooter className="flex-row justify-end border-t">
                <Button variant="destructive" onClick={onReject} disabled={busy}>
                  <XIcon data-icon="inline-start" />
                  Reject
                </Button>
                <Button onClick={onApprove} disabled={busy}>
                  <CheckIcon data-icon="inline-start" />
                  Approve
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
