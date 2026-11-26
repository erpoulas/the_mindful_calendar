import { db, type DbClient } from "../lib/db";

const ROLLBACK = Symbol("test transaction rollback");
const TRANSACTION_TIMEOUT_MS = 30_000;

/**
 * Runs `run` inside a real database transaction, then always rolls it back —
 * so tests can freely create/query/delete rows against the real dev database
 * without ever leaving anything behind, and without needing to mock Prisma.
 */
export async function withRollback(
  run: (tx: DbClient) => Promise<void>,
): Promise<void> {
  try {
    await db.$transaction(
      async (tx) => {
        await run(tx);
        throw ROLLBACK;
      },
      // Prisma cancels a transaction after 5s by default. Each query to the
      // Supabase database takes ~100ms over the internet, and a Google-sync
      // test makes 40-50 of them, so those tests sat right at that limit
      // and failed at random. 30s leaves plenty of room.
      { timeout: TRANSACTION_TIMEOUT_MS, maxWait: TRANSACTION_TIMEOUT_MS },
    );
  } catch (err) {
    if (err !== ROLLBACK) throw err;
  }
}
