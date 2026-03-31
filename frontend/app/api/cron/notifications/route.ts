import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/cron/notifications
// Trigger with a cron job or manually. Checks for:
//   - Maintenance tasks overdue or due within 7 days
//   - Appliance warranties expiring within 30 days
//   - Tasks due today
//   - Events starting tomorrow
export async function GET(request: Request) {
  // Simple bearer token guard — set CRON_SECRET in .env
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()
  const in7Days = new Date(now)
  in7Days.setDate(in7Days.getDate() + 7)
  const in30Days = new Date(now)
  in30Days.setDate(in30Days.getDate() + 30)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const created: number[] = []

  // ── Maintenance tasks overdue or due soon ──────────────────────────────────
  const maintenanceDue = await prisma.maintenanceTask.findMany({
    where: { nextDue: { not: null, lte: in7Days } },
    include: { home: { include: { members: true } } },
  })

  for (const task of maintenanceDue) {
    const isOverdue = task.nextDue! < now
    const label = isOverdue ? "overdue" : "due soon"
    const type = "maintenance_due"

    for (const member of task.home.members) {
      const exists = await prisma.notification.findFirst({
        where: {
          userId: member.userId,
          type,
          entityType: "maintenance",
          entityId: task.id,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      })
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId: member.userId,
            homeId: task.homeId,
            type,
            title: `Maintenance ${label}: ${task.taskName}`,
            body: `${task.home.name} — ${label}`,
            entityType: "maintenance",
            entityId: task.id,
          },
        })
        created.push(task.id)
      }
    }
  }

  // ── Warranties expiring within 30 days ────────────────────────────────────
  const warrantiesExpiring = await prisma.applianceWarranty.findMany({
    where: { warrantyExpiry: { not: null, gte: now, lte: in30Days } },
    include: { home: { include: { members: true } } },
  })

  for (const w of warrantiesExpiring) {
    const type = "warranty_expiring"
    for (const member of w.home.members) {
      const exists = await prisma.notification.findFirst({
        where: {
          userId: member.userId,
          type,
          entityType: "warranty",
          entityId: w.id,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      })
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId: member.userId,
            homeId: w.homeId,
            type,
            title: `Warranty expiring: ${w.appliance}`,
            body: `Expires ${w.warrantyExpiry!.toLocaleDateString()}`,
            entityType: "warranty",
            entityId: w.id,
          },
        })
        created.push(w.id)
      }
    }
  }

  // ── Tasks due today ────────────────────────────────────────────────────────
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const tasksDueToday = await prisma.task.findMany({
    where: { endDate: { gte: todayStart, lt: todayEnd }, status: { not: "done" } },
    include: { home: { include: { members: true } } },
  })

  for (const task of tasksDueToday) {
    const type = "task_due"
    for (const member of task.home.members) {
      const exists = await prisma.notification.findFirst({
        where: {
          userId: member.userId,
          type,
          entityType: "task",
          entityId: task.id,
          createdAt: { gte: todayStart },
        },
      })
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId: member.userId,
            homeId: task.homeId,
            type,
            title: `Task due today: ${task.title}`,
            entityType: "task",
            entityId: task.id,
          },
        })
        created.push(task.id)
      }
    }
  }

  // ── Events starting tomorrow ───────────────────────────────────────────────
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)

  const eventsTomorrow = await prisma.event.findMany({
    where: { startDate: { gte: tomorrowStart, lt: tomorrowEnd } },
    include: { home: { include: { members: true } } },
  })

  for (const event of eventsTomorrow) {
    const type = "event_reminder"
    for (const member of event.home.members) {
      const exists = await prisma.notification.findFirst({
        where: {
          userId: member.userId,
          type,
          entityType: "event",
          entityId: event.id,
          createdAt: { gte: todayStart },
        },
      })
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId: member.userId,
            homeId: event.homeId,
            type,
            title: `Event tomorrow: ${event.title}`,
            entityType: "event",
            entityId: event.id,
          },
        })
        created.push(event.id)
      }
    }
  }

  return NextResponse.json({ ok: true, notificationsCreated: created.length })
}
