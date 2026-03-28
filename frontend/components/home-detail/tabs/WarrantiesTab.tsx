"use client"

import { useState } from "react"
import type { ApplianceWarranty } from "@/app/generated/prisma/client"
import { createWarranty, updateWarranty, deleteWarranty } from "@/actions/home-info"
import { InfoSection, InfoCard, Field } from "../InfoSection"
import SimpleModal from "../SimpleModal"

export default function WarrantiesTab({ homeId, initialData }: { homeId: number; initialData: ApplianceWarranty[] }) {
  const [items, setItems] = useState(initialData)
  const [editing, setEditing] = useState<ApplianceWarranty | null | "new">(null)

  function fmt(d: Date | null | undefined) { return d ? new Date(d).toISOString().slice(0, 10) : "" }
  function isExpired(d: Date | null | undefined) { return d && new Date(d) < new Date() }

  const fields = [
    { name: "appliance", label: "Appliance", required: true, placeholder: "e.g. Refrigerator" },
    { name: "brand", label: "Brand" },
    { name: "model", label: "Model #" },
    { name: "serialNumber", label: "Serial #" },
    { name: "purchasedFrom", label: "Purchased from" },
    { name: "purchaseDate", label: "Purchase date", type: "date" },
    { name: "warrantyExpiry", label: "Warranty expiry", type: "date" },
    { name: "notes", label: "Notes", multiline: true },
  ]

  async function handleSave(data: Record<string, string>) {
    const payload = {
      appliance: data.appliance,
      brand: data.brand || undefined,
      model: data.model || undefined,
      serialNumber: data.serialNumber || undefined,
      purchasedFrom: data.purchasedFrom || undefined,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
      notes: data.notes || undefined,
    }
    if (editing === "new") {
      const item = await createWarranty({ homeId, ...payload })
      setItems((p) => [...p, item])
    } else if (editing) {
      const item = await updateWarranty(editing.id, payload)
      setItems((p) => p.map((x) => x.id === item.id ? item : x))
    }
    setEditing(null)
  }

  async function handleDelete(id: number) {
    await deleteWarranty(id)
    setItems((p) => p.filter((x) => x.id !== id))
    setEditing(null)
  }

  return (
    <>
      <InfoSection title="Appliance Warranties" count={items.length} onAdd={() => setEditing("new")} emptyText="No warranties added.">
        {items.map((item) => (
          <InfoCard key={item.id} onEdit={() => setEditing(item)}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{item.appliance}</p>
                {(item.brand || item.model) && <p className="text-sm text-gray-500">{[item.brand, item.model].filter(Boolean).join(" — ")}</p>}
              </div>
              {item.warrantyExpiry && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpired(item.warrantyExpiry) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {isExpired(item.warrantyExpiry) ? "Expired" : "Active"}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serial #" value={item.serialNumber} />
              <Field label="Purchased from" value={item.purchasedFrom} />
              <Field label="Purchase date" value={item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : undefined} />
              <Field label="Warranty expiry" value={item.warrantyExpiry ? new Date(item.warrantyExpiry).toLocaleDateString() : undefined} />
            </div>
            {item.notes && <Field label="Notes" value={item.notes} />}
          </InfoCard>
        ))}
      </InfoSection>
      {editing !== null && (
        <SimpleModal
          title={editing === "new" ? "Add warranty" : "Edit warranty"}
          fields={fields}
          defaultValues={editing !== "new" ? { ...editing, purchaseDate: fmt(editing.purchaseDate), warrantyExpiry: fmt(editing.warrantyExpiry) } : undefined}
          onSave={handleSave}
          onDelete={editing !== "new" ? () => handleDelete(editing.id) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
