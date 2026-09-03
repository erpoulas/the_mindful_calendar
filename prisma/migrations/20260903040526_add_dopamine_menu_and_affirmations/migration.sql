-- CreateTable
CREATE TABLE "DopamineMenuItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DopamineMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Affirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodayAffirmation" (
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TodayAffirmation_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "DopamineMenuItem_userId_idx" ON "DopamineMenuItem"("userId");

-- CreateIndex
CREATE INDEX "Affirmation_userId_idx" ON "Affirmation"("userId");
