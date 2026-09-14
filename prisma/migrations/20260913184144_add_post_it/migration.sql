-- CreateTable
CREATE TABLE "PostIt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostIt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostIt_userId_idx" ON "PostIt"("userId");
