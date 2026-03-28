"use client"

import { useState } from "react"
import type { SmartHomeSystem } from "@/app/generated/prisma/client"
import { createSmartHomeSystem, updateSmartHomeSystem, deleteSmartHomeSystem } from "@/actions/home-info"
import { InfoSection, InfoCard, Field } from "../InfoSection"
import SimpleModal from "../SimpleModal"

export default function SmartHomeTab({ homeId, initialData }: { homeId: number; initialData: SmartHomeSystem[] }) {
  const [items, setItems] = useState(initialData)
  const [editing, setEditing] = useState<SmartHomeSystem | null | "new">(null)

  const fields = [
    { name: "systemName", label: "System name", required: true, placeholder: "e.g. Google Home" },
    { name: "appName", label: "App name" },
    { name: "hubModel", label: "Hub model" },
    { name: "accountEmail", label: "Account email", type: "email" },
    { name: "connectedDevices", label: "Connected devices", multiline: true, placeholder: "e.g. Thermostat, front doorbell, garage" },
    { name: "notes", label: "Notes", multiline: true },
  ]

  async function handleSave(data: Record<string, string>) {
    const payload = { systemName: data.systemName, appName: data.appName || undefined, hubModel: data.hubModel || undefined, accountEmail: data.accountEmail || undefined, connectedDevices: data.connectedDevices || undefined, notes: data.notes || undefined }
    if (editing === "new") {
      const item = await createSmartHomeSystem({ homeId, ...payload })
      setItems((p) => [...p, item])
    } else if (editing) {
      const item = await updateSmartHomeSystem(editing.id, payload)
      setItems((p) => p.map((x) => x.id === item.id ? item : x))
    }
    setEditing(null)
  }

  async function handleDelete(id: number) {
    await deleteSmartHomeSystem(id)
    setItems((p) => p.filter((x) => x.id !== id))
    setEditing(null)
  }

  return (
    <>
      <InfoSection title="Smart Home Systems" count={items.length} onAdd={() => setEditing("new")} emptyText="No smart home systems added.">
        {items.map((item) => (
          <InfoCard key={item.id} onEdit={() => setEditing(item)}>
            <p className="font-semibold text-gray-900 mb-2">{item.systemName}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="App" value={item.appName} />
              <Field label="Hub model" value={item.hubModel} />
              <Field label="Account email" value={item.accountEmail} />
            </div>
            {item.connectedDevices && <Field label="Connected devices" value={item.connectedDevices} />}
            {item.notes && <Field label="Notes" value={item.notes} />}
          </InfoCard>
        ))}
      </InfoSection>
      {editing !== null && (
        <SimpleModal
          title={editing === "new" ? "Add system" : "Edit system"}
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
