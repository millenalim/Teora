import { requireSession } from "@/lib/permissions"
import { getHomes } from "@/actions/homes"
import { getPeople } from "@/actions/people"
import PeopleClient from "@/components/people/PeopleClient"

export default async function PeoplePage() {
  await requireSession()
  const homes = await getHomes()

  if (homes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Add a home first to manage people.
      </div>
    )
  }

  const allPeople = (await Promise.all(homes.map((h) => getPeople(h.id)))).flat()

  return <PeopleClient homes={homes} initialPeople={allPeople} />
}
