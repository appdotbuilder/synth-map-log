import { type LogEntry, type NetworkActivity, type LogSeverity, type ActivityType } from '../schema';

// Sample data for generating realistic dummy content
const SOURCES = [
  'auth-service', 'firewall', 'nginx', 'database', 'api-gateway', 
  'load-balancer', 'cache-server', 'monitoring', 'backup-system', 'cdn'
];

const LOG_MESSAGES = {
  info: [
    'User login successful',
    'System backup completed',
    'Cache cleared successfully',
    'API request processed',
    'Database connection established',
    'Service health check passed',
    'Configuration updated',
    'Session created'
  ],
  warning: [
    'High memory usage detected',
    'Slow database query',
    'Connection pool near capacity',
    'Rate limit approaching',
    'Disk space running low',
    'SSL certificate expires soon',
    'Failed login attempt',
    'Unusual traffic pattern'
  ],
  error: [
    'Database connection failed',
    'Authentication service unavailable',
    'File upload failed',
    'Payment processing error',
    'External API timeout',
    'Memory allocation failed',
    'Configuration file corrupted',
    'Service crash detected'
  ],
  debug: [
    'Query execution time: 125ms',
    'Cache hit ratio: 94%',
    'Request validation passed',
    'Environment variable loaded',
    'Thread pool status: active',
    'Network latency: 45ms',
    'Memory usage: 67%',
    'CPU utilization: 23%'
  ],
  critical: [
    'System security breach detected',
    'Data corruption found',
    'Service completely unavailable',
    'Multiple system failures',
    'Disk failure imminent',
    'Network infrastructure down',
    'Critical vulnerability exploited',
    'Emergency shutdown initiated'
  ]
};

const ACTIVITY_TITLES = {
  intrusion: ['Unauthorized Access Attempt', 'Brute Force Attack', 'SQL Injection Detected', 'Cross-Site Scripting'],
  firewall: ['Blocked Connection', 'Port Scan Blocked', 'Malicious IP Filtered', 'Geographic Restriction'],
  connection: ['New Connection', 'VPN Connection', 'Proxy Connection', 'Direct Connection'],
  scan: ['Port Scan Detected', 'Vulnerability Scan', 'Network Discovery', 'Service Enumeration'],
  breach: ['Data Exfiltration', 'Credential Theft', 'System Compromise', 'Malware Detected'],
  traffic: ['High Traffic Volume', 'DDoS Attack', 'Bandwidth Spike', 'Load Balancing']
};

const COUNTRIES = [
  'United States', 'China', 'Russia', 'Germany', 'United Kingdom', 
  'France', 'Japan', 'Brazil', 'India', 'Canada', 'Australia', 
  'South Korea', 'Netherlands', 'Sweden', 'Poland'
];

const CITIES = {
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
  'China': ['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou', 'Chengdu'],
  'Russia': ['Moscow', 'St. Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan'],
  'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Kobe'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Recife'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa']
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
  'Mozilla/5.0 (Android 11; Mobile; rv:91.0) Gecko/91.0'
];

// Helper functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateRandomIP(): string {
  return [
    randomInt(1, 255),
    randomInt(0, 255),
    randomInt(0, 255),
    randomInt(1, 255)
  ].join('.');
}

function generateRandomTimestamp(hoursBack: number = 24): Date {
  const now = new Date();
  const millisecondsBack = hoursBack * 60 * 60 * 1000;
  return new Date(now.getTime() - Math.random() * millisecondsBack);
}

export async function generateDummyLogEntries(count: number = 50): Promise<LogEntry[]> {
  const entries: LogEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    const severity = randomChoice(['info', 'warning', 'error', 'debug', 'critical'] as LogSeverity[]);
    const source = randomChoice(SOURCES);
    const message = randomChoice(LOG_MESSAGES[severity]);
    const timestamp = generateRandomTimestamp(72); // Last 3 days
    
    entries.push({
      id: i + 1,
      timestamp,
      severity,
      source,
      message,
      ip_address: Math.random() > 0.3 ? generateRandomIP() : null,
      user_agent: Math.random() > 0.5 ? randomChoice(USER_AGENTS) : null,
      created_at: timestamp
    });
  }
  
  // Sort by timestamp descending (most recent first)
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export async function generateDummyNetworkActivities(count: number = 100): Promise<NetworkActivity[]> {
  const activities: NetworkActivity[] = [];
  
  for (let i = 0; i < count; i++) {
    const activityType = randomChoice(['intrusion', 'firewall', 'connection', 'scan', 'breach', 'traffic'] as ActivityType[]);
    const severity = randomChoice(['info', 'warning', 'error', 'debug', 'critical'] as LogSeverity[]);
    const country = randomChoice(COUNTRIES);
    const city = randomChoice(CITIES[country as keyof typeof CITIES] || ['Unknown']);
    const title = randomChoice(ACTIVITY_TITLES[activityType]);
    const timestamp = generateRandomTimestamp(48); // Last 2 days
    
    // Generate realistic coordinates based on major world regions
    let latitude: number;
    let longitude: number;
    
    // Generate coordinates based on country (simplified)
    if (country === 'United States') {
      latitude = randomFloat(25, 49);
      longitude = randomFloat(-125, -66);
    } else if (country === 'China') {
      latitude = randomFloat(20, 50);
      longitude = randomFloat(73, 135);
    } else if (country === 'Russia') {
      latitude = randomFloat(41, 82);
      longitude = randomFloat(19, 169);
    } else if (country === 'Germany') {
      latitude = randomFloat(47, 55);
      longitude = randomFloat(5, 15);
    } else if (country === 'United Kingdom') {
      latitude = randomFloat(49, 61);
      longitude = randomFloat(-8, 2);
    } else {
      // Default to random global coordinates
      latitude = randomFloat(-85, 85);
      longitude = randomFloat(-180, 180);
    }
    
    const metadata = {
      bytes_transferred: randomInt(1024, 1048576),
      connection_duration: randomInt(1, 3600),
      protocol: randomChoice(['TCP', 'UDP', 'HTTP', 'HTTPS', 'SSH', 'FTP']),
      risk_score: randomFloat(0, 100),
      blocked: Math.random() > 0.7
    };
    
    activities.push({
      id: i + 1,
      latitude,
      longitude,
      activity_type: activityType,
      title,
      description: `${title} from ${city}, ${country}. ${randomChoice([
        'Automated threat detected.',
        'Manual investigation required.',
        'Pattern matches known attack signature.',
        'Geolocation-based security rule triggered.',
        'Suspicious behavior analysis completed.'
      ])}`,
      ip_address: generateRandomIP(),
      port: Math.random() > 0.3 ? randomInt(1, 65535) : null,
      country,
      city,
      severity,
      timestamp,
      metadata,
      created_at: timestamp
    });
  }
  
  // Sort by timestamp descending (most recent first)
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export async function streamRandomLogEntry(): Promise<LogEntry> {
  const severity = randomChoice(['info', 'warning', 'error', 'debug', 'critical'] as LogSeverity[]);
  const source = randomChoice(SOURCES);
  const message = randomChoice(LOG_MESSAGES[severity]);
  const now = new Date();
  
  return {
    id: Date.now(), // Use timestamp as unique ID for streaming
    timestamp: now,
    severity,
    source,
    message,
    ip_address: Math.random() > 0.3 ? generateRandomIP() : null,
    user_agent: Math.random() > 0.5 ? randomChoice(USER_AGENTS) : null,
    created_at: now
  };
}