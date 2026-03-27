import { getHomes } from "@/actions/homes"
import HomeCard from "@/components/HomeCard"
import Link from "next/link"

export default async function OverviewPage() {
  const homes = await getHomes()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Homes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {homes.length === 0
              ? "Add your first home to get started"
              : `${homes.length} home${homes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/homes/new"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Add home
        </Link>
      </div>

      {homes.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No homes yet</p>
          <Link
            href="/homes/new"
            className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline"
          >
            Add your first home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {homes.map((home) => (
            <HomeCard key={home.id} home={home} />
          ))}
        </div>
      )}
    </div>
  )
}
