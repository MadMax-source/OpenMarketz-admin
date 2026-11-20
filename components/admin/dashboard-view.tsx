"use client"

import Link from "next/link"
import { useMemo, type ReactNode } from "react"
import {
  ArrowRightIcon,
  LifeBuoyIcon,
  PackageIcon,
  ShoppingCartIcon,
  StoreIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useAdminOrders, useAdminSupportTickets, useSellerApplications } from "@/lib/admin-hooks"
import {
  display,
  formatDate,
  humanize,
  isAwaitingReview,
  orderNeedsAttention,
  orderNumber,
  personName,
  storeHandle,
  submittedAt,
  ticketCustomerName,
  ticketNumber,
  ticketTopic,
  timestamp,
} from "@/lib/admin-format"
import { getErrorMessage } from "@/lib/api"
import { AdminError } from "./admin-error"
import { AdminListSkeleton } from "./admin-loading"
import { AdminPageHeader } from "./admin-page-header"
import { AdminStatCard } from "./admin-stat-card"
import { AdminStatusBadge } from "./admin-status-badge"

const OPEN_TICKET_STATUSES = new Set(["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"])
const chartConfig = { count: { label: "Orders", color: "var(--chart-1)" } } satisfies ChartConfig

function ActivityCard({
  title,
  description,
  href,
  children,
}: {
  title: string
  description: string
  href: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href={href} />} nativeButton={false}>
            View all
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ActivityRow({ href, title, subtitle, status }: { href: string; title: string; subtitle: string; status: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg px-2 py-2 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{title}</span>
          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
        </div>
        <AdminStatusBadge status={status} />
      </Link>
    </li>
  )
}

export function DashboardView() {
  const { user } = useAuth()
  const sellers = useSellerApplications()
  const tickets = useAdminSupportTickets()
  const orders = useAdminOrders()

  const pendingSellers = useMemo(
    () =>
      (sellers.data ?? [])
        .filter((app) => isAwaitingReview(app.status))
        .sort((a, b) => timestamp(submittedAt(b)) - timestamp(submittedAt(a))),
    [sellers.data],
  )
  const openTickets = useMemo(
    () =>
      (tickets.data ?? [])
        .filter((t) => OPEN_TICKET_STATUSES.has(t.status))
        .sort((a, b) => timestamp(b.updatedAt ?? b.createdAt) - timestamp(a.updatedAt ?? a.createdAt)),
    [tickets.data],
  )
  const attentionOrders = useMemo(() => (orders.data ?? []).filter(orderNeedsAttention), [orders.data])
  const recentOrders = useMemo(
    () => [...(orders.data ?? [])].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt)).slice(0, 5),
    [orders.data],
  )
  const statusChart = useMemo(() => {
    const counts = new Map<string, number>()
    for (const order of orders.data ?? []) counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
    return Array.from(counts, ([status, count]) => ({ status: humanize(status), count }))
  }, [orders.data])

  const firstName = user?.firstName || personName(user)?.split(" ")[0]

  return (
    <>
      <AdminPageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        description="A live view of the work waiting for you across OpenMarketz."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label="Pending seller applications"
          icon={StoreIcon}
          value={sellers.data ? pendingSellers.length : null}
          loading={sellers.isLoading}
          errorMessage={sellers.error ? getErrorMessage(sellers.error) : undefined}
          hint={sellers.data ? `${sellers.data.length} applications in total` : undefined}
          href="/admin/sellers?status=awaiting"
        />
        <AdminStatCard
          label="Open support tickets"
          icon={LifeBuoyIcon}
          value={tickets.data ? openTickets.length : null}
          loading={tickets.isLoading}
          errorMessage={tickets.error ? getErrorMessage(tickets.error) : undefined}
          hint={tickets.data ? `${tickets.data.length} tickets in total` : undefined}
          href="/admin/support"
        />
        <AdminStatCard
          label="Orders needing delivery review"
          icon={TruckIcon}
          value={orders.data ? attentionOrders.length : null}
          loading={orders.isLoading}
          errorMessage={orders.error ? getErrorMessage(orders.error) : undefined}
          hint={orders.data ? "Shipped, or delivered without admin confirmation" : undefined}
          href="/admin/orders"
        />
        <AdminStatCard
          label="Total orders"
          icon={ShoppingCartIcon}
          value={orders.data ? orders.data.length : null}
          loading={orders.isLoading}
          errorMessage={orders.error ? getErrorMessage(orders.error) : undefined}
          href="/admin/orders"
        />
        <AdminStatCard label="Users" icon={UsersIcon} unavailableMessage="Data unavailable until a user list endpoint exists." />
        <AdminStatCard
          label="Products"
          icon={PackageIcon}
          unavailableMessage="Data unavailable until an admin product endpoint exists."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityCard title="Seller applications" description="Newest applications awaiting review" href="/admin/sellers">
          {sellers.isLoading ? (
            <AdminListSkeleton rows={4} />
          ) : sellers.error ? (
            <AdminError error={sellers.error} onRetry={() => sellers.mutate()} retrying={sellers.isValidating} />
          ) : pendingSellers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No applications are waiting for review.</p>
          ) : (
            <ul className="flex flex-col">
              {pendingSellers.slice(0, 5).map((app) => (
                <ActivityRow
                  key={app.id}
                  href="/admin/sellers?status=awaiting"
                  title={display(app.brandName)}
                  subtitle={`${storeHandle(app) ? `@${storeHandle(app)} · ` : ""}${formatDate(submittedAt(app))}`}
                  status={app.status}
                />
              ))}
            </ul>
          )}
        </ActivityCard>

        <ActivityCard title="Support activity" description="Most recently updated open tickets" href="/admin/support">
          {tickets.isLoading ? (
            <AdminListSkeleton rows={4} />
          ) : tickets.error ? (
            <AdminError error={tickets.error} onRetry={() => tickets.mutate()} retrying={tickets.isValidating} />
          ) : openTickets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No open tickets. Nice work.</p>
          ) : (
            <ul className="flex flex-col">
              {openTickets.slice(0, 5).map((ticket) => (
                <ActivityRow
                  key={ticket.id}
                  href={`/admin/support?ticket=${encodeURIComponent(ticket.id)}`}
                  title={`${ticketCustomerName(ticket)} · ${ticketTopic(ticket)}`}
                  subtitle={`${ticketNumber(ticket)} · ${formatDate(ticket.updatedAt ?? ticket.createdAt)}`}
                  status={ticket.status}
                />
              ))}
            </ul>
          )}
        </ActivityCard>

        <ActivityCard title="Recent orders" description="Latest orders placed on the marketplace" href="/admin/orders">
          {orders.isLoading ? (
            <AdminListSkeleton rows={4} />
          ) : orders.error ? (
            <AdminError error={orders.error} onRetry={() => orders.mutate()} retrying={orders.isValidating} />
          ) : recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="flex flex-col">
              {recentOrders.map((order) => (
                <ActivityRow
                  key={order.id}
                  href={`/admin/orders?order=${encodeURIComponent(order.id)}`}
                  title={orderNumber(order)}
                  subtitle={formatDate(order.createdAt)}
                  status={order.status}
                />
              ))}
            </ul>
          )}
        </ActivityCard>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>Distribution of all orders returned by the API</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.isLoading ? (
              <AdminListSkeleton rows={4} />
            ) : orders.error ? (
              <AdminError error={orders.error} onRetry={() => orders.mutate()} retrying={orders.isValidating} />
            ) : statusChart.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No order data to chart yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={statusChart} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
