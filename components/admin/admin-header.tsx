"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon, LogOutIcon, MenuIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AuthUser } from "@/lib/admin-types"
import { personName } from "@/lib/admin-format"
import { findActiveNavItem } from "./admin-nav"
import { AdminNotificationsButton } from "./admin-notifications-panel"
import { userInitials } from "./admin-sidebar"

interface AdminHeaderProps {
  user: AuthUser
  signingOut: boolean
  onSignOut: () => void
  onOpenMobileNav: () => void
}

export function AdminHeader({ user, signingOut, onSignOut, onOpenMobileNav }: AdminHeaderProps) {
  const pathname = usePathname()
  const active = findActiveNavItem(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <MenuIcon />
      </Button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          <li className="hidden sm:block">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          </li>
          {active && active.href !== "/admin" && (
            <>
              <li className="hidden sm:block" aria-hidden="true">
                <ChevronRightIcon className="size-3.5 text-muted-foreground" />
              </li>
              <li className="truncate font-medium" aria-current="page">
                {active.label}
              </li>
            </>
          )}
          {active?.href === "/admin" && (
            <>
              <li className="hidden sm:block" aria-hidden="true">
                <ChevronRightIcon className="size-3.5 text-muted-foreground" />
              </li>
              <li className="truncate font-medium" aria-current="page">
                Dashboard
              </li>
            </>
          )}
        </ol>
      </nav>

      <AdminNotificationsButton />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Open account menu" />}
        >
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{userInitials(user)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate font-medium text-foreground">{personName(user) ?? "Administrator"}</span>
              <span className="truncate text-xs font-normal">{user.email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onSignOut} disabled={signingOut}>
              <LogOutIcon />
              {signingOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
