-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "timezone" TEXT,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);
