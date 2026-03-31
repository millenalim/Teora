import { getHomes } from "@/actions/homes"
import { getProtocols } from "@/actions/protocols"
import ProtocolsClient from "@/components/protocols/ProtocolsClient"
import type { HomeWithMembers } from "@/types"

export default async function ProtocolsPage() {
  const homes = (await getHomes()) as HomeWithMembers[]
  if (homes.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 text-sm">Add a home to manage protocols.</p>
      </div>
    )
  }

  const protocolsByHome = await Promise.all(homes.map((h) => getProtocols(h.id)))
  const allProtocols = protocolsByHome.flat()

  return <ProtocolsClient homes={homes} initialProtocols={allProtocols} />
}
