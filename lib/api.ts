import type {
  AuthUser,
  MediaAccess,
  Order,
  SellerApplication,
  SellerApplicationDecision,
  SupportTicket,
  TicketStatus,
} from "@/lib/admin-types"

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown }

function extractMessage(payload: unknown): string | null {
  if (!payload) return null
  if (typeof payload === "string") return payload.length < 300 ? payload : null
  if (typeof payload !== "object") return null
  const record = payload as Record<string, unknown>
  const message = record.message
  if (typeof message === "string") return message
  if (Array.isArray(message) && typeof message[0] === "string") return message.join(", ")
  const error = record.error
  if (typeof error === "string") return error
  if (error && typeof error === "object") return extractMessage(error)
  return null
}

function defaultMessage(status: number) {
  switch (status) {
    case 400:
      return "The request was invalid."
    case 401:
      return "Your session has expired. Please sign in again."
    case 403:
      return "You do not have permission to perform this action."
    case 404:
      return "The requested resource was not found."
    case 409:
      return "This action conflicts with the current state of the resource."
    case 429:
      return "Too many requests. Please wait a moment and try again."
    default:
      return status >= 500 ? "The server encountered an error. Please try again." : "Request failed."
  }
}

function unwrap(payload: unknown) {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && "data" in payload) {
    return (payload as { data: unknown }).data
  }
  return payload
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...init } = options
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw new ApiError("Network error. Check your connection and try again.", 0, error)
  }

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    throw new ApiError(extractMessage(payload) ?? defaultMessage(response.status), response.status, payload)
  }

  return unwrap(payload) as T
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function toList<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key] as T[]
    }
  }
  return []
}

function toEntity<T>(payload: unknown, key: string): T {
  if (payload && typeof payload === "object" && key in (payload as object)) {
    return (payload as Record<string, unknown>)[key] as T
  }
  return payload as T
}

/* Auth */

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await apiRequest("/api/v1/auth/me")
    return toEntity<AuthUser | null>(payload, "user")
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function login(email: string, password: string) {
  const payload = await apiRequest("/api/v1/auth/login", { method: "POST", body: { email, password } })
  return toEntity<AuthUser | null>(payload, "user")
}

export async function logout() {
  await apiRequest("/api/v1/auth/logout", { method: "POST" })
}

/* Seller applications */

export async function listSellerApplications() {
  const payload = await apiRequest("/api/v1/admin/seller-applications")
  return toList<SellerApplication>(payload, ["applications", "sellerApplications", "items", "results"])
}

export function reviewSellerApplication(id: string, decision: SellerApplicationDecision, reviewNote?: string) {
  const note = reviewNote?.trim()
  return apiRequest(`/api/v1/admin/seller-applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: note ? { decision, reviewNote: note } : { decision },
  })
}

export function approveSellerApplication(id: string, reviewNote?: string) {
  return reviewSellerApplication(id, "APPROVED", reviewNote)
}

export function rejectSellerApplication(id: string, reviewNote?: string) {
  return reviewSellerApplication(id, "REJECTED", reviewNote)
}

export async function getSellerApplicationMediaAccess(applicationId: string, mediaId: string): Promise<MediaAccess> {
  const payload = await apiRequest<Record<string, unknown>>(
    `/api/v1/admin/seller-applications/${encodeURIComponent(applicationId)}/media/${encodeURIComponent(mediaId)}/access`,
  )
  const url = (payload?.url ?? payload?.signedUrl ?? payload?.accessUrl) as string | undefined
  if (!url) throw new ApiError("The document is unavailable.", 404, payload)
  return {
    url,
    expiresAt: (payload?.expiresAt as string | undefined) ?? null,
    mimeType: (payload?.mimeType ?? payload?.contentType ?? payload?.resourceType) as string | undefined,
  }
}

/* Support */

export async function listAdminSupportTickets() {
  const payload = await apiRequest("/api/v1/support/tickets/admin")
  return toList<SupportTicket>(payload, ["tickets", "items", "results"])
}

export async function getSupportTicket(id: string) {
  const payload = await apiRequest(`/api/v1/support/tickets/${encodeURIComponent(id)}`)
  return toEntity<SupportTicket>(payload, "ticket")
}

export function replyToSupportTicket(id: string, message: string) {
  return apiRequest(`/api/v1/support/tickets/${encodeURIComponent(id)}/replies`, {
    method: "POST",
    body: { message: message.trim() },
  })
}

export function updateSupportTicketStatus(id: string, status: TicketStatus) {
  return apiRequest(`/api/v1/support/tickets/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status },
  })
}

/* Orders */

export const ADMIN_ORDERS_LIST_PATH = "/api/v1/orders/admin"

export async function listAdminOrders() {
  const payload = await apiRequest(ADMIN_ORDERS_LIST_PATH)
  return toList<Order>(payload, ["orders", "items", "results"])
}

export async function getOrder(id: string) {
  const payload = await apiRequest(`/api/v1/orders/${encodeURIComponent(id)}`)
  return toEntity<Order>(payload, "order")
}

export function markOrderDelivered(id: string) {
  return apiRequest(`/api/v1/orders/${encodeURIComponent(id)}/admin-delivered`, { method: "PATCH" })
}

export function adminConfirmOrderDelivery(id: string) {
  return apiRequest(`/api/v1/orders/${encodeURIComponent(id)}/admin-confirm-delivery`, { method: "POST" })
}
