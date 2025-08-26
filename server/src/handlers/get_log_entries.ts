import { db } from '../db';
import { logEntriesTable } from '../db/schema';
import { type LogEntry, type LogQueryParams } from '../schema';
import { eq, gte, desc, and, SQL } from 'drizzle-orm';

export async function getLogEntries(params?: LogQueryParams): Promise<LogEntry[]> {
  try {
    // Build conditions array for optional filters
    const conditions: SQL<unknown>[] = [];

    if (params?.severity) {
      conditions.push(eq(logEntriesTable.severity, params.severity));
    }

    if (params?.since) {
      conditions.push(gte(logEntriesTable.timestamp, params.since));
    }

    // Apply pagination defaults
    const limit = params?.limit ?? 50; // Default limit of 50
    const offset = params?.offset ?? 0; // Default offset of 0

    // Build complete query in one chain without reassignment
    const baseQuery = db.select().from(logEntriesTable);

    const results = conditions.length > 0
      ? await baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(logEntriesTable.timestamp))
          .limit(limit)
          .offset(offset)
          .execute()
      : await baseQuery
          .orderBy(desc(logEntriesTable.timestamp))
          .limit(limit)
          .offset(offset)
          .execute();

    // Convert results to match LogEntry schema
    return results.map(result => ({
      ...result,
      // Ensure dates are properly handled
      timestamp: result.timestamp,
      created_at: result.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch log entries:', error);
    throw error;
  }
}