import type { Metadata } from "next"
import { UsersIcon } from "lucide-react"
import { AdminEndpointPlaceholder } from "@/components/admin/admin-endpoint-placeholder"

export const metadata: Metadata = { title: "Users" }

export default function UsersPage() {
  return (
    <AdminEndpointPlaceholder
      title="Users"
      description="Manage buyer, seller, and admin accounts across the marketplace."
      icon={UsersIcon}
      emptyTitle="User management is not available yet"
      emptyDescription="User records will appear here once the backend exposes the admin user endpoints listed alongside."
      endpoints={[
        { name: "User list", description: "Paginated, searchable list of all accounts." },
        { name: "User detail", description: "Profile, role, and account status for a single user." },
        { name: "Suspend / reactivate", description: "Change an account's access state." },
        { name: "Session management", description: "List and revoke active sessions." },
        { name: "Audit history", description: "Chronological log of account actions." },
        { name: "Role management", description: "Assign or revoke admin, seller, and buyer roles." },
      ]}
    />
  )
}
