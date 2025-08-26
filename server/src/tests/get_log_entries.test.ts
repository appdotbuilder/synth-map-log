import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { logEntriesTable } from '../db/schema';
import { type LogQueryParams, type CreateLogEntryInput } from '../schema';
import { getLogEntries } from '../handlers/get_log_entries';
import { eq } from 'drizzle-orm';

describe('getLogEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestLogEntry = async (input: CreateLogEntryInput & { timestamp?: Date }) => {
    const result = await db.insert(logEntriesTable)
      .values({
        timestamp: input.timestamp || new Date(),
        severity: input.severity,
        source: input.source,
        message: input.message,
        ip_address: input.ip_address,
        user_agent: input.user_agent
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should return empty array when no log entries exist', async () => {
    const result = await getLogEntries();

    expect(result).toEqual([]);
  });

  it('should return all log entries with default pagination', async () => {
    // Create test data
    await createTestLogEntry({
      severity: 'info',
      source: 'test-service',
      message: 'Test message 1',
      ip_address: '192.168.1.1',
      user_agent: 'test-agent'
    });

    await createTestLogEntry({
      severity: 'error',
      source: 'another-service',
      message: 'Test message 2',
      ip_address: null,
      user_agent: null
    });

    const result = await getLogEntries();

    expect(result).toHaveLength(2);
    expect(result[0].severity).toBeDefined();
    expect(result[0].source).toBeDefined();
    expect(result[0].message).toBeDefined();
    expect(result[0].timestamp).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should order results by timestamp descending (most recent first)', async () => {
    const oldDate = new Date('2023-01-01T10:00:00Z');
    const newDate = new Date('2023-01-02T10:00:00Z');

    // Create entries with specific timestamps
    await createTestLogEntry({
      severity: 'info',
      source: 'test-service',
      message: 'Old message',
      ip_address: null,
      user_agent: null,
      timestamp: oldDate
    });

    await createTestLogEntry({
      severity: 'info',
      source: 'test-service',
      message: 'New message',
      ip_address: null,
      user_agent: null,
      timestamp: newDate
    });

    const result = await getLogEntries();

    expect(result).toHaveLength(2);
    expect(result[0].message).toEqual('New message');
    expect(result[1].message).toEqual('Old message');
    expect(result[0].timestamp >= result[1].timestamp).toBe(true);
  });

  it('should filter by severity', async () => {
    // Create entries with different severities
    await createTestLogEntry({
      severity: 'info',
      source: 'test-service',
      message: 'Info message',
      ip_address: null,
      user_agent: null
    });

    await createTestLogEntry({
      severity: 'error',
      source: 'test-service',
      message: 'Error message',
      ip_address: null,
      user_agent: null
    });

    await createTestLogEntry({
      severity: 'warning',
      source: 'test-service',
      message: 'Warning message',
      ip_address: null,
      user_agent: null
    });

    const params: LogQueryParams = { severity: 'error' };
    const result = await getLogEntries(params);

    expect(result).toHaveLength(1);
    expect(result[0].severity).toEqual('error');
    expect(result[0].message).toEqual('Error message');
  });

  it('should filter by date since parameter', async () => {
    const cutoffDate = new Date('2023-01-02T00:00:00Z');
    const beforeDate = new Date('2023-01-01T10:00:00Z');
    const afterDate = new Date('2023-01-03T10:00:00Z');

    // Create entries before and after cutoff
    await createTestLogEntry({
      severity: 'info',
      source: 'test-service',
      message: 'Before cutoff',
      ip_address: null,
      user_agent: null,
      timestamp: beforeDate
    });

    await createTestLogEntry({
      severity: 'info',
      source: 'test-service',
      message: 'After cutoff',
      ip_address: null,
      user_agent: null,
      timestamp: afterDate
    });

    const params: LogQueryParams = { since: cutoffDate };
    const result = await getLogEntries(params);

    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual('After cutoff');
    expect(result[0].timestamp >= cutoffDate).toBe(true);
  });

  it('should apply limit parameter', async () => {
    // Create multiple entries
    for (let i = 0; i < 5; i++) {
      await createTestLogEntry({
        severity: 'info',
        source: 'test-service',
        message: `Test message ${i}`,
        ip_address: null,
        user_agent: null
      });
    }

    const params: LogQueryParams = { limit: 3 };
    const result = await getLogEntries(params);

    expect(result).toHaveLength(3);
  });

  it('should apply offset parameter', async () => {
    // Create entries with identifiable messages
    for (let i = 0; i < 5; i++) {
      await createTestLogEntry({
        severity: 'info',
        source: 'test-service',
        message: `Message ${i}`,
        ip_address: null,
        user_agent: null,
        timestamp: new Date(Date.now() + i * 1000) // Ensure different timestamps
      });
    }

    // Get first batch
    const firstBatch = await getLogEntries({ limit: 2, offset: 0 });
    expect(firstBatch).toHaveLength(2);

    // Get second batch
    const secondBatch = await getLogEntries({ limit: 2, offset: 2 });
    expect(secondBatch).toHaveLength(2);

    // Ensure different results
    expect(firstBatch[0].id).not.toEqual(secondBatch[0].id);
  });

  it('should combine multiple filters', async () => {
    const cutoffDate = new Date('2023-01-02T00:00:00Z');
    const beforeDate = new Date('2023-01-01T10:00:00Z');
    const afterDate = new Date('2023-01-03T10:00:00Z');

    // Create various entries
    await createTestLogEntry({
      severity: 'error',
      source: 'test-service',
      message: 'Old error',
      ip_address: null,
      user_agent: null,
      timestamp: beforeDate
    });

    await createTestLogEntry({
      severity: 'error',
      source: 'test-service',
      message: 'New error',
      ip_address: null,
      user_agent: null,
      timestamp: afterDate
    });

    await createTestLogEntry({
      severity: 'info',
      source: 'test-service',
      message: 'New info',
      ip_address: null,
      user_agent: null,
      timestamp: afterDate
    });

    const params: LogQueryParams = {
      severity: 'error',
      since: cutoffDate,
      limit: 10
    };
    const result = await getLogEntries(params);

    expect(result).toHaveLength(1);
    expect(result[0].severity).toEqual('error');
    expect(result[0].message).toEqual('New error');
    expect(result[0].timestamp >= cutoffDate).toBe(true);
  });

  it('should handle nullable fields correctly', async () => {
    // Create entry with null fields
    await createTestLogEntry({
      severity: 'debug',
      source: 'test-service',
      message: 'Message with nulls',
      ip_address: null,
      user_agent: null
    });

    // Create entry with non-null fields
    await createTestLogEntry({
      severity: 'debug',
      source: 'test-service',
      message: 'Message with data',
      ip_address: '10.0.0.1',
      user_agent: 'Mozilla/5.0'
    });

    const result = await getLogEntries();

    expect(result).toHaveLength(2);
    
    const nullEntry = result.find(r => r.message === 'Message with nulls');
    const dataEntry = result.find(r => r.message === 'Message with data');

    expect(nullEntry?.ip_address).toBeNull();
    expect(nullEntry?.user_agent).toBeNull();
    expect(dataEntry?.ip_address).toEqual('10.0.0.1');
    expect(dataEntry?.user_agent).toEqual('Mozilla/5.0');
  });

  it('should save and retrieve log entries correctly from database', async () => {
    const testEntry = await createTestLogEntry({
      severity: 'critical',
      source: 'security-system',
      message: 'Critical security alert',
      ip_address: '192.168.1.100',
      user_agent: 'Security-Scanner/1.0'
    });

    // Verify direct database query
    const dbEntries = await db.select()
      .from(logEntriesTable)
      .where(eq(logEntriesTable.id, testEntry.id))
      .execute();

    expect(dbEntries).toHaveLength(1);
    expect(dbEntries[0].severity).toEqual('critical');
    expect(dbEntries[0].source).toEqual('security-system');
    expect(dbEntries[0].message).toEqual('Critical security alert');
    expect(dbEntries[0].ip_address).toEqual('192.168.1.100');
    expect(dbEntries[0].user_agent).toEqual('Security-Scanner/1.0');

    // Verify handler returns same data
    const handlerResult = await getLogEntries({ limit: 1 });
    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0].id).toEqual(testEntry.id);
    expect(handlerResult[0].severity).toEqual('critical');
    expect(handlerResult[0].source).toEqual('security-system');
  });
});