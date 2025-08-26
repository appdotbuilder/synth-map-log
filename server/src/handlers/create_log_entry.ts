import { db } from '../db';
import { logEntriesTable } from '../db/schema';
import { type CreateLogEntryInput, type LogEntry } from '../schema';

export const createLogEntry = async (input: CreateLogEntryInput): Promise<LogEntry> => {
  try {
    // Insert log entry record with current timestamp
    const result = await db.insert(logEntriesTable)
      .values({
        timestamp: new Date(), // Set current timestamp for when the log entry occurred
        severity: input.severity,
        source: input.source,
        message: input.message,
        ip_address: input.ip_address,
        user_agent: input.user_agent
      })
      .returning()
      .execute();

    const logEntry = result[0];
    return logEntry;
  } catch (error) {
    console.error('Log entry creation failed:', error);
    throw error;
  }
};