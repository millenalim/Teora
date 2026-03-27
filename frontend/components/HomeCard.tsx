import Link from "next/link"
import type { Home, HomeMember, User } from "@/app/generated/prisma/client"

type HomeWithMembers = Home & {
  members: (HomeMember & { user: User })[]
}

export default function HomeCard({ home }: { home: HomeWithMembers }) {
  return (
    <Link
      href={`/homes/${home.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
          style={{ backgroundColor: home.colorTag }}
        />
        <span className="text-xs text-gray-400">{home.members.length} member{home.members.length !== 1 ? "s" : ""}</span>
      </div>

      <h2 className="text-base font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
        {home.name}
      </h2>
      <p className="text-sm text-gray-500 mt-0.5 truncate">{home.address}</p>

      {(home.sqft || home.purpose) && (
        <div className="flex gap-3 mt-3 text-xs text-gray-400">
          {home.sqft && <span>{home.sqft.toLocaleString()} sqft</span>}
          {home.purpose && <span>{home.purpose}</span>}
        </div>
      )}
    </Link>
  )
}
