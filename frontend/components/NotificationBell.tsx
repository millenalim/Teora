"use client"

import { useState, useRef, useEffect } from "react"
import type { Notification } from "@/app/generated/prisma/client"
import { markRead, markAllRead, deleteNotification } from "@/actions/notifications"

const TYPE_ICON: Record<string, string> = {
  maintenance_due: "🔧",
  warranty_expiring: "📋",
  task_due: "✓",
  event_reminder: "📅",
  bulletin: "📣",
  mention: "💬",
}

export default function NotificationBell({
  initialCount,
  initialNotifications,
}: {
  initialCount: number
  initialNotifications: Notification[]
}) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialCount)
  const [notifications, setNotifications] = useState(initialNotifications)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleMarkRead(id: number) {
    await markRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((prev) => Math.max(0, prev - 1))
  }

  async function handleMarkAllRead() {
    await markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  async function handleDelete(id: number) {
    await deleteNotification(id)
    const wasUnread = notifications.find((n) => n.id === id)?.read === false
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (wasUnread) setUnread((prev) => Math.max(0, prev - 1))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">All caught up</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !n.read ? "bg-indigo-50/60" : ""
                  }`}
                >
                  <span className="text-base mt-0.5 flex-shrink-0">
                    {TYPE_ICON[n.type] ?? "•"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-medium text-gray-900" : "text-gray-700"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        title="Mark read"
                        className="text-indigo-500 hover:text-indigo-700 text-xs px-1"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      title="Dismiss"
                      className="text-gray-300 hover:text-red-500 text-xs px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
