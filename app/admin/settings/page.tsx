import type { Metadata } from "next"
import { SettingsIcon } from "lucide-react"
import { AdminEndpointPlaceholder } from "@/components/admin/admin-endpoint-placeholder"

export const metadata: Metadata = { title: "Settings" }

export default function SettingsPage() {
  return (
    <AdminEndpointPlaceholder
      title="Settings"
      description="Marketplace-wide configuration for OpenMarketz."
      icon={SettingsIcon}
      emptyTitle="No settings to manage yet"
      emptyDescription="Settings controls are intentionally not built until the backend provides settings endpoints, so nothing here can drift from the real configuration."
      endpoints={[
        { name: "Read settings", description: "Current marketplace configuration values." },
        { name: "Update settings", description: "Validated, audited changes to configuration." },
      ]}
    />
  )
}
