import { Suspense } from "react"
import type { Metadata } from "next"
import { AdminTableSkeleton } from "@/components/admin/admin-loading"
import { SellerApplicationsView } from "@/components/admin/seller-applications-view"

export const metadata: Metadata = { title: "Seller applications" }

export default function SellerApplicationsPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton label="Loading seller applications" />}>
      <SellerApplicationsView />
    </Suspense>
  )
}
