import { Prisma, PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Data-access functions accept this instead of importing `db` directly, so
// tests can hand them a rolled-back transaction in place of the real client.
export type DbClient = PrismaClient | Prisma.TransactionClient;

// Next.js hot-reloads modules in dev, which would otherwise create a fresh
// PrismaClient (and a fresh pool of DB connections) on every file save.
// Caching the instance on the global object survives reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_POOLED,
});

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
