"use client"

import Link from "next/link"
import { AlertTriangleIcon, LockIcon, RefreshCwIcon, SearchXIcon, WifiOffIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ApiError, getErrorMessage } from "@/lib/api"

interface AdminErrorProps {
  error: unknown
  title?: string
  onRetry?: () => void
  retrying?: boolean
}

function describe(error: unknown, fallbackTitle: string) {
  const status = error instanceof ApiError ? error.status : -1
  switch (status) {
    case 0:
      return { icon: WifiOffIcon, title: "Network unavailable", message: getErrorMessage(error) }
    case 401:
      return { icon: LockIcon, title: "Session expired", message: "Please sign in again to continue." }
    case 403:
      return {
        icon: LockIcon,
        title: "Permission denied",
        message: "Your account does not have permission to view this data.",
      }
    case 404:
      return { icon: SearchXIcon, title: "Not found", message: getErrorMessage(error) }
    default:
      return { icon: AlertTriangleIcon, title: fallbackTitle, message: getErrorMessage(error) }
  }
}

export function AdminError({ error, title = "Unable to load data", onRetry, retrying }: AdminErrorProps) {
  const info = describe(error, title)
  const isAuthError = error instanceof ApiError && error.status === 401

  return (
    <Alert variant="destructive" role="alert">
      <info.icon />
      <AlertTitle>{info.title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>{info.message}</p>
        <div className="flex flex-wrap gap-2">
          {isAuthError ? (
            <Button size="sm" variant="outline" render={<Link href="/login?next=/admin" />} nativeButton={false}>
              Sign in again
            </Button>
          ) : (
            onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
                <RefreshCwIcon data-icon="inline-start" className={retrying ? "animate-spin" : undefined} />
                {retrying ? "Retrying…" : "Retry"}
              </Button>
            )
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
