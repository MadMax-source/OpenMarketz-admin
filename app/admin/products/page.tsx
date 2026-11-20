import type { Metadata } from "next"
import { PackageIcon } from "lucide-react"
import { AdminEndpointPlaceholder } from "@/components/admin/admin-endpoint-placeholder"

export const metadata: Metadata = { title: "Products" }

export default function ProductsPage() {
  return (
    <AdminEndpointPlaceholder
      title="Products"
      description="Moderate listings, review reports, and manage product visibility."
      icon={PackageIcon}
      emptyTitle="Product moderation is not available yet"
      emptyDescription="Listings will appear here once the backend exposes the admin product endpoints listed alongside."
      endpoints={[
        { name: "Admin product list", description: "All listings across sellers, with status." },
        { name: "Product detail", description: "Full listing data for review." },
        { name: "Product moderation", description: "Approve or flag listings." },
        { name: "Pause / activate / archive", description: "Change a listing's visibility." },
        { name: "Report review", description: "Review buyer reports against listings." },
        { name: "Seller filtering", description: "Filter listings by seller store." },
      ]}
    />
  )
}
