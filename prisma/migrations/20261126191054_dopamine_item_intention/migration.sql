-- AlterTable
ALTER TABLE "DopamineMenuItem" ADD COLUMN     "intentionId" TEXT;

-- CreateIndex
CREATE INDEX "DopamineMenuItem_intentionId_idx" ON "DopamineMenuItem"("intentionId");

-- AddForeignKey
ALTER TABLE "DopamineMenuItem" ADD CONSTRAINT "DopamineMenuItem_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "Intention"("id") ON DELETE SET NULL ON UPDATE CASCADE;
