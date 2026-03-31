import { getHomes } from "@/actions/homes"
import { getLists } from "@/actions/lists"
import ListsClient from "@/components/lists/ListsClient"
import type { HomeWithMembers, ListWithItems } from "@/types"

export default async function ListsPage() {
  const homes = (await getHomes()) as HomeWithMembers[]
  if (homes.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 text-sm">Add a home to create lists.</p>
      </div>
    )
  }

  const listsByHome = await Promise.all(homes.map((h) => getLists(h.id)))
  const allLists = (listsByHome.flat() as ListWithItems[]).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return <ListsClient homes={homes} initialLists={allLists} />
}
