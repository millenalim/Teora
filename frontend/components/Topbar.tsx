"use client"

import { useState } from "react"
import { logout } from "@/actions/auth"
import NotificationBell from "@/components/NotificationBell"
import type { Notification } from "@/app/generated/prisma/client"

type TopbarUser = { name?: string | null; email?: string | null; image?: string | null }

export default function Topbar({
  user,
  unreadCount,
  notifications,
}: {
  user: TopbarUser
  unreadCount: number
  notifications: Notification[]
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-end gap-3 px-6">
      <NotificationBell initialCount={unreadCount} initialNotifications={notifications} />

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold uppercase">
            {(user.name ?? user.email ?? "?")[0]!}
          </span>
          <span className="hidden sm:inline font-medium">{user.name ?? user.email}</span>
          <span className="text-gray-400">▾</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-md z-10 py-1">
            <button
              onClick={async () => {
                setMenuOpen(false)
                await logout()
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
