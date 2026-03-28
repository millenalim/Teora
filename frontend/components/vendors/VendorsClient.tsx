"use client"

import { useState } from "react"
import type { Home, HomeMember, User } from "@/app/generated/prisma/client"
import VendorModal from "./VendorModal"

type HomeWithMembers = Home & { members: (HomeMember & { user: User })[] }
type VendorWithHomes = {
  id: number; companyName: string; serviceType: string | null; phone: string | null
  email: string | null; website: string | null; pricing: string | null
  rating: number | null; notes: string | null
  createdAt: Date; updatedAt: Date
  vendorHomes: { homeId: number }[]
}

const STARS = [1, 2, 3, 4, 5]

export default function VendorsClient({
  homes,
  initialVendors,
}: {
  homes: HomeWithMembers[]
  initialVendors: VendorWithHomes[]
}) {
  const [vendors, setVendors] = useState(initialVendors)
  const [homeFilter, setHomeFilter] = useState<number | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<VendorWithHomes | null>(null)

  const filtered = vendors.filter((v) => {
    if (homeFilter === "all") return true
    return v.vendorHomes.some((vh) => vh.homeId === homeFilter)
  })

  function handleSaved(vendor: VendorWithHomes) {
    setVendors((prev) => {
      const idx = prev.findIndex((v) => v.id === vendor.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = vendor; return n }
      return [...prev, vendor]
    })
    setModalOpen(false)
    setEditing(null)
  }

  function handleDeleted(id: number) {
    setVendors((prev) => prev.filter((v) => v.id !== id))
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
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
          + Vendor
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          No vendors found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendor) => (
            <button
              key={vendor.id}
              onClick={() => { setEditing(vendor); setModalOpen(true) }}
              className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{vendor.companyName}</p>
                {vendor.rating && (
                  <span className="text-xs text-amber-500 flex-shrink-0">
                    {"★".repeat(vendor.rating)}{"☆".repeat(5 - vendor.rating)}
                  </span>
                )}
              </div>
              {vendor.serviceType && <p className="text-sm text-gray-500 mb-2">{vendor.serviceType}</p>}
              {vendor.phone && <p className="text-xs text-gray-400">{vendor.phone}</p>}
              {vendor.email && <p className="text-xs text-gray-400">{vendor.email}</p>}
              {vendor.pricing && <p className="text-xs text-gray-500 mt-1 italic">{vendor.pricing}</p>}
              <div className="flex gap-1 mt-2 flex-wrap">
                {vendor.vendorHomes.map((vh) => {
                  const home = homes.find((h) => h.id === vh.homeId)
                  return home ? (
                    <span key={vh.homeId} className="flex items-center gap-1 text-xs text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: home.colorTag }} />
                      {home.name}
                    </span>
                  ) : null
                })}
              </div>
            </button>
          ))}
        </div>
      )}

      {modalOpen && (
        <VendorModal
          homes={homes}
          vendor={editing}
          defaultHomeId={homeFilter === "all" ? homes[0]?.id : homeFilter}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
