import { requireSession } from "@/lib/permissions"
import { getHomes } from "@/actions/homes"
import { getMaintenanceTasks } from "@/actions/maintenance"
import { getCompletionLogs } from "@/actions/completion-logs"
import MaintenanceClient from "@/components/maintenance/MaintenanceClient"

export default async function MaintenancePage() {
  await requireSession()
  const homes = await getHomes()

  if (homes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Add a home first to manage maintenance.
      </div>
    )
  }

  const allTasks = (await Promise.all(homes.map((h) => getMaintenanceTasks(h.id)))).flat()

  // Prefetch completion logs for all maintenance tasks
  const logsMap: Record<number, Awaited<ReturnType<typeof getCompletionLogs>>> = {}
  await Promise.all(
    allTasks.map(async (t) => {
      logsMap[t.id] = await getCompletionLogs(t.homeId, "maintenance", t.id)
    })
  )

  return <MaintenanceClient homes={homes} initialTasks={allTasks} initialLogs={logsMap} />
}
