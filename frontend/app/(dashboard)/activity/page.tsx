import { getHomes } from "@/actions/homes"
import { getActivityLogs } from "@/actions/activity"
import ActivityClient from "@/components/activity/ActivityClient"
import type { HomeWithMembers } from "@/types"

export default async function ActivityPage() {
  const homes = (await getHomes()) as HomeWithMembers[]
  if (homes.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 text-sm">Add a home to start logging activity.</p>
      </div>
    )
  }

  // Load logs for all homes in parallel, take the most recent 100 total
  const logsByHome = await Promise.all(homes.map((h) => getActivityLogs(h.id, 100)))
  const allLogs = logsByHome
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return <ActivityClient homes={homes} initialLogs={allLogs} />
}
