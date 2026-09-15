-- AlterTable
ALTER TABLE "DashboardPreferences" ADD COLUMN     "panelOrder" TEXT[] DEFAULT ARRAY[]::TEXT[];
