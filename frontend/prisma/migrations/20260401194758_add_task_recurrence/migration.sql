-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "recurrence" TEXT,
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3);
