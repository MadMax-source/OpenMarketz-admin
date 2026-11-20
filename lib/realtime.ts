import { io, type Socket } from "socket.io-client"
import { API_BASE_URL } from "@/lib/api"

let socket: Socket | null = null

export function getRealtimeUrl() {
  return (process.env.NEXT_PUBLIC_SOCKET_URL ?? API_BASE_URL) || null
}

export function connectRealtime(): Socket | null {
  if (typeof window === "undefined") return null
  const url = getRealtimeUrl()
  if (!url) return null
  if (!socket) {
    socket = io(url, { withCredentials: true, transports: ["websocket", "polling"] })
  } else if (socket.disconnected) {
    socket.connect()
  }
  return socket
}

export function disconnectRealtime() {
  socket?.disconnect()
  socket = null
}
