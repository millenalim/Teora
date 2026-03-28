"use client"

import { useState } from "react"
import type { ServiceProvider } from "@/app/generated/prisma/client"
import { createServiceProvider, updateServiceProvider, deleteServiceProvider } from "@/actions/home-info"
import { InfoSection, InfoCard, Field } from "../InfoSection"
import SimpleModal from "../SimpleModal"

export default function ServiceProvidersTab({ homeId, initialData }: { homeId: number; initialData: ServiceProvider[] }) {
  const [items, setItems] = useState(initialData)
  const [editing, setEditing] = useState<ServiceProvider | null | "new">(null)

  const fields = [
    { name: "name", label: "Name", required: true },
    { name: "serviceType", label: "Service type", placeholder: "e.g. Plumbing" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "email", label: "Email", type: "email" },
    { name: "notes", label: "Notes", multiline: true },
  ]

  async function handleSave(data: Record<string, string>) {
    const payload = { name: data.name, serviceType: data.serviceType || undefined, phone: data.phone || undefined, email: data.email || undefined, notes: data.notes || undefined }
    if (editing === "new") {
      const item = await createServiceProvider({ homeId, ...payload })
      setItems((p) => [...p, item])
    } else if (editing) {
      const item = await updateServiceProvider(editing.id, payload)
      setItems((p) => p.map((x) => x.id === item.id ? item : x))
    }
    setEditing(null)
  }

  async function handleDelete(id: number) {
    await deleteServiceProvider(id)
    setItems((p) => p.filter((x) => x.id !== id))
    setEditing(null)
  }

  return (
    <>
      <InfoSection title="Service Providers" count={items.length} onAdd={() => setEditing("new")} emptyText="No service providers added.">
        {items.map((item) => (
          <InfoCard key={item.id} onEdit={() => setEditing(item)}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={item.name} />
              <Field label="Service type" value={item.serviceType} />
              <Field label="Phone" value={item.phone} />
              <Field label="Email" value={item.email} />
            </div>
            {item.notes && <Field label="Notes" value={item.notes} />}
          </InfoCard>
        ))}
      </InfoSection>
      {editing !== null && (
        <SimpleModal
          title={editing === "new" ? "Add service provider" : "Edit service provider"}
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
