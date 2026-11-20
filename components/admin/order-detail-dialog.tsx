"use client"

import { useState, type ReactNode } from "react"
import { BadgeCheckIcon, PackageCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOrder } from "@/lib/admin-hooks"
import type { Order } from "@/lib/admin-types"
import {
  display,
  formatAmount,
  formatDateTime,
  humanize,
  isOrderDelivered,
  itemName,
  orderAddress,
  orderBuyer,
  orderNumber,
  orderPaymentStatus,
  orderSellerName,
  orderShipmentStatus,
  orderTotal,
  personName,
} from "@/lib/admin-format"
import { adminConfirmOrderDelivery, ApiError, getErrorMessage, markOrderDelivered } from "@/lib/api"
import { AdminConfirmDialog } from "./admin-confirm-dialog"
import { AdminError } from "./admin-error"
import { AdminStatusBadge } from "./admin-status-badge"

type OrderAction = "delivered" | "confirm"

interface OrderDetailDialogProps {
  orderId: string | null
  fallback?: Order | null
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function Rows({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-sm break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function OrderDetailDialog({ orderId, fallback, onOpenChange, onChanged }: OrderDetailDialogProps) {
  const { data, error, isLoading, isValidating, mutate } = useOrder(orderId)
  const [action, setAction] = useState<OrderAction | null>(null)
  const [pending, setPending] = useState(false)
  const order = data ?? fallback ?? null

  const runAction = async () => {
    if (!order || !action || pending) return
    setPending(true)
    try {
      if (action === "delivered") await markOrderDelivered(order.id)
      else await adminConfirmOrderDelivery(order.id)
      toast.success(action === "delivered" ? "Order marked as delivered." : "Delivery confirmed.")
      setAction(null)
      await mutate()
      onChanged()
    } catch (err) {
      toast.error(getErrorMessage(err, "The action could not be completed."))
      if (err instanceof ApiError && err.status === 409) {
        setAction(null)
        await mutate()
        onChanged()
      }
    } finally {
      setPending(false)
    }
  }

  const delivered = order ? isOrderDelivered(order) : false
  const confirmed = Boolean(order?.adminConfirmedAt)
  const canMarkDelivered = order ? !delivered && !["CANCELLED", "REFUNDED", "PENDING_PAYMENT"].includes(order.status) : false
  const canConfirm = order ? delivered && !confirmed : false
  const address = order ? orderAddress(order) : null
  const buyer = order ? orderBuyer(order) : null

  return (
    <>
      <Dialog open={Boolean(orderId)} onOpenChange={(open) => !pending && onOpenChange(open)}>
        <DialogContent className="flex max-h-[90svh] flex-col gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b p-4 pr-12">
            <DialogTitle className="flex flex-wrap items-center gap-2">
              Order {order ? orderNumber(order) : ""}
              {order && <AdminStatusBadge status={order.status} />}
            </DialogTitle>
            <DialogDescription>
              {order ? `Placed ${formatDateTime(order.createdAt)}` : "Loading order details"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
            {isLoading && !order ? (
              <div className="flex flex-col gap-3" role="status" aria-label="Loading order">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : error && !order ? (
              <AdminError error={error} title="Unable to load order" onRetry={() => mutate()} retrying={isValidating} />
            ) : order ? (
              <>
                {error && <AdminError error={error} title="Showing cached details" onRetry={() => mutate()} retrying={isValidating} />}
                <Section title="Buyer">
                  <Rows
                    items={[
                      ["Name", display(personName(buyer))],
                      ["Email", display(buyer?.email)],
                      ["Phone", display(buyer?.phone ?? address?.phone)],
                    ]}
                  />
                </Section>
                <Separator />
                <Section title="Shipping address">
                  {address ? (
                    <address className="text-sm not-italic text-pretty">
                      {[
                        address.fullName ?? address.name,
                        address.line1 ?? address.street ?? address.address,
                        address.line2,
                        [address.city, address.region ?? address.state, address.postalCode].filter(Boolean).join(", "),
                        address.country,
                      ]
                        .filter(Boolean)
                        .map((line, index) => (
                          <span key={index} className="block">
                            {line}
                          </span>
                        ))}
                    </address>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address snapshot.</p>
                  )}
                </Section>
                <Separator />
                <Section title="Items">
                  {order.items?.length ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead scope="col">Item</TableHead>
                            <TableHead scope="col" className="text-right">Qty</TableHead>
                            <TableHead scope="col" className="text-right">Unit</TableHead>
                            <TableHead scope="col" className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="max-w-56 truncate">{itemName(item)}</TableCell>
                              <TableCell className="text-right tabular-nums">{item.quantity ?? "—"}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatAmount(item.unitPrice ?? item.price, order.currency)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatAmount(item.lineTotal ?? item.total, order.currency)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items returned for this order.</p>
                  )}
                </Section>
                <Separator />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Section title="Payment">
                    <Rows
                      items={[
                        ["Status", <AdminStatusBadge key="p" status={orderPaymentStatus(order)} />],
                        ["Method", humanize(order.payment?.method ?? order.payment?.provider)],
                        ["Subtotal", formatAmount(order.subtotal, order.currency)],
                        ["Shipping", formatAmount(order.shippingFee, order.currency)],
                        ["Discount", formatAmount(order.discount, order.currency)],
                        ["Total", <strong key="t">{formatAmount(orderTotal(order), order.currency)}</strong>],
                      ]}
                    />
                  </Section>
                  <Section title="Shipment">
                    <Rows
                      items={[
                        ["Status", <AdminStatusBadge key="s" status={orderShipmentStatus(order)} />],
                        ["Carrier", display(order.shipment?.carrier)],
                        ["Tracking", display(order.shipment?.trackingNumber)],
                        ["Shipped", formatDateTime(order.shipment?.shippedAt)],
                      ]}
                    />
                  </Section>
                </div>
                <Separator />
                <Section title="Seller">
                  <p className="text-sm">{display(orderSellerName(order))}</p>
                </Section>
                <Separator />
                <Section title="Timeline">
                  <Rows
                    items={[
                      ["Created", formatDateTime(order.createdAt)],
                      ["Paid", formatDateTime(order.paidAt)],
                      ["Delivered", formatDateTime(order.deliveredAt ?? order.shipment?.deliveredAt)],
                      ["Buyer confirmed", formatDateTime(order.buyerConfirmedAt)],
                      ["Admin confirmed", formatDateTime(order.adminConfirmedAt)],
                    ]}
                  />
                </Section>
              </>
            ) : null}
          </div>

          {order && (
            <DialogFooter className="m-0 flex-row flex-wrap justify-end gap-2 rounded-b-xl border-t p-4">
              {confirmed ? (
                <p className="mr-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BadgeCheckIcon className="size-4" aria-hidden="true" />
                  Delivery confirmed by admin
                </p>
              ) : null}
              {canMarkDelivered && (
                <Button variant="outline" onClick={() => setAction("delivered")} disabled={pending}>
                  <PackageCheckIcon data-icon="inline-start" />
                  Mark delivered
                </Button>
              )}
              {!confirmed && (
                <Button onClick={() => setAction("confirm")} disabled={pending || !canConfirm}>
                  <BadgeCheckIcon data-icon="inline-start" />
                  Confirm delivery
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={Boolean(action)}
        onOpenChange={(open) => !open && setAction(null)}
        title={action === "delivered" ? "Mark order as delivered?" : "Confirm delivery?"}
        description={
          action === "delivered"
            ? "This records the order as delivered to the buyer."
            : "Confirming delivery is final and may enable the settlement process that releases funds to the seller. Only confirm once delivery has been verified."
        }
        confirmLabel={action === "delivered" ? "Mark delivered" : "Confirm delivery"}
        pendingLabel={action === "delivered" ? "Marking…" : "Confirming…"}
        pending={pending}
        onConfirm={runAction}
      />
    </>
  )
}
