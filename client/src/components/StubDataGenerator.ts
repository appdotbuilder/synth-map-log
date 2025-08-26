import type { NetworkActivity, LogEntry, LogSeverity, ActivityType } from '../../../server/src/schema';

// STUB IMPLEMENTATION - This generates dummy data for UI showcase
// In production, this would be replaced with real backend data

const severities: LogSeverity[] = ['critical', 'error', 'warning', 'info', 'debug'];
const activityTypes: ActivityType[] = ['intrusion', 'firewall', 'connection', 'scan', 'breach', 'traffic'];

const sources = ['firewall', 'ids', 'vpn', 'auth', 'web-server', 'database', 'network', 'system'];

const countries = ['USA', 'Russia', 'China', 'Germany', 'Brazil', 'India', 'Japan', 'UK', 'France', 'Canada'];
const cities = ['New York', 'Moscow', 'Beijing', 'Berlin', 'São Paulo', 'Mumbai', 'Tokyo', 'London', 'Paris', 'Toronto'];

const ipRanges = [
  '192.168.', '10.0.', '172.16.', '203.98.', '45.76.', '159.89.', '104.248.', '167.99.',
  '188.166.', '46.101.', '139.59.', '157.245.', '68.183.', '165.227.', '143.110.'
];

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  'curl/7.68.0', 'python-requests/2.25.1', 'Go-http-client/1.1',
  'Postman', 'wget/1.20.3', 'Apache-HttpClient/4.5.13'
];

const logMessages = [
  'Authentication successful for user',
  'Failed login attempt detected',
  'Suspicious port scan detected from',
  'Firewall blocked connection to',
  'SSL certificate validation failed',
  'Database connection timeout',
  'API rate limit exceeded',
  'Malware signature detected',
  'Intrusion attempt blocked',
  'Network anomaly detected',
  'System backup completed',
  'Cache cleared successfully',
  'Configuration updated',
  'Service restarted',
  'Memory usage threshold exceeded'
];

const activityTitles = {
  intrusion: ['Unauthorized Access Attempt', 'Brute Force Attack', 'SQL Injection Attempt', 'XSS Attack Detected'],
  firewall: ['Firewall Rule Triggered', 'Port Block Activated', 'IP Blacklist Hit', 'Traffic Filtered'],
  connection: ['New Connection Established', 'VPN Connection', 'SSH Session Started', 'Database Connection'],
  scan: ['Port Scan Detected', 'Vulnerability Scan', 'Network Discovery', 'Service Enumeration'],
  breach: ['Security Breach Confirmed', 'Data Exfiltration', 'Malware Execution', 'System Compromise'],
  traffic: ['Traffic Analysis', 'Bandwidth Monitor', 'Network Health Check', 'Performance Metrics']
};

const generateRandomIP = (): string => {
  const range = ipRanges[Math.floor(Math.random() * ipRanges.length)];
  const third = Math.floor(Math.random() * 255);
  const fourth = Math.floor(Math.random() * 255);
  return `${range}${third}.${fourth}`;
};

const generateRandomCoordinates = (): { lat: number; lng: number } => {
  // Generate coordinates near populated areas for more realistic visualization
  const hotspots = [
    { lat: 40.7128, lng: -74.0060 }, // New York
    { lat: 37.7749, lng: -122.4194 }, // San Francisco
    { lat: 51.5074, lng: -0.1278 }, // London
    { lat: 48.8566, lng: 2.3522 }, // Paris
    { lat: 35.6762, lng: 139.6503 }, // Tokyo
    { lat: 55.7558, lng: 37.6176 }, // Moscow
    { lat: 39.9042, lng: 116.4074 }, // Beijing
    { lat: -23.5505, lng: -46.6333 }, // São Paulo
    { lat: 19.0760, lng: 72.8777 }, // Mumbai
    { lat: 52.5200, lng: 13.4050 }, // Berlin
  ];
  
  const hotspot = hotspots[Math.floor(Math.random() * hotspots.length)];
  const latOffset = (Math.random() - 0.5) * 10; // ±5 degree variation
  const lngOffset = (Math.random() - 0.5) * 20; // ±10 degree variation
  
  return {
    lat: Math.max(-90, Math.min(90, hotspot.lat + latOffset)),
    lng: Math.max(-180, Math.min(180, hotspot.lng + lngOffset))
  };
};

export const generateStubLogEntries = (count: number = 50): LogEntry[] => {
  const logs: LogEntry[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const baseMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
    const ip = Math.random() > 0.3 ? generateRandomIP() : null;
    const userAgent = Math.random() > 0.7 ? userAgents[Math.floor(Math.random() * userAgents.length)] : null;
    
    // Create more realistic messages
    let message = baseMessage;
    if (ip && (baseMessage.includes('from') || baseMessage.includes('to'))) {
      message = `${baseMessage} ${ip}`;
    } else if (baseMessage.includes('user') && Math.random() > 0.5) {
      message = `${baseMessage} admin_${Math.floor(Math.random() * 100)}`;
    }
    
    // Add context based on severity
    if (severity === 'critical') {
      message = `CRITICAL: ${message} - Immediate action required`;
    } else if (severity === 'error') {
      message = `ERROR: ${message}`;
    } else if (severity === 'warning') {
      message = `WARNING: ${message}`;
    }
    
    const timestamp = new Date(now.getTime() - Math.random() * 3600000 * 24); // Random time in last 24h
    
    logs.push({
      id: i + 1000,
      timestamp,
      severity,
      source,
      message,
      ip_address: ip,
      user_agent: userAgent,
      created_at: timestamp
    });
  }
  
  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const generateStubNetworkActivities = (count: number = 30): NetworkActivity[] => {
  const activities: NetworkActivity[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const coordinates = generateRandomCoordinates();
    const titles = activityTitles[activityType];
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    const ip = generateRandomIP();
    const port = Math.random() > 0.5 ? Math.floor(Math.random() * 65535) + 1 : null;
    const country = countries[Math.floor(Math.random() * countries.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    const descriptions = {
      intrusion: `Detected unauthorized access attempt from ${ip}. Multiple failed authentication attempts recorded.`,
      firewall: `Firewall rule triggered blocking traffic from ${ip} to protected resources.`,
      connection: `New ${Math.random() > 0.5 ? 'inbound' : 'outbound'} connection established with ${ip}.`,
      scan: `Port scanning activity detected from ${ip} targeting multiple services.`,
      breach: `Security breach confirmed: Malicious activity detected from ${ip} with elevated privileges.`,
      traffic: `Network traffic analysis completed for ${ip} showing anomalous patterns.`
    };
    
    const metadata = {
      protocol: Math.random() > 0.5 ? 'TCP' : 'UDP',
      bytes_transferred: Math.floor(Math.random() * 1000000),
      duration_ms: Math.floor(Math.random() * 60000),
      threat_score: Math.floor(Math.random() * 100),
      geolocation_accuracy: Math.floor(Math.random() * 100) + 50
    };
    
    const timestamp = new Date(now.getTime() - Math.random() * 3600000 * 12); // Random time in last 12h
    
    activities.push({
      id: i + 2000,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      activity_type: activityType,
      title,
      description: descriptions[activityType],
      ip_address: ip,
      port,
      country,
      city,
      severity,
      timestamp,
      metadata,
      created_at: timestamp
    });
  }
  
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const generateStubLogEntry = (): LogEntry => {
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const source = sources[Math.floor(Math.random() * sources.length)];
  const baseMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
  const ip = Math.random() > 0.4 ? generateRandomIP() : null;
  const userAgent = Math.random() > 0.8 ? userAgents[Math.floor(Math.random() * userAgents.length)] : null;
  
  let message = baseMessage;
  if (ip && (baseMessage.includes('from') || baseMessage.includes('to'))) {
    message = `${baseMessage} ${ip}`;
  }
  
  if (severity === 'critical' || severity === 'error') {
    message = `${severity.toUpperCase()}: ${message}`;
  }
  
  const now = new Date();
  
  return {
    id: Math.floor(Math.random() * 10000) + 10000,
    timestamp: now,
    severity,
    source,
    message,
    ip_address: ip,
    user_agent: userAgent,
    created_at: now
  };
};