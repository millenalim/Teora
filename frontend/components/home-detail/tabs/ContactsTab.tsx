"use client"

import { useState } from "react"
import type { ImportantContact } from "@/app/generated/prisma/client"
import { createContact, updateContact, deleteContact } from "@/actions/home-info"
import { InfoSection, InfoCard, Field } from "../InfoSection"
import SimpleModal from "../SimpleModal"

const CONTACT_TYPES = [
  "hoa","insurance","mortgage","pest_control","landscaping","pool","security","other"
].map((v) => ({ value: v, label: v.replace("_", " ") }))

export default function ContactsTab({ homeId, initialData }: { homeId: number; initialData: ImportantContact[] }) {
  const [items, setItems] = useState(initialData)
  const [editing, setEditing] = useState<ImportantContact | null | "new">(null)

  const fields = [
    { name: "name", label: "Name", required: true },
    { name: "contactType", label: "Type", options: CONTACT_TYPES },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "email", label: "Email", type: "email" },
    { name: "accountNumber", label: "Account #" },
    { name: "policyNumber", label: "Policy #" },
    { name: "notes", label: "Notes", multiline: true },
  ]

  async function handleSave(data: Record<string, string>) {
    const payload = { name: data.name, contactType: data.contactType || undefined, phone: data.phone || undefined, email: data.email || undefined, accountNumber: data.accountNumber || undefined, policyNumber: data.policyNumber || undefined, notes: data.notes || undefined }
    if (editing === "new") {
      const item = await createContact({ homeId, ...payload })
      setItems((p) => [...p, item])
    } else if (editing) {
      const item = await updateContact(editing.id, payload)
      setItems((p) => p.map((x) => x.id === item.id ? item : x))
    }
    setEditing(null)
  }

  async function handleDelete(id: number) {
    await deleteContact(id)
    setItems((p) => p.filter((x) => x.id !== id))
    setEditing(null)
  }

  return (
    <>
      <InfoSection title="Important Contacts" count={items.length} onAdd={() => setEditing("new")} emptyText="No contacts added.">
        {items.map((item) => (
          <InfoCard key={item.id} onEdit={() => setEditing(item)}>
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold text-gray-900">{item.name}</p>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{item.contactType.replace("_"," ")}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" value={item.phone} />
              <Field label="Email" value={item.email} />
              <Field label="Account #" value={item.accountNumber} />
              <Field label="Policy #" value={item.policyNumber} />
            </div>
            {item.notes && <Field label="Notes" value={item.notes} />}
          </InfoCard>
        ))}
      </InfoSection>
      {editing !== null && (
        <SimpleModal
          title={editing === "new" ? "Add contact" : "Edit contact"}
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
