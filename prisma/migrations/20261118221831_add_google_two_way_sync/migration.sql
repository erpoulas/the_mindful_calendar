-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "googleEtag" TEXT;

-- CreateTable
CREATE TABLE "GoogleEventDeletion" (
    "googleEventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleEventDeletion_pkey" PRIMARY KEY ("googleEventId")
);

-- CreateIndex
CREATE INDEX "GoogleEventDeletion_userId_idx" ON "GoogleEventDeletion"("userId");

-- Existing connections were granted read-only access, which can't write
-- events to Google. Remove them so Account settings offers "Connect" again
-- and the user grants the read-and-write access two-way sync needs.
DELETE FROM "GoogleConnection";
