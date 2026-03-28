import { requireSession } from "@/lib/permissions"
import { getHomes } from "@/actions/homes"
import { getVendors } from "@/actions/vendors"
import VendorsClient from "@/components/vendors/VendorsClient"

export default async function VendorsPage() {
  await requireSession()
  const homes = await getHomes()

  if (homes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Add a home first to manage vendors.
      </div>
    )
  }

  const allVendors = (await Promise.all(homes.map((h) => getVendors(h.id)))).flat()
  // Deduplicate by vendor id
  const seen = new Set<number>()
  const vendors = allVendors.filter((v) => {
    if (seen.has(v.id)) return false
    seen.add(v.id)
    return true
  })

  return <VendorsClient homes={homes} initialVendors={vendors} />
}
