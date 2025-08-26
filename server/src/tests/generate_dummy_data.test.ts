import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { 
  generateDummyLogEntries, 
  generateDummyNetworkActivities, 
  streamRandomLogEntry 
} from '../handlers/generate_dummy_data';
import { type LogEntry, type NetworkActivity, type LogSeverity, type ActivityType } from '../schema';

const VALID_SEVERITIES: LogSeverity[] = ['info', 'warning', 'error', 'debug', 'critical'];
const VALID_ACTIVITY_TYPES: ActivityType[] = ['intrusion', 'firewall', 'connection', 'scan', 'breach', 'traffic'];

describe('generateDummyLogEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate the specified number of log entries', async () => {
    const entries = await generateDummyLogEntries(25);
    expect(entries).toHaveLength(25);
  });

  it('should generate default number of entries when no count specified', async () => {
    const entries = await generateDummyLogEntries();
    expect(entries).toHaveLength(50);
  });

  it('should generate entries with valid structure and types', async () => {
    const entries = await generateDummyLogEntries(10);
    
    entries.forEach(entry => {
      expect(entry.id).toBeNumber();
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(VALID_SEVERITIES).toContain(entry.severity);
      expect(entry.source).toBeString();
      expect(entry.message).toBeString();
      
      // IP address should be null or valid string
      if (entry.ip_address !== null) {
        expect(entry.ip_address).toBeString();
        expect(entry.ip_address).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      }
      
      // User agent should be null or valid string
      if (entry.user_agent !== null) {
        expect(entry.user_agent).toBeString();
        expect(entry.user_agent.length).toBeGreaterThan(0);
      }
    });
  });

  it('should generate entries with realistic timestamps within expected range', async () => {
    const entries = await generateDummyLogEntries(20);
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (72 * 60 * 60 * 1000));
    
    entries.forEach(entry => {
      expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(threeDaysAgo.getTime());
      expect(entry.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
    });
  });

  it('should generate entries sorted by timestamp descending', async () => {
    const entries = await generateDummyLogEntries(15);
    
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
        entries[i].timestamp.getTime()
      );
    }
  });

  it('should generate diverse severities and sources', async () => {
    const entries = await generateDummyLogEntries(100);
    
    const severities = new Set(entries.map(e => e.severity));
    const sources = new Set(entries.map(e => e.source));
    
    // With 100 entries, we should see multiple severities and sources
    expect(severities.size).toBeGreaterThan(1);
    expect(sources.size).toBeGreaterThan(1);
  });
});

describe('generateDummyNetworkActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate the specified number of network activities', async () => {
    const activities = await generateDummyNetworkActivities(30);
    expect(activities).toHaveLength(30);
  });

  it('should generate default number of activities when no count specified', async () => {
    const activities = await generateDummyNetworkActivities();
    expect(activities).toHaveLength(100);
  });

  it('should generate activities with valid structure and types', async () => {
    const activities = await generateDummyNetworkActivities(15);
    
    activities.forEach(activity => {
      expect(activity.id).toBeNumber();
      expect(activity.latitude).toBeNumber();
      expect(activity.longitude).toBeNumber();
      expect(activity.latitude).toBeGreaterThanOrEqual(-90);
      expect(activity.latitude).toBeLessThanOrEqual(90);
      expect(activity.longitude).toBeGreaterThanOrEqual(-180);
      expect(activity.longitude).toBeLessThanOrEqual(180);
      
      expect(VALID_ACTIVITY_TYPES).toContain(activity.activity_type);
      expect(VALID_SEVERITIES).toContain(activity.severity);
      
      expect(activity.title).toBeString();
      expect(activity.description).toBeString();
      expect(activity.ip_address).toBeString();
      expect(activity.ip_address).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      
      expect(activity.timestamp).toBeInstanceOf(Date);
      expect(activity.created_at).toBeInstanceOf(Date);
      
      // Port should be null or valid number
      if (activity.port !== null) {
        expect(activity.port).toBeNumber();
        expect(activity.port).toBeGreaterThanOrEqual(1);
        expect(activity.port).toBeLessThanOrEqual(65535);
      }
      
      // Country and city should be strings or null
      if (activity.country !== null) {
        expect(activity.country).toBeString();
      }
      if (activity.city !== null) {
        expect(activity.city).toBeString();
      }
      
      // Metadata should be an object or null
      if (activity.metadata !== null) {
        expect(activity.metadata).toBeObject();
      }
    });
  });

  it('should generate activities with realistic metadata structure', async () => {
    const activities = await generateDummyNetworkActivities(20);
    
    activities.forEach(activity => {
      if (activity.metadata !== null) {
        const metadata = activity.metadata as any;
        
        if (metadata.bytes_transferred) {
          expect(metadata.bytes_transferred).toBeNumber();
          expect(metadata.bytes_transferred).toBeGreaterThan(0);
        }
        
        if (metadata.connection_duration) {
          expect(metadata.connection_duration).toBeNumber();
          expect(metadata.connection_duration).toBeGreaterThanOrEqual(1);
        }
        
        if (metadata.protocol) {
          expect(metadata.protocol).toBeString();
          expect(['TCP', 'UDP', 'HTTP', 'HTTPS', 'SSH', 'FTP']).toContain(metadata.protocol);
        }
        
        if (metadata.risk_score !== undefined) {
          expect(metadata.risk_score).toBeNumber();
          expect(metadata.risk_score).toBeGreaterThanOrEqual(0);
          expect(metadata.risk_score).toBeLessThanOrEqual(100);
        }
        
        if (metadata.blocked !== undefined) {
          expect(metadata.blocked).toBeBoolean();
        }
      }
    });
  });

  it('should generate activities with timestamps within expected range', async () => {
    const activities = await generateDummyNetworkActivities(25);
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    
    activities.forEach(activity => {
      expect(activity.timestamp.getTime()).toBeGreaterThanOrEqual(twoDaysAgo.getTime());
      expect(activity.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
    });
  });

  it('should generate activities sorted by timestamp descending', async () => {
    const activities = await generateDummyNetworkActivities(20);
    
    for (let i = 1; i < activities.length; i++) {
      expect(activities[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
        activities[i].timestamp.getTime()
      );
    }
  });

  it('should generate diverse activity types and severities', async () => {
    const activities = await generateDummyNetworkActivities(80);
    
    const activityTypes = new Set(activities.map(a => a.activity_type));
    const severities = new Set(activities.map(a => a.severity));
    const countries = new Set(activities.map(a => a.country));
    
    // With 80 activities, we should see variety
    expect(activityTypes.size).toBeGreaterThan(1);
    expect(severities.size).toBeGreaterThan(1);
    expect(countries.size).toBeGreaterThan(1);
  });
});

describe('streamRandomLogEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a single log entry', async () => {
    const entry = await streamRandomLogEntry();
    expect(entry).toBeDefined();
  });

  it('should generate entry with valid structure and current timestamp', async () => {
    const beforeTime = new Date();
    const entry = await streamRandomLogEntry();
    const afterTime = new Date();
    
    expect(entry.id).toBeNumber();
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(entry.created_at).toBeInstanceOf(Date);
    expect(VALID_SEVERITIES).toContain(entry.severity);
    expect(entry.source).toBeString();
    expect(entry.message).toBeString();
    
    // Timestamp should be very recent (within the test execution time)
    expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(entry.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    expect(entry.created_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(entry.created_at.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    
    // IP address should be null or valid string
    if (entry.ip_address !== null) {
      expect(entry.ip_address).toBeString();
      expect(entry.ip_address).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    }
    
    // User agent should be null or valid string
    if (entry.user_agent !== null) {
      expect(entry.user_agent).toBeString();
      expect(entry.user_agent.length).toBeGreaterThan(0);
    }
  });

  it('should generate unique IDs for consecutive calls', async () => {
    const entry1 = await streamRandomLogEntry();
    await new Promise(resolve => setTimeout(resolve, 1)); // Small delay to ensure different timestamps
    const entry2 = await streamRandomLogEntry();
    
    expect(entry1.id).not.toEqual(entry2.id);
  });

  it('should generate varied content across multiple calls', async () => {
    const entries: LogEntry[] = [];
    
    // Generate multiple entries
    for (let i = 0; i < 20; i++) {
      entries.push(await streamRandomLogEntry());
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    const severities = new Set(entries.map(e => e.severity));
    const sources = new Set(entries.map(e => e.source));
    const messages = new Set(entries.map(e => e.message));
    
    // Should see variety in generated content
    expect(severities.size).toBeGreaterThan(1);
    expect(sources.size).toBeGreaterThan(1);
    expect(messages.size).toBeGreaterThan(1);
  });

  it('should generate realistic content for different severities', async () => {
    const entries: LogEntry[] = [];
    
    // Generate many entries to get examples of different severities
    for (let i = 0; i < 50; i++) {
      entries.push(await streamRandomLogEntry());
    }
    
    // Check that entries with different severities have appropriate messages
    const infoEntries = entries.filter(e => e.severity === 'info');
    const errorEntries = entries.filter(e => e.severity === 'error');
    const criticalEntries = entries.filter(e => e.severity === 'critical');
    
    if (infoEntries.length > 0) {
      infoEntries.forEach(entry => {
        expect(entry.message).toBeString();
        expect(entry.message.length).toBeGreaterThan(0);
      });
    }
    
    if (errorEntries.length > 0) {
      errorEntries.forEach(entry => {
        expect(entry.message).toBeString();
        expect(entry.message.length).toBeGreaterThan(0);
      });
    }
    
    if (criticalEntries.length > 0) {
      criticalEntries.forEach(entry => {
        expect(entry.message).toBeString();
        expect(entry.message.length).toBeGreaterThan(0);
      });
    }
  });
});