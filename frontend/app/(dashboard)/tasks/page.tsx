import { requireSession } from "@/lib/permissions"
import { getHomes } from "@/actions/homes"
import { getTasks } from "@/actions/tasks"
import TasksClient from "@/components/tasks/TasksClient"

export default async function TasksPage() {
  const session = await requireSession()
  const homes = await getHomes()

  if (homes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Add a home first to manage tasks.
      </div>
    )
  }

  // Load tasks for all homes
  const allTasks = (
    await Promise.all(homes.map((h) => getTasks(h.id)))
  ).flat()

  return <TasksClient homes={homes} initialTasks={allTasks} />
}
