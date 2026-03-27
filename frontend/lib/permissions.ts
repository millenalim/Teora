import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import type { Session } from "next-auth"

type AuthedSession = Session & { user: NonNullable<Session["user"]> & { id: string } }

const ROLE_RANK: Record<string, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  viewer: 1,
}

export async function requireSession(): Promise<AuthedSession> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return session as AuthedSession
}

export async function requireHomeMember(userId: number, homeId: number) {
  const membership = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId, userId } },
  })
  if (!membership) throw new Error("Access denied")
  return membership
}

export async function requireHomeRole(
  userId: number,
  homeId: number,
  minRole: "viewer" | "manager" | "admin" | "owner"
) {
  const membership = await requireHomeMember(userId, homeId)
  if ((ROLE_RANK[membership.role] ?? 0) < ROLE_RANK[minRole]) {
    throw new Error(`Requires ${minRole} role or higher`)
  }
  return membership
}
