"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember, requireHomeRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getPeople(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.person.findMany({
    where: { homeId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  })
}

export async function searchPeople(homeId: number, query: string) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.person.findMany({
    where: {
      homeId,
      name: { contains: query },
    },
    take: 10,
    orderBy: { name: "asc" },
  })
}

export async function createPerson(data: {
  homeId: number
  name: string
  role?: string
  phone?: string
  email?: string
  company?: string
  notes?: string
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, data.homeId)

  const person = await prisma.person.create({ data })
  revalidatePath(`/people`)
  revalidatePath(`/homes/${data.homeId}`)
  return person
}

export async function updatePerson(
  id: number,
  data: {
    name?: string
    role?: string
    phone?: string
    email?: string
    company?: string
    notes?: string
  }
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const person = await prisma.person.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, person.homeId)

  const updated = await prisma.person.update({ where: { id }, data })
  revalidatePath(`/people`)
  revalidatePath(`/homes/${person.homeId}`)
  return updated
}

export async function deletePerson(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const person = await prisma.person.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(userId, person.homeId, "manager")

  await prisma.person.delete({ where: { id } })
  revalidatePath(`/people`)
  revalidatePath(`/homes/${person.homeId}`)
}
