import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getHomes } from "@/actions/homes"
import Sidebar from "@/components/Sidebar"
import Topbar from "@/components/Topbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const homes = await getHomes()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar homes={homes} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
