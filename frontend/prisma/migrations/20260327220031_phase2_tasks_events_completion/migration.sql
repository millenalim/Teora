-- CreateTable
CREATE TABLE "tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "homeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_assignees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    CONSTRAINT "task_assignees_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "homeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "startTime" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "events_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "completion_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "homeId" INTEGER NOT NULL,
    "completedDate" DATETIME NOT NULL,
    "completedById" INTEGER,
    "cost" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "completion_logs_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "tasks_homeId_status_idx" ON "tasks"("homeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignees_taskId_memberId_key" ON "task_assignees"("taskId", "memberId");

-- CreateIndex
CREATE INDEX "events_homeId_startDate_idx" ON "events"("homeId", "startDate");

-- CreateIndex
CREATE INDEX "completion_logs_entityType_entityId_idx" ON "completion_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "completion_logs_homeId_idx" ON "completion_logs"("homeId");
