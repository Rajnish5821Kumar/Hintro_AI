-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SENT', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "participants" TEXT[],
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "actionItems" JSONB NOT NULL,
    "decisions" JSONB NOT NULL,
    "followUpSuggestions" JSONB NOT NULL,
    "rawResponse" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "assignee" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ActionItemStatus" NOT NULL DEFAULT 'PENDING',
    "meetingId" TEXT NOT NULL,
    "telegramChatId" TEXT,
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_histories" (
    "id" TEXT NOT NULL,
    "actionItemId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'telegram',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "meetings_createdById_idx" ON "meetings"("createdById");
CREATE INDEX "meetings_meetingDate_idx" ON "meetings"("meetingDate");
CREATE INDEX "meetings_createdAt_idx" ON "meetings"("createdAt");
CREATE INDEX "transcripts_meetingId_idx" ON "transcripts"("meetingId");
CREATE INDEX "transcripts_meetingId_sequence_idx" ON "transcripts"("meetingId", "sequence");
CREATE UNIQUE INDEX "analyses_meetingId_key" ON "analyses"("meetingId");
CREATE INDEX "analyses_meetingId_idx" ON "analyses"("meetingId");
CREATE INDEX "action_items_meetingId_idx" ON "action_items"("meetingId");
CREATE INDEX "action_items_status_idx" ON "action_items"("status");
CREATE INDEX "action_items_dueDate_idx" ON "action_items"("dueDate");
CREATE INDEX "action_items_assignee_idx" ON "action_items"("assignee");
CREATE INDEX "action_items_status_dueDate_idx" ON "action_items"("status", "dueDate");
CREATE INDEX "reminder_histories_actionItemId_idx" ON "reminder_histories"("actionItemId");
CREATE INDEX "reminder_histories_sentAt_idx" ON "reminder_histories"("sentAt");
CREATE INDEX "reminder_histories_deliveryStatus_idx" ON "reminder_histories"("deliveryStatus");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reminder_histories" ADD CONSTRAINT "reminder_histories_actionItemId_fkey" FOREIGN KEY ("actionItemId") REFERENCES "action_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
