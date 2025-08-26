import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { networkActivitiesTable } from '../db/schema';
import { type CreateNetworkActivityInput } from '../schema';
import { getNetworkActivityById } from '../handlers/get_network_activity_by_id';
import { eq } from 'drizzle-orm';

// Test network activity input
const testActivity: CreateNetworkActivityInput = {
  latitude: 37.7749,
  longitude: -122.4194,
  activity_type: 'intrusion',
  title: 'Suspicious Access Attempt',
  description: 'Multiple failed login attempts detected from this IP',
  ip_address: '192.168.1.100',
  port: 22,
  country: 'United States',
  city: 'San Francisco',
  severity: 'warning',
  metadata: { attempts: 5, protocol: 'SSH' }
};

describe('getNetworkActivityById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return network activity when found', async () => {
    // Create a test network activity
    const inserted = await db.insert(networkActivitiesTable)
      .values({
        ...testActivity,
        timestamp: new Date()
      })
      .returning()
      .execute();

    const activityId = inserted[0].id;

    // Fetch the activity by ID
    const result = await getNetworkActivityById(activityId);

    // Verify all fields are returned correctly
    expect(result).toBeDefined();
    expect(result!.id).toEqual(activityId);
    expect(result!.latitude).toEqual(37.7749);
    expect(result!.longitude).toEqual(-122.4194);
    expect(typeof result!.latitude).toEqual('number');
    expect(typeof result!.longitude).toEqual('number');
    expect(result!.activity_type).toEqual('intrusion');
    expect(result!.title).toEqual('Suspicious Access Attempt');
    expect(result!.description).toEqual('Multiple failed login attempts detected from this IP');
    expect(result!.ip_address).toEqual('192.168.1.100');
    expect(result!.port).toEqual(22);
    expect(result!.country).toEqual('United States');
    expect(result!.city).toEqual('San Francisco');
    expect(result!.severity).toEqual('warning');
    expect(result!.metadata).toEqual({ attempts: 5, protocol: 'SSH' });
    expect(result!.timestamp).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when activity not found', async () => {
    const result = await getNetworkActivityById(999);
    expect(result).toBeNull();
  });

  it('should handle activities with nullable fields', async () => {
    // Create activity with nullable fields set to null
    const activityWithNulls: CreateNetworkActivityInput = {
      latitude: 51.5074,
      longitude: -0.1278,
      activity_type: 'scan',
      title: 'Port Scan Detected',
      description: 'Automated port scanning activity',
      ip_address: '10.0.0.1',
      port: null,
      country: null,
      city: null,
      severity: 'info',
      metadata: null
    };

    const inserted = await db.insert(networkActivitiesTable)
      .values({
        ...activityWithNulls,
        timestamp: new Date()
      })
      .returning()
      .execute();

    const result = await getNetworkActivityById(inserted[0].id);

    expect(result).toBeDefined();
    expect(result!.latitude).toEqual(51.5074);
    expect(result!.longitude).toEqual(-0.1278);
    expect(result!.port).toBeNull();
    expect(result!.country).toBeNull();
    expect(result!.city).toBeNull();
    expect(result!.metadata).toBeNull();
  });

  it('should handle different activity types and severities', async () => {
    const activities = [
      { ...testActivity, activity_type: 'firewall' as const, severity: 'critical' as const },
      { ...testActivity, activity_type: 'breach' as const, severity: 'error' as const },
      { ...testActivity, activity_type: 'traffic' as const, severity: 'debug' as const }
    ];

    const insertedIds = [];

    for (const activity of activities) {
      const inserted = await db.insert(networkActivitiesTable)
        .values({
          ...activity,
          timestamp: new Date()
        })
        .returning()
        .execute();

      insertedIds.push(inserted[0].id);
    }

    // Verify each activity can be retrieved correctly
    const results = await Promise.all(
      insertedIds.map(id => getNetworkActivityById(id))
    );

    expect(results[0]!.activity_type).toEqual('firewall');
    expect(results[0]!.severity).toEqual('critical');
    expect(results[1]!.activity_type).toEqual('breach');
    expect(results[1]!.severity).toEqual('error');
    expect(results[2]!.activity_type).toEqual('traffic');
    expect(results[2]!.severity).toEqual('debug');
  });

  it('should verify database record exists', async () => {
    // Create test activity
    const inserted = await db.insert(networkActivitiesTable)
      .values({
        ...testActivity,
        timestamp: new Date()
      })
      .returning()
      .execute();

    const activityId = inserted[0].id;

    // Fetch using handler
    const handlerResult = await getNetworkActivityById(activityId);

    // Verify the record exists in database
    const dbResult = await db.select()
      .from(networkActivitiesTable)
      .where(eq(networkActivitiesTable.id, activityId))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(handlerResult).toBeDefined();
    expect(handlerResult!.id).toEqual(dbResult[0].id);
    expect(handlerResult!.ip_address).toEqual(dbResult[0].ip_address);
    
    // Verify numeric conversion
    expect(typeof handlerResult!.latitude).toEqual('number');
    expect(typeof handlerResult!.longitude).toEqual('number');
    expect(handlerResult!.latitude).toEqual(parseFloat(dbResult[0].latitude.toString()));
    expect(handlerResult!.longitude).toEqual(parseFloat(dbResult[0].longitude.toString()));
  });
});