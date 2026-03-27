"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Home } from "@/app/generated/prisma/client"

const NAV = [
  { label: "Overview", href: "/", icon: "⊞" },
  { label: "Maintenance", href: "/maintenance", icon: "🔧" },
  { label: "Tasks", href: "/tasks", icon: "✓" },
  { label: "Vendors", href: "/vendors", icon: "👥" },
  { label: "Documents", href: "/documents", icon: "📄" },
  { label: "Settings", href: "/settings", icon: "⚙" },
]

export default function Sidebar({ homes }: { homes: Home[] }) {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-gray-200">
        <span className="text-lg font-bold text-indigo-600 tracking-tight">Teora</span>
      </div>

      {homes.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">
            Homes
          </p>
          <ul className="space-y-0.5">
            {homes.map((home) => (
              <li key={home.id}>
                <Link
                  href={`/homes/${home.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: home.colorTag }}
                  />
                  <span className="truncate">{home.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {NAV.map(({ label, href, icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-base leading-none">{icon}</span>
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
