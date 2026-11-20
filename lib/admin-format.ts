import type {
  AddressSnapshot,
  Order,
  OrderItem,
  PersonRef,
  SellerApplication,
  SupportReply,
  SupportTicket,
} from "@/lib/admin-types"

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" })
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

function parseDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value?: string | null) {
  const date = parseDate(value)
  return date ? dateFormatter.format(date) : "—"
}

export function formatDateTime(value?: string | null) {
  const date = parseDate(value)
  return date ? dateTimeFormatter.format(date) : "—"
}

export function timestamp(value?: string | null) {
  return parseDate(value)?.getTime() ?? 0
}

export function formatAmount(value?: number | string | null, currency?: string | null) {
  if (value === null || value === undefined || value === "") return "—"
  const amount = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(amount)) return String(value)
  if (currency) {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
    } catch {
      // Unknown currency codes fall through to plain number formatting.
    }
  }
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

export function humanize(value?: string | null) {
  if (!value) return "—"
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function personName(person?: PersonRef | null) {
  if (!person) return null
  const full = [person.firstName, person.lastName].filter(Boolean).join(" ")
  return person.name || full || null
}

export function display(value?: string | null) {
  return value && value.trim() ? value : "—"
}

/* Seller applications */

const AWAITING_REVIEW = new Set(["PENDING", "SUBMITTED", "UNDER_REVIEW", "IN_REVIEW", "AWAITING_REVIEW"])

export function isAwaitingReview(status?: string | null) {
  return AWAITING_REVIEW.has((status ?? "").toUpperCase())
}

export function applicantEmail(app: SellerApplication) {
  return app.user?.email || app.email || app.businessEmail || null
}

export function ownerName(app: SellerApplication) {
  return app.ownerName || [app.ownerFirstName, app.ownerLastName].filter(Boolean).join(" ") || personName(app.user) || null
}

export function storeHandle(app: SellerApplication) {
  return app.handle || app.storeHandle || null
}

export function submittedAt(app: SellerApplication) {
  return app.submittedAt || app.createdAt || null
}

export function categoryNames(app: SellerApplication) {
  return (app.categories ?? []).map((category) => (typeof category === "string" ? category : category.name))
}

export function identityMediaId(app: SellerApplication) {
  return app.identityDocument?.id || app.identityDocumentId || null
}

export function selfieMediaId(app: SellerApplication) {
  return app.selfie?.id || app.selfieId || null
}

/* Support */

export function ticketNumber(ticket: SupportTicket) {
  return ticket.ticketNumber || `#${ticket.id.slice(0, 8)}`
}

export function ticketCustomerName(ticket: SupportTicket) {
  return ticket.customerName || ticket.name || personName(ticket.user) || "Unknown customer"
}

export function ticketEmail(ticket: SupportTicket) {
  return ticket.email || ticket.user?.email || null
}

export function ticketTopic(ticket: SupportTicket) {
  return ticket.topic || ticket.subject || "General"
}

export function ticketReplies(ticket: SupportTicket) {
  return ticket.replies ?? ticket.messages ?? []
}

export function ticketOrderNumber(ticket: SupportTicket) {
  return ticket.order?.orderNumber || ticket.orderNumber || ticket.orderId || null
}

const STAFF_ROLES = new Set(["ADMIN", "SUPPORT", "STAFF"])

export function isStaffReply(reply: SupportReply) {
  if (typeof reply.isAdmin === "boolean") return reply.isAdmin
  if (typeof reply.isStaff === "boolean") return reply.isStaff
  const role = (reply.authorRole || reply.senderRole || reply.author?.role || "").toUpperCase()
  return STAFF_ROLES.has(role)
}

export function replyText(reply: SupportReply) {
  return reply.message || reply.body || ""
}

/* Orders */

export function orderNumber(order: Order) {
  return order.orderNumber || `#${order.id.slice(0, 8)}`
}

export function orderBuyer(order: Order) {
  return order.buyer ?? order.user ?? null
}

export function orderSellerName(order: Order) {
  const store = order.seller ?? order.store
  const fromItems = order.items?.find((item) => item.seller)?.seller
  const ref = store ?? fromItems
  return ref?.storeName || ref?.brandName || ref?.name || null
}

export function orderPaymentStatus(order: Order) {
  return order.paymentStatus || order.payment?.status || null
}

export function orderShipmentStatus(order: Order) {
  return order.shipmentStatus || order.shipment?.status || null
}

export function orderTotal(order: Order) {
  return order.total ?? order.totalAmount ?? order.payment?.amount ?? null
}

export function orderAddress(order: Order): AddressSnapshot | null {
  return order.shippingAddress ?? order.addressSnapshot ?? null
}

export function itemName(item: OrderItem) {
  return item.productName || item.title || item.name || item.product?.title || item.product?.name || "Item"
}

export function isOrderDelivered(order: Order) {
  return order.status === "DELIVERED" || Boolean(order.deliveredAt || order.shipment?.deliveredAt)
}

export function orderNeedsAttention(order: Order) {
  if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(order.status)) return true
  return isOrderDelivered(order) && !order.adminConfirmedAt
}
