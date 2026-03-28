"use client"

import { useState } from "react"
import type { Person, Home, HomeMember, User } from "@/app/generated/prisma/client"
import PersonModal from "./PersonModal"

type HomeWithMembers = Home & { members: (HomeMember & { user: User })[] }
type RoleFilter = "all" | "resident" | "staff" | "contact"

const ROLE_COLOR: Record<string, string> = {
  resident: "bg-indigo-100 text-indigo-700",
  staff: "bg-amber-100 text-amber-700",
  contact: "bg-gray-100 text-gray-600",
}

export default function PeopleClient({
  homes,
  initialPeople,
}: {
  homes: HomeWithMembers[]
  initialPeople: Person[]
}) {
  const [people, setPeople] = useState(initialPeople)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [homeFilter, setHomeFilter] = useState<number | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)

  const filtered = people.filter((p) => {
    if (roleFilter !== "all" && p.role !== roleFilter) return false
    if (homeFilter !== "all" && p.homeId !== homeFilter) return false
    return true
  })

  function handleSaved(person: Person) {
    setPeople((prev) => {
      const idx = prev.findIndex((p) => p.id === person.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = person; return n }
      return [...prev, person]
    })
    setModalOpen(false)
    setEditing(null)
  }

  function handleDeleted(id: number) {
    setPeople((prev) => prev.filter((p) => p.id !== id))
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-gray-900">People</h1>

          {/* Role tabs */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {(["all", "resident", "staff", "contact"] as RoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-sm capitalize transition-colors ${roleFilter === r ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {r}
              </button>
            ))}
          </div>

          <select
            value={homeFilter}
            onChange={(e) => setHomeFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All homes</option>
            {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Person
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          No people found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((person) => {
            const home = homes.find((h) => h.id === person.homeId)
            return (
              <button
                key={person.id}
                onClick={() => { setEditing(person); setModalOpen(true) }}
                className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold uppercase flex-shrink-0">
                    {person.name[0]}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLOR[person.role] ?? ROLE_COLOR.contact}`}>
                    {person.role}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{person.name}</p>
                {person.company && <p className="text-sm text-gray-500">{person.company}</p>}
                {person.phone && <p className="text-xs text-gray-400 mt-1">{person.phone}</p>}
                {person.email && <p className="text-xs text-gray-400">{person.email}</p>}
                {home && (
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: home.colorTag }} />
                    {home.name}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <PersonModal
          homes={homes}
          person={editing}
          defaultHomeId={homeFilter === "all" ? homes[0]?.id : homeFilter}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
