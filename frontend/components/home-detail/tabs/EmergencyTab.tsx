"use client"

import { useState } from "react"
import type { EmergencyInfo } from "@/app/generated/prisma/client"
import { createEmergencyInfo, updateEmergencyInfo, deleteEmergencyInfo } from "@/actions/home-info"
import { InfoSection, InfoCard, Field } from "../InfoSection"
import SimpleModal from "../SimpleModal"

export default function EmergencyTab({ homeId, initialData }: { homeId: number; initialData: EmergencyInfo[] }) {
  const [items, setItems] = useState(initialData)
  const [editing, setEditing] = useState<EmergencyInfo | null | "new">(null)

  const fields = [
    { name: "item", label: "Item", required: true, placeholder: "e.g. Main water shutoff" },
    { name: "location", label: "Location", placeholder: "e.g. Utility closet, left of water heater" },
    { name: "details", label: "Details", multiline: true },
    { name: "notes", label: "Notes", multiline: true },
  ]

  async function handleSave(data: Record<string, string>) {
    const payload = { item: data.item, location: data.location || undefined, details: data.details || undefined, notes: data.notes || undefined }
    if (editing === "new") {
      const item = await createEmergencyInfo({ homeId, ...payload })
      setItems((p) => [...p, item])
    } else if (editing) {
      const item = await updateEmergencyInfo(editing.id, payload)
      setItems((p) => p.map((x) => x.id === item.id ? item : x))
    }
    setEditing(null)
  }

  async function handleDelete(id: number) {
    await deleteEmergencyInfo(id)
    setItems((p) => p.filter((x) => x.id !== id))
    setEditing(null)
  }

  return (
    <>
      <InfoSection title="Emergency Info" count={items.length} onAdd={() => setEditing("new")} emptyText="No emergency info added.">
        {items.map((item) => (
          <InfoCard key={item.id} onEdit={() => setEditing(item)}>
            <p className="font-semibold text-gray-900 mb-1">{item.item}</p>
            {item.location && <p className="text-sm text-indigo-600 mb-2">📍 {item.location}</p>}
            {item.details && <p className="text-sm text-gray-700">{item.details}</p>}
            {item.notes && <Field label="Notes" value={item.notes} />}
          </InfoCard>
        ))}
      </InfoSection>
      {editing !== null && (
        <SimpleModal
          title={editing === "new" ? "Add emergency info" : "Edit emergency info"}
          fields={fields}
          defaultValues={editing !== "new" ? editing : undefined}
          onSave={handleSave}
          onDelete={editing !== "new" ? () => handleDelete(editing.id) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
