import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { networkActivitiesTable } from '../db/schema';
import { type CreateNetworkActivityInput } from '../schema';
import { createNetworkActivity } from '../handlers/create_network_activity';
import { eq, gte, between, and } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateNetworkActivityInput = {
  latitude: 40.7128,
  longitude: -74.0060,
  activity_type: 'intrusion',
  title: 'Suspicious Login Attempt',
  description: 'Multiple failed login attempts detected from this IP',
  ip_address: '192.168.1.100',
  port: 22,
  country: 'United States',
  city: 'New York',
  severity: 'warning',
  metadata: {
    attempts: 5,
    protocol: 'SSH',
    user_agent: 'automated-scanner'
  }
};

// Test input with minimal required fields (nullables omitted)
const minimalInput: CreateNetworkActivityInput = {
  latitude: -33.8688,
  longitude: 151.2093,
  activity_type: 'firewall',
  title: 'Port Scan Detected',
  description: 'Systematic port scanning activity detected',
  ip_address: '10.0.0.1',
  port: null,
  country: null,
  city: null,
  severity: 'info',
  metadata: null
};

describe('createNetworkActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a network activity with all fields', async () => {
    const result = await createNetworkActivity(testInput);

    // Validate all fields
    expect(result.latitude).toEqual(40.7128);
    expect(result.longitude).toEqual(-74.0060);
    expect(result.activity_type).toEqual('intrusion');
    expect(result.title).toEqual('Suspicious Login Attempt');
    expect(result.description).toEqual(testInput.description);
    expect(result.ip_address).toEqual('192.168.1.100');
    expect(result.port).toEqual(22);
    expect(result.country).toEqual('United States');
    expect(result.city).toEqual('New York');
    expect(result.severity).toEqual('warning');
    expect(result.metadata).toEqual(testInput.metadata);
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.latitude).toEqual('number');
    expect(typeof result.longitude).toEqual('number');
  });

  it('should create a network activity with minimal fields', async () => {
    const result = await createNetworkActivity(minimalInput);

    // Validate required fields
    expect(result.latitude).toEqual(-33.8688);
    expect(result.longitude).toEqual(151.2093);
    expect(result.activity_type).toEqual('firewall');
    expect(result.title).toEqual('Port Scan Detected');
    expect(result.ip_address).toEqual('10.0.0.1');
    expect(result.severity).toEqual('info');

    // Validate nullable fields are null
    expect(result.port).toBeNull();
    expect(result.country).toBeNull();
    expect(result.city).toBeNull();
    expect(result.metadata).toBeNull();

    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save network activity to database', async () => {
    const result = await createNetworkActivity(testInput);

    // Query the database to verify the record was saved
    const activities = await db.select()
      .from(networkActivitiesTable)
      .where(eq(networkActivitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    const activity = activities[0];

    expect(Number(activity.latitude)).toEqual(40.7128);
    expect(Number(activity.longitude)).toEqual(-74.0060);
    expect(activity.activity_type).toEqual('intrusion');
    expect(activity.title).toEqual('Suspicious Login Attempt');
    expect(activity.ip_address).toEqual('192.168.1.100');
    expect(activity.port).toEqual(22);
    expect(activity.country).toEqual('United States');
    expect(activity.city).toEqual('New York');
    expect(activity.severity).toEqual('warning');
    expect(activity.metadata).toEqual(testInput.metadata);
    expect(activity.timestamp).toBeInstanceOf(Date);
    expect(activity.created_at).toBeInstanceOf(Date);
  });

  it('should handle different activity types correctly', async () => {
    const activityTypes = ['intrusion', 'firewall', 'connection', 'scan', 'breach', 'traffic'] as const;
    
    for (const activityType of activityTypes) {
      const input: CreateNetworkActivityInput = {
        ...testInput,
        activity_type: activityType,
        title: `Test ${activityType} activity`,
        latitude: Math.random() * 180 - 90, // Random latitude
        longitude: Math.random() * 360 - 180 // Random longitude
      };

      const result = await createNetworkActivity(input);
      expect(result.activity_type).toEqual(activityType);
      expect(result.title).toEqual(`Test ${activityType} activity`);
    }
  });

  it('should handle different severity levels correctly', async () => {
    const severityLevels = ['info', 'warning', 'error', 'debug', 'critical'] as const;
    
    for (const severity of severityLevels) {
      const input: CreateNetworkActivityInput = {
        ...testInput,
        severity: severity,
        title: `Test ${severity} activity`,
        latitude: Math.random() * 180 - 90,
        longitude: Math.random() * 360 - 180
      };

      const result = await createNetworkActivity(input);
      expect(result.severity).toEqual(severity);
      expect(result.title).toEqual(`Test ${severity} activity`);
    }
  });

  it('should query network activities by date range correctly', async () => {
    // Create test network activity
    await createNetworkActivity(testInput);

    // Test date filtering - use a wider range to ensure we catch the created activity
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build query with date filters
    const activities = await db.select()
      .from(networkActivitiesTable)
      .where(
        and(
          gte(networkActivitiesTable.created_at, yesterday),
          between(networkActivitiesTable.created_at, yesterday, tomorrow)
        )
      )
      .execute();

    expect(activities.length).toBeGreaterThan(0);
    activities.forEach(activity => {
      expect(activity.created_at).toBeInstanceOf(Date);
      expect(activity.created_at >= yesterday).toBe(true);
      expect(activity.created_at <= tomorrow).toBe(true);
    });
  });

  it('should handle complex metadata objects', async () => {
    const complexMetadata = {
      geo_info: {
        country_code: 'US',
        region: 'NY',
        isp: 'Test ISP'
      },
      threat_intel: {
        malware_family: 'test-malware',
        confidence_score: 0.85,
        source: 'honeypot'
      },
      network_stats: {
        bytes_transferred: 1024,
        packets_count: 15,
        duration_ms: 5000
      }
    };

    const input: CreateNetworkActivityInput = {
      ...testInput,
      title: 'Complex Network Activity',
      metadata: complexMetadata
    };

    const result = await createNetworkActivity(input);

    expect(result.metadata).toEqual(complexMetadata);
    expect(result.metadata?.['geo_info']?.['country_code']).toEqual('US');
    expect(result.metadata?.['threat_intel']?.['confidence_score']).toEqual(0.85);
    expect(result.metadata?.['network_stats']?.['bytes_transferred']).toEqual(1024);
  });
});