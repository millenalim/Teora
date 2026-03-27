import { requireSession } from "@/lib/permissions"
import { getHomes } from "@/actions/homes"
import { getCalendarData } from "@/actions/events"
import CalendarClient from "@/components/calendar/CalendarClient"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  await requireSession()
  const homes = await getHomes()

  const params = await searchParams
  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1

  if (homes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Add a home first to use the calendar.
      </div>
    )
  }

  const { events, tasks } = await getCalendarData(
    homes.map((h) => h.id),
    year,
    month
  )

  return (
    <CalendarClient
      homes={homes}
      events={events}
      tasks={tasks}
      year={year}
      month={month}
    />
  )
}
