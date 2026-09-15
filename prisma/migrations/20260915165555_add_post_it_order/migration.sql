-- AlterTable
ALTER TABLE "PostIt" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- Backfill: preserve each user's existing display order (previously implicit
-- via createdAt ascending) as an explicit order value.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" ASC) - 1 AS rn
  FROM "PostIt"
)
UPDATE "PostIt"
SET "order" = ranked.rn
FROM ranked
WHERE "PostIt"."id" = ranked."id";
