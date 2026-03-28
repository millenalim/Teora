export type MaintenanceStatus = "overdue" | "due_soon" | "on_track" | "no_schedule"

export const FREQUENCY_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 91,
  semiannually: 182,
  annually: 365,
}

export function getMaintenanceStatus(nextDue: Date | null | undefined): MaintenanceStatus {
  if (!nextDue) return "no_schedule"
  const now = new Date()
  const daysUntil = Math.ceil((new Date(nextDue).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return "overdue"
  if (daysUntil <= 14) return "due_soon"
  return "on_track"
}

export function computeNextDue(frequency: string, completedDate: Date): Date | null {
  const days = FREQUENCY_DAYS[frequency]
  if (!days) return null
  const next = new Date(completedDate)
  next.setDate(next.getDate() + days)
  return next
}
