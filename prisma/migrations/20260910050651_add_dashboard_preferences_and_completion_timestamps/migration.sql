-- AlterTable
ALTER TABLE "ProjectTask" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "QuickListItem" ADD COLUMN     "doneAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DashboardPreferences" (
    "userId" TEXT NOT NULL,
    "hiddenPanels" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "DashboardPreferences_pkey" PRIMARY KEY ("userId")
);
