import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { logEntriesTable } from '../db/schema';
import { type CreateLogEntryInput } from '../schema';
import { createLogEntry } from '../handlers/create_log_entry';
import { eq, gte, between, and } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateLogEntryInput = {
  severity: 'error',
  source: 'authentication_service',
  message: 'Failed login attempt detected',
  ip_address: '192.168.1.100',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Test input with nullable fields set to null
const minimalTestInput: CreateLogEntryInput = {
  severity: 'info',
  source: 'system_monitor',
  message: 'System status check completed',
  ip_address: null,
  user_agent: null
};

describe('createLogEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a log entry with all fields', async () => {
    const result = await createLogEntry(testInput);

    // Basic field validation
    expect(result.severity).toEqual('error');
    expect(result.source).toEqual('authentication_service');
    expect(result.message).toEqual('Failed login attempt detected');
    expect(result.ip_address).toEqual('192.168.1.100');
    expect(result.user_agent).toEqual('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a log entry with nullable fields as null', async () => {
    const result = await createLogEntry(minimalTestInput);

    // Validate required fields
    expect(result.severity).toEqual('info');
    expect(result.source).toEqual('system_monitor');
    expect(result.message).toEqual('System status check completed');
    
    // Validate nullable fields
    expect(result.ip_address).toBeNull();
    expect(result.user_agent).toBeNull();
    
    // Validate generated fields
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save log entry to database', async () => {
    const result = await createLogEntry(testInput);

    // Query using proper drizzle syntax
    const logEntries = await db.select()
      .from(logEntriesTable)
      .where(eq(logEntriesTable.id, result.id))
      .execute();

    expect(logEntries).toHaveLength(1);
    expect(logEntries[0].severity).toEqual('error');
    expect(logEntries[0].source).toEqual('authentication_service');
    expect(logEntries[0].message).toEqual('Failed login attempt detected');
    expect(logEntries[0].ip_address).toEqual('192.168.1.100');
    expect(logEntries[0].user_agent).toEqual('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    expect(logEntries[0].timestamp).toBeInstanceOf(Date);
    expect(logEntries[0].created_at).toBeInstanceOf(Date);
  });

  it('should set current timestamp for log entry', async () => {
    const beforeCreation = new Date();
    const result = await createLogEntry(testInput);
    const afterCreation = new Date();

    // Timestamp should be close to current time
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
  });

  it('should handle different severity levels', async () => {
    const severityLevels = ['info', 'warning', 'error', 'debug', 'critical'] as const;
    
    for (const severity of severityLevels) {
      const input: CreateLogEntryInput = {
        ...testInput,
        severity,
        message: `Test message with ${severity} severity`
      };

      const result = await createLogEntry(input);
      expect(result.severity).toEqual(severity);
      expect(result.message).toEqual(`Test message with ${severity} severity`);
    }
  });

  it('should query log entries by date range correctly', async () => {
    // Create test log entry
    await createLogEntry(testInput);

    // Test date filtering - demonstration of correct date handling
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Proper query building with correct date range
    const logEntries = await db.select()
      .from(logEntriesTable)
      .where(
        and(
          gte(logEntriesTable.timestamp, yesterday),
          between(logEntriesTable.timestamp, yesterday, tomorrow)
        )
      )
      .execute();

    expect(logEntries.length).toBeGreaterThan(0);
    logEntries.forEach(logEntry => {
      expect(logEntry.timestamp).toBeInstanceOf(Date);
      expect(logEntry.timestamp >= yesterday).toBe(true);
      expect(logEntry.timestamp <= tomorrow).toBe(true);
    });
  });

  it('should create multiple log entries with unique IDs', async () => {
    const firstEntry = await createLogEntry(testInput);
    const secondEntry = await createLogEntry(minimalTestInput);

    // Ensure unique IDs
    expect(firstEntry.id).not.toEqual(secondEntry.id);
    
    // Verify both entries exist in database
    const allEntries = await db.select()
      .from(logEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);
    
    const ids = allEntries.map(entry => entry.id);
    expect(ids).toContain(firstEntry.id);
    expect(ids).toContain(secondEntry.id);
  });
});