"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ServerOffIcon, ShieldAlertIcon } from "lucide-react"
import { toast } from "sonner"
import { SWRConfig } from "swr"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { API_BASE_URL, ApiError } from "@/lib/api"
import { AdminError } from "./admin-error"
import { AdminHeader } from "./admin-header"
import { AdminDashboardSkeleton } from "./admin-loading"
import { AdminNotificationsPanel } from "./admin-notifications-panel"
import { AdminSidebar } from "./admin-sidebar"
import { NotificationProvider } from "./notification-provider"

const NON_RETRYABLE = new Set([400, 401, 403, 404, 409])

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, authReady, authError, refresh, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const unauthenticated = authReady && !authError && !user

  useEffect(() => {
    if (unauthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
  }, [pathname, router, unauthenticated])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      router.replace("/login")
    } catch {
      toast.error("Sign out failed. Please try again.")
      setSigningOut(false)
    }
  }

  if (!authReady || unauthenticated) return <AdminDashboardSkeleton />

  if (authError) {
    if (!API_BASE_URL) {
      return (
        <main className="flex min-h-svh items-center justify-center p-6">
          <Empty className="max-w-md border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ServerOffIcon />
              </EmptyMedia>
              <EmptyTitle>Connect the OpenMarketz API</EmptyTitle>
              <EmptyDescription>
                The admin frontend could not reach the backend. Set <code>NEXT_PUBLIC_API_URL</code> to your API
                origin (for example https://api.openmarketz.com) in the project&apos;s environment variables, then retry.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => refresh()}>
                Retry
              </Button>
            </EmptyContent>
          </Empty>
        </main>
      )
    }
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AdminError error={authError} title="Unable to verify your session" onRetry={() => refresh()} />
        </div>
      </main>
    )
  }

  if (!user) return <AdminDashboardSkeleton />

  if (user.role !== "ADMIN") {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <Empty className="max-w-md border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Admin access required</EmptyTitle>
            <EmptyDescription>
              You are signed in as {user.email}, but this account does not have administrator permissions for
              OpenMarketz Admin.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? "Signing out…" : "Sign in with another account"}
            </Button>
            <Button variant="ghost" render={<Link href="/" />} nativeButton={false}>
              Go home
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  }

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          if (error instanceof ApiError && NON_RETRYABLE.has(error.status)) return
          if (retryCount >= 2) return
          setTimeout(() => revalidate({ retryCount }), 2000 * (retryCount + 1))
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 401) refresh()
        },
      }}
    >
      <NotificationProvider>
        <div className="flex min-h-svh">
          <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r lg:block">
            <AdminSidebar user={user} signingOut={signingOut} onSignOut={handleSignOut} />
          </aside>

          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="w-72 gap-0 p-0" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">OpenMarketz Admin navigation</SheetDescription>
              <AdminSidebar
                user={user}
                signingOut={signingOut}
                onSignOut={handleSignOut}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <AdminHeader
              user={user}
              signingOut={signingOut}
              onSignOut={handleSignOut}
              onOpenMobileNav={() => setMobileNavOpen(true)}
            />
            <main id="admin-main" className="flex-1 bg-muted/30">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">{children}</div>
            </main>
          </div>
        </div>
        <AdminNotificationsPanel />
      </NotificationProvider>
    </SWRConfig>
  )
}
