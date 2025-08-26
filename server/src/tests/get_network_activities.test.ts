import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { networkActivitiesTable } from '../db/schema';
import { type CreateNetworkActivityInput, type NetworkActivityQueryParams } from '../schema';
import { getNetworkActivities } from '../handlers/get_network_activities';
import { eq } from 'drizzle-orm';

// Test data for network activities
const testActivity1: CreateNetworkActivityInput = {
  latitude: 40.7128,
  longitude: -74.0060,
  activity_type: 'intrusion',
  title: 'Suspicious Login Attempt',
  description: 'Multiple failed login attempts detected',
  ip_address: '192.168.1.100',
  port: 22,
  country: 'United States',
  city: 'New York',
  severity: 'critical',
  metadata: { attempts: 5, duration: '2m' }
};

const testActivity2: CreateNetworkActivityInput = {
  latitude: 51.5074,
  longitude: -0.1278,
  activity_type: 'firewall',
  title: 'Blocked Connection',
  description: 'Firewall blocked suspicious traffic',
  ip_address: '10.0.0.50',
  port: 80,
  country: 'United Kingdom',
  city: 'London',
  severity: 'warning',
  metadata: { blocked_bytes: 1024 }
};

const testActivity3: CreateNetworkActivityInput = {
  latitude: 35.6762,
  longitude: 139.6503,
  activity_type: 'scan',
  title: 'Port Scan Detected',
  description: 'Network port scanning activity',
  ip_address: '203.0.113.5',
  port: null,
  country: 'Japan',
  city: 'Tokyo',
  severity: 'info',
  metadata: null
};

async function createTestActivity(input: CreateNetworkActivityInput) {
  const result = await db.insert(networkActivitiesTable)
    .values({
      latitude: input.latitude, // real type accepts numbers directly
      longitude: input.longitude, // real type accepts numbers directly
      activity_type: input.activity_type,
      title: input.title,
      description: input.description,
      ip_address: input.ip_address,
      port: input.port,
      country: input.country,
      city: input.city,
      severity: input.severity,
      timestamp: new Date(),
      metadata: input.metadata
    })
    .returning()
    .execute();
  
  return result[0];
}

describe('getNetworkActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all network activities when no filters are applied', async () => {
    // Create test data
    await createTestActivity(testActivity1);
    await createTestActivity(testActivity2);
    await createTestActivity(testActivity3);

    const results = await getNetworkActivities();

    expect(results).toHaveLength(3);
    expect(results[0].title).toBeDefined();
    expect(results[0].latitude).toBeTypeOf('number');
    expect(results[0].longitude).toBeTypeOf('number');
    expect(results[0].activity_type).toBeDefined();
    expect(results[0].severity).toBeDefined();
  });

  it('should filter by activity_type', async () => {
    await createTestActivity(testActivity1); // intrusion
    await createTestActivity(testActivity2); // firewall
    await createTestActivity(testActivity3); // scan

    const params: NetworkActivityQueryParams = {
      activity_type: 'firewall'
    };

    const results = await getNetworkActivities(params);

    expect(results).toHaveLength(1);
    expect(results[0].activity_type).toEqual('firewall');
    expect(results[0].title).toEqual('Blocked Connection');
  });

  it('should filter by severity level', async () => {
    await createTestActivity(testActivity1); // critical
    await createTestActivity(testActivity2); // warning
    await createTestActivity(testActivity3); // info

    const params: NetworkActivityQueryParams = {
      severity: 'critical'
    };

    const results = await getNetworkActivities(params);

    expect(results).toHaveLength(1);
    expect(results[0].severity).toEqual('critical');
    expect(results[0].title).toEqual('Suspicious Login Attempt');
  });

  it('should filter by timestamp since parameter', async () => {
    // Create activities with specific timestamps
    const pastActivity = await createTestActivity(testActivity1);
    
    // Update the timestamp to be in the past
    await db.update(networkActivitiesTable)
      .set({ timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }) // 24 hours ago
      .where(eq(networkActivitiesTable.id, pastActivity.id))
      .execute();

    await createTestActivity(testActivity2); // Recent activity

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const params: NetworkActivityQueryParams = {
      since: oneHourAgo
    };

    const results = await getNetworkActivities(params);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Blocked Connection');
    expect(results[0].timestamp >= oneHourAgo).toBe(true);
  });

  it('should apply limit parameter correctly', async () => {
    await createTestActivity(testActivity1);
    await createTestActivity(testActivity2);
    await createTestActivity(testActivity3);

    const params: NetworkActivityQueryParams = {
      limit: 2
    };

    const results = await getNetworkActivities(params);

    expect(results).toHaveLength(2);
  });

  it('should combine multiple filters correctly', async () => {
    await createTestActivity(testActivity1); // intrusion, critical
    await createTestActivity(testActivity2); // firewall, warning
    await createTestActivity({
      ...testActivity3,
      activity_type: 'intrusion',
      severity: 'error'
    }); // intrusion, error

    const params: NetworkActivityQueryParams = {
      activity_type: 'intrusion',
      severity: 'critical',
      limit: 10
    };

    const results = await getNetworkActivities(params);

    expect(results).toHaveLength(1);
    expect(results[0].activity_type).toEqual('intrusion');
    expect(results[0].severity).toEqual('critical');
    expect(results[0].title).toEqual('Suspicious Login Attempt');
  });

  it('should return results ordered by timestamp descending', async () => {
    const activity1 = await createTestActivity(testActivity1);
    const activity2 = await createTestActivity(testActivity2);

    // Update timestamps to ensure ordering
    await db.update(networkActivitiesTable)
      .set({ timestamp: new Date(Date.now() - 60000) }) // 1 minute ago
      .where(eq(networkActivitiesTable.id, activity1.id))
      .execute();

    await db.update(networkActivitiesTable)
      .set({ timestamp: new Date() }) // Now
      .where(eq(networkActivitiesTable.id, activity2.id))
      .execute();

    const results = await getNetworkActivities();

    expect(results).toHaveLength(2);
    expect(results[0].id).toEqual(activity2.id); // More recent should be first
    expect(results[1].id).toEqual(activity1.id); // Older should be second
  });

  it('should handle numeric fields correctly', async () => {
    await createTestActivity(testActivity1);

    const results = await getNetworkActivities();

    expect(results).toHaveLength(1);
    expect(typeof results[0].latitude).toBe('number');
    expect(typeof results[0].longitude).toBe('number');
    expect(results[0].latitude).toEqual(40.7128);
    expect(results[0].longitude).toEqual(-74.0060);
  });

  it('should handle activities with null optional fields', async () => {
    await createTestActivity(testActivity3); // Has null port and metadata

    const results = await getNetworkActivities();

    expect(results).toHaveLength(1);
    expect(results[0].port).toBeNull();
    expect(results[0].metadata).toBeNull();
    expect(results[0].country).toEqual('Japan');
    expect(results[0].city).toEqual('Tokyo');
  });

  it('should return empty array when no activities match filters', async () => {
    await createTestActivity(testActivity1);

    const params: NetworkActivityQueryParams = {
      activity_type: 'breach' // No activities of this type exist
    };

    const results = await getNetworkActivities(params);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });
});