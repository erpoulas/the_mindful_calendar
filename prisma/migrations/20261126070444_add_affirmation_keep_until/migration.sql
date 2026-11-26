-- AlterTable
ALTER TABLE "TodayAffirmation" ADD COLUMN     "keepUntil" DATE;

-- Overrides saved before this change were "just for today": keep them ending
-- on the day they were set instead of turning into "until I change it".
UPDATE "TodayAffirmation" SET "keepUntil" = "setAt"::date;
