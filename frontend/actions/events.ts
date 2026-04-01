"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember, requireHomeRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getEvents(homeId: number, year: number, month: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  return prisma.event.findMany({
    where: {
      homeId,
      OR: [
        { startDate: { gte: start, lte: end } },
        { endDate: { gte: start, lte: end } },
      ],
    },
    orderBy: { startDate: "asc" },
  })
}

export async function getCalendarData(homeIds: number[], year: number, month: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)

  // Verify membership in all requested homes
  await Promise.all(homeIds.map((id) => requireHomeMember(userId, id)))

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const [events, tasks] = await Promise.all([
    prisma.event.findMany({
      where: {
        homeId: { in: homeIds },
        OR: [
          { startDate: { gte: start, lte: end } },
          { endDate: { gte: start, lte: end } },
        ],
      },
      include: { home: { select: { id: true, name: true, colorTag: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.task.findMany({
      where: {
        homeId: { in: homeIds },
        status: { not: "done" },
        OR: [
          // Non-recurring: anchor date falls within month
          { endDate: { gte: start, lte: end }, recurrence: null },
          { startDate: { gte: start, lte: end }, endDate: null, recurrence: null },
          // Recurring: anchor date is before end of month AND (no recurrenceEndDate OR recurrenceEndDate >= start of month)
          {
            recurrence: { not: null },
            OR: [
              { endDate: { lte: end } },
              { startDate: { lte: end } },
            ],
            AND: [
              {
                OR: [
                  { recurrenceEndDate: null },
                  { recurrenceEndDate: { gte: start } },
                ],
              },
            ],
          },
        ],
      },
      include: { home: { select: { id: true, name: true, colorTag: true } } },
      orderBy: { endDate: "asc" },
    }),
  ])

  return { events, tasks }
}

export async function createEvent(data: {
  homeId: number
  title: string
  startDate?: Date
  endDate?: Date
  startTime?: string
  notes?: string
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, data.homeId)

  const event = await prisma.event.create({ data })
  revalidatePath(`/calendar`)
  return event
}

export async function updateEvent(
  id: number,
  data: {
    title?: string
    startDate?: Date | null
    endDate?: Date | null
    startTime?: string | null
    notes?: string | null
  }
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const event = await prisma.event.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, event.homeId)

  const updated = await prisma.event.update({ where: { id }, data })
  revalidatePath(`/calendar`)
  return updated
}

export async function deleteEvent(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const event = await prisma.event.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(userId, event.homeId, "manager")

  await prisma.event.delete({ where: { id } })
  revalidatePath(`/calendar`)
}
