import type { Home, HomeMember, User, Task, TaskAssignee, List, ListItem } from "@/app/generated/prisma/client"

export type HomeWithMembers = Home & {
  members: (HomeMember & { user: User })[]
}

export type MemberWithUser = HomeMember & { user: User }

export type TaskWithRelations = Task & {
  createdBy: User | null
  assignees: TaskAssignee[]
}

export type ListWithItems = List & {
  createdBy: User | null
  items: ListItem[]
}

export type MentionData = { type: "person" | "vendor"; id: number; name: string }
