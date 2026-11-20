import { Suspense } from "react"
import type { Metadata } from "next"
import { AdminTableSkeleton } from "@/components/admin/admin-loading"
import { OrdersView } from "@/components/admin/orders-view"

export const metadata: Metadata = { title: "Orders" }

export default function OrdersPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton label="Loading orders" />}>
      <OrdersView />
    </Suspense>
  )
}
