import { Suspense } from "react"
import type { Metadata } from "next"
import { AdminTableSkeleton } from "@/components/admin/admin-loading"
import { AdminSupport } from "@/components/support/admin-support"

export const metadata: Metadata = { title: "Support inbox" }

export default function SupportPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton label="Loading support inbox" />}>
      <AdminSupport />
    </Suspense>
  )
}
