"use client"

import { useState } from "react"
import type { Home, HomeMember, User } from "@/app/generated/prisma/client"
import { createVendor, updateVendor, deleteVendor } from "@/actions/vendors"

type HomeWithMembers = Home & { members: (HomeMember & { user: User })[] }
type VendorWithHomes = {
  id: number; companyName: string; serviceType: string | null; phone: string | null
  email: string | null; website: string | null; pricing: string | null
  rating: number | null; notes: string | null
  createdAt: Date; updatedAt: Date
  vendorHomes: { homeId: number }[]
}

export default function VendorModal({
  homes,
  vendor,
  defaultHomeId,
  onSaved,
  onDeleted,
  onClose,
}: {
  homes: HomeWithMembers[]
  vendor: VendorWithHomes | null
  defaultHomeId?: number
  onSaved: (v: VendorWithHomes) => void
  onDeleted: (id: number) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [selectedHomeIds, setSelectedHomeIds] = useState<number[]>(
    vendor ? vendor.vendorHomes.map((vh) => vh.homeId) : defaultHomeId ? [defaultHomeId] : homes[0] ? [homes[0].id] : []
  )
  const editing = !!vendor

  function toggleHome(id: number) {
    setSelectedHomeIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selectedHomeIds.length === 0) { setError("Select at least one home"); return }
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const ratingRaw = form.get("rating") as string
    try {
      const data = {
        companyName: form.get("companyName") as string,
        serviceType: (form.get("serviceType") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
        email: (form.get("email") as string) || undefined,
        website: (form.get("website") as string) || undefined,
        pricing: (form.get("pricing") as string) || undefined,
        rating: ratingRaw ? parseInt(ratingRaw) : undefined,
        notes: (form.get("notes") as string) || undefined,
      }
      const saved = editing
        ? await updateVendor(vendor.id, data, selectedHomeIds[0])
        : await createVendor({ homeIds: selectedHomeIds, ...data })
      onSaved(saved as VendorWithHomes)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!vendor) return
    setLoading(true)
    try {
      await deleteVendor(vendor.id, selectedHomeIds[0] ?? homes[0]?.id)
      onDeleted(vendor.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{editing ? "Edit vendor" : "Add vendor"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homes</label>
            <div className="flex gap-2 flex-wrap">
              {homes.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => toggleHome(h.id)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedHomeIds.includes(h.id) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: h.colorTag }} />
                  {h.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company name <span className="text-red-500">*</span></label>
            <input name="companyName" required defaultValue={vendor?.companyName} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service type</label>
              <input name="serviceType" defaultValue={vendor?.serviceType ?? ""} placeholder="e.g. Plumbing" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <select name="rating" defaultValue={vendor?.rating ?? ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">—</option>
                {[1,2,3,4,5].map((r) => <option key={r} value={r}>{"★".repeat(r)} {r}/5</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" type="tel" defaultValue={vendor?.phone ?? ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" defaultValue={vendor?.email ?? ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing notes</label>
            <input name="pricing" defaultValue={vendor?.pricing ?? ""} placeholder="e.g. $85/hr, flat fee" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={2} defaultValue={vendor?.notes ?? ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            {editing && (
              <button type="button" onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)} disabled={loading} className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving…" : editing ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
