"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BellIcon, LogOutIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { AuthUser } from "@/lib/admin-types"
import { personName } from "@/lib/admin-format"
import { cn } from "@/lib/utils"
import { AdminBrand } from "./admin-brand"
import { ADMIN_NAV, isNavItemActive } from "./admin-nav"
import { useNotifications } from "./notification-provider"

interface AdminSidebarProps {
  user: AuthUser
  signingOut: boolean
  onSignOut: () => void
  onNavigate?: () => void
}

export function userInitials(user: AuthUser) {
  const name = personName(user) ?? user.email
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function AdminSidebar({ user, signingOut, onSignOut, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname()
  const { unreadCount, setPanelOpen } = useNotifications()
  const displayName = personName(user) ?? "Administrator"

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center px-4">
        <AdminBrand />
      </div>
      <Separator />

      <nav aria-label="Admin navigation" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(item, pathname)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                        active && "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
              {group.label === "System" && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate?.()
                      setPanelOpen(true)
                    }}
                    className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <BellIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate text-left">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                        {unreadCount}
                        <span className="sr-only"> unread</span>
                      </span>
                    )}
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}
      </nav>

      <Separator />
      <div className="flex items-center gap-3 p-3">
        <Avatar>
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback>{userInitials(user)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onSignOut} disabled={signingOut} aria-label="Sign out">
          {signingOut ? <Spinner /> : <LogOutIcon />}
        </Button>
      </div>
    </div>
  )
}
