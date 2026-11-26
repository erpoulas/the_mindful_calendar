-- CreateTable
CREATE TABLE "JournalSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "weekdays" INTEGER[],
    "startMinutes" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "googleEventId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalSchedule_journalId_key" ON "JournalSchedule"("journalId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalSchedule_googleEventId_key" ON "JournalSchedule"("googleEventId");

-- CreateIndex
CREATE INDEX "JournalSchedule_userId_idx" ON "JournalSchedule"("userId");

-- AddForeignKey
ALTER TABLE "JournalSchedule" ADD CONSTRAINT "JournalSchedule_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
