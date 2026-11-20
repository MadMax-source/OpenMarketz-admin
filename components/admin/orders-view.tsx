"use client"

import { useMemo } from "react"
import { EyeIcon, SearchIcon, ShoppingCartIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminOrders, useUrlParam } from "@/lib/admin-hooks"
import { ORDER_STATUSES, type Order } from "@/lib/admin-types"
import {
  display,
  formatAmount,
  formatDate,
  humanize,
  orderBuyer,
  orderNumber,
  orderPaymentStatus,
  orderSellerName,
  orderShipmentStatus,
  orderTotal,
  personName,
  timestamp,
} from "@/lib/admin-format"
import { AdminDataTable, type AdminColumn } from "./admin-data-table"
import { AdminEmptyState } from "./admin-empty-state"
import { AdminError } from "./admin-error"
import { AdminTableSkeleton } from "./admin-loading"
import { AdminPageHeader } from "./admin-page-header"
import { AdminStatusBadge } from "./admin-status-badge"
import { OrderDetailDialog } from "./order-detail-dialog"

function optionsFrom(values: (string | null | undefined)[], allLabel: string) {
  const unique = Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort()
  return [{ value: "all", label: allLabel }, ...unique.map((value) => ({ value, label: humanize(value) }))]
}

function FilterSelect({
  id,
  label,
  items,
  value,
  onChange,
}: {
  id: string
  label: string
  items: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field className="sm:w-48">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select items={items} value={value} onValueChange={(next) => onChange(next as string)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

export function OrdersView() {
  const { data, error, isLoading, isValidating, mutate } = useAdminOrders()
  const [query, setQuery] = useUrlParam("q")
  const [status, setStatus] = useUrlParam("status", "all")
  const [payment, setPayment] = useUrlParam("payment", "all")
  const [shipment, setShipment] = useUrlParam("shipment", "all")
  const [selectedId, setSelectedId] = useUrlParam("order")

  const orders = useMemo(() => [...(data ?? [])].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt)), [data])

  const statusOptions = useMemo(
    () => [{ value: "all", label: "All statuses" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: humanize(s) }))],
    [],
  )
  const paymentOptions = useMemo(() => optionsFrom(orders.map(orderPaymentStatus), "All payments"), [orders])
  const shipmentOptions = useMemo(() => optionsFrom(orders.map(orderShipmentStatus), "All shipments"), [orders])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^#/, "")
    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false
      if (payment !== "all" && orderPaymentStatus(order) !== payment) return false
      if (shipment !== "all" && orderShipmentStatus(order) !== shipment) return false
      if (!term) return true
      return orderNumber(order).toLowerCase().replace(/^#/, "").includes(term) || order.id.toLowerCase().includes(term)
    })
  }, [orders, payment, query, shipment, status])

  const hasFilters = Boolean(query) || status !== "all" || payment !== "all" || shipment !== "all"
  const clearFilters = () => {
    setQuery(null)
    setStatus(null)
    setPayment(null)
    setShipment(null)
  }

  const viewButton = (order: Order) => (
    <Button size="sm" variant="outline" onClick={() => setSelectedId(order.id)} aria-label={`View order ${orderNumber(order)}`}>
      <EyeIcon data-icon="inline-start" />
      View
    </Button>
  )

  const columns: AdminColumn<Order>[] = [
    { id: "number", header: "Order", cell: (o) => <span className="font-mono text-xs font-medium">{orderNumber(o)}</span> },
    { id: "date", header: "Created", cell: (o) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(o.createdAt)}</span> },
    {
      id: "buyer",
      header: "Buyer",
      cell: (o) => <span className="block max-w-44 truncate">{display(personName(orderBuyer(o)) ?? orderBuyer(o)?.email)}</span>,
    },
    { id: "seller", header: "Seller", cell: (o) => <span className="block max-w-40 truncate">{display(orderSellerName(o))}</span> },
    { id: "status", header: "Status", cell: (o) => <AdminStatusBadge status={o.status} /> },
    { id: "payment", header: "Payment", cell: (o) => <AdminStatusBadge status={orderPaymentStatus(o)} /> },
    { id: "shipment", header: "Shipment", cell: (o) => <AdminStatusBadge status={orderShipmentStatus(o)} /> },
    {
      id: "total",
      header: "Total",
      headerClassName: "text-right",
      className: "text-right tabular-nums whitespace-nowrap",
      cell: (o) => formatAmount(orderTotal(o), o.currency),
    },
    { id: "actions", header: <span className="sr-only">Actions</span>, headerClassName: "text-right", className: "text-right", cell: viewButton },
  ]

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Track marketplace orders, verify delivery, and confirm completion."
        meta={data && <Badge variant="secondary">{orders.length} orders</Badge>}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <Field className="flex-1">
          <FieldLabel htmlFor="order-search">Search</FieldLabel>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="order-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Order number"
              className="pl-8"
            />
          </div>
        </Field>
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <FilterSelect id="order-status" label="Order status" items={statusOptions} value={status} onChange={setStatus} />
          <FilterSelect id="order-payment" label="Payment status" items={paymentOptions} value={payment} onChange={setPayment} />
          <FilterSelect id="order-shipment" label="Shipment status" items={shipmentOptions} value={shipment} onChange={setShipment} />
        </div>
      </div>

      {isLoading ? (
        <AdminTableSkeleton label="Loading orders" />
      ) : error ? (
        <AdminError error={error} title="Unable to load orders" onRetry={() => mutate()} retrying={isValidating} />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={ShoppingCartIcon}
          title={orders.length ? "No matching orders" : "No orders yet"}
          description={orders.length ? "Try a different search or filter." : "Orders will appear here once buyers check out."}
        >
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </AdminEmptyState>
      ) : (
        <div className="overflow-x-auto">
          <AdminDataTable
            caption="Orders"
            columns={columns}
            rows={filtered}
            getRowId={(o) => o.id}
            renderMobileCard={(o) => (
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="font-mono text-sm">{orderNumber(o)}</CardTitle>
                  <CardDescription className="truncate">
                    {display(personName(orderBuyer(o)) ?? orderBuyer(o)?.email)} · {formatDate(o.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <AdminStatusBadge status={o.status} />
                  <AdminStatusBadge status={orderPaymentStatus(o)} />
                  <span className="ml-auto text-sm font-medium tabular-nums">{formatAmount(orderTotal(o), o.currency)}</span>
                </CardContent>
                <CardFooter>{viewButton(o)}</CardFooter>
              </Card>
            )}
          />
        </div>
      )}

      <OrderDetailDialog
        orderId={selectedId || null}
        fallback={orders.find((o) => o.id === selectedId) ?? null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onChanged={() => mutate()}
      />
    </>
  )
}
