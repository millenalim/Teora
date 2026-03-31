import { getHomes } from "@/actions/homes"
import { getDocuments } from "@/actions/documents"
import DocumentsClient from "@/components/documents/DocumentsClient"
import type { HomeWithMembers } from "@/types"

export default async function DocumentsPage() {
  const homes = (await getHomes()) as HomeWithMembers[]
  if (homes.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 text-sm">Add a home to manage documents.</p>
      </div>
    )
  }

  const docsByHome = await Promise.all(homes.map((h) => getDocuments(h.id)))
  const allDocs = docsByHome.flat().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return <DocumentsClient homes={homes} initialDocuments={allDocs} />
}
