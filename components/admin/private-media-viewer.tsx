"use client"

import { useEffect, useState } from "react"
import { ExternalLinkIcon, FileTextIcon, ImageOffIcon, RefreshCwIcon, TimerOffIcon } from "lucide-react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage, getSellerApplicationMediaAccess } from "@/lib/api"

interface PrivateMediaViewerProps {
  applicationId: string
  mediaId: string | null
  label: string
}

function isPdf(url: string, mimeType?: string) {
  return mimeType?.includes("pdf") || /\.pdf(\?|$)/i.test(url)
}

export function PrivateMediaViewer({ applicationId, mediaId, label }: PrivateMediaViewerProps) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    mediaId ? ["admin/seller-media", applicationId, mediaId] : null,
    ([, appId, id]) => getSellerApplicationMediaAccess(appId, id),
    { revalidateOnFocus: false, revalidateIfStale: false, shouldRetryOnError: false },
  )
  const [expired, setExpired] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setExpired(false)
    setImageFailed(false)
    if (!data?.expiresAt) return
    const remaining = new Date(data.expiresAt).getTime() - Date.now()
    if (Number.isNaN(remaining)) return
    if (remaining <= 0) {
      setExpired(true)
      return
    }
    const timer = setTimeout(() => setExpired(true), remaining)
    return () => clearTimeout(timer)
  }, [data])

  const reload = () => {
    setExpired(false)
    setImageFailed(false)
    mutate()
  }

  const reloadButton = (
    <Button size="sm" variant="outline" onClick={reload} disabled={isValidating}>
      <RefreshCwIcon data-icon="inline-start" className={isValidating ? "animate-spin" : undefined} />
      {isValidating ? "Loading…" : "Reload document"}
    </Button>
  )

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs font-medium text-muted-foreground">{label}</figcaption>
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
        {!mediaId ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-sm text-muted-foreground">
            <ImageOffIcon className="size-5" aria-hidden="true" />
            Not provided
          </div>
        ) : isLoading ? (
          <Skeleton className="size-full rounded-none" aria-label={`Loading ${label}`} />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-4 text-center text-sm text-muted-foreground" role="alert">
            <ImageOffIcon className="size-5" aria-hidden="true" />
            {getErrorMessage(error, "The document is unavailable.")}
            {reloadButton}
          </div>
        ) : expired || imageFailed ? (
          <div className="flex flex-col items-center gap-3 p-4 text-center text-sm text-muted-foreground">
            <TimerOffIcon className="size-5" aria-hidden="true" />
            {expired ? "This secure link has expired." : "The document could not be displayed. The link may have expired."}
            {reloadButton}
          </div>
        ) : data && isPdf(data.url, data.mimeType) ? (
          <div className="flex flex-col items-center gap-3 p-4 text-center text-sm text-muted-foreground">
            <FileTextIcon className="size-5" aria-hidden="true" />
            PDF document
            <Button
              size="sm"
              variant="outline"
              render={<a href={data.url} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Open document
            </Button>
          </div>
        ) : data ? (
          // Signed URLs come from arbitrary storage hosts, so a plain img avoids next/image domain config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.url}
            alt={label}
            className="size-full object-contain"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : null}
      </div>
      {data && !expired && !imageFailed && !isPdf(data.url, data.mimeType) && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="xs"
            variant="ghost"
            render={<a href={data.url} target="_blank" rel="noopener noreferrer" />}
            nativeButton={false}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            Open full size
          </Button>
          <Button size="xs" variant="ghost" onClick={reload} disabled={isValidating}>
            <RefreshCwIcon data-icon="inline-start" />
            Reload
          </Button>
        </div>
      )}
    </figure>
  )
}
