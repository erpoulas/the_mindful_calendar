-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "extraTimezones" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "use24HourClock" BOOLEAN NOT NULL DEFAULT false;
