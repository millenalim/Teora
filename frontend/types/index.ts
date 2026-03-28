import type { Home, HomeMember, User, Task, TaskAssignee } from "@/app/generated/prisma/client"

export type HomeWithMembers = Home & {
  members: (HomeMember & { user: User })[]
}

export type MemberWithUser = HomeMember & { user: User }

export type TaskWithRelations = Task & {
  createdBy: User | null
  assignees: TaskAssignee[]
}
