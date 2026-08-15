import { db, type DbClient } from "../lib/db";

const ROLLBACK = Symbol("test transaction rollback");

/**
 * Runs `run` inside a real database transaction, then always rolls it back —
 * so tests can freely create/query/delete rows against the real dev database
 * without ever leaving anything behind, and without needing to mock Prisma.
 */
export async function withRollback(
  run: (tx: DbClient) => Promise<void>,
): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      await run(tx);
      throw ROLLBACK;
    });
  } catch (err) {
    if (err !== ROLLBACK) throw err;
  }
}
