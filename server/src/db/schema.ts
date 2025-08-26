import { serial, text, pgTable, timestamp, real, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// Enum definitions for PostgreSQL
export const logSeverityEnum = pgEnum('log_severity', ['info', 'warning', 'error', 'debug', 'critical']);
export const activityTypeEnum = pgEnum('activity_type', ['intrusion', 'firewall', 'connection', 'scan', 'breach', 'traffic']);

// Log entries table for real-time server logs
export const logEntriesTable = pgTable('log_entries', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  severity: logSeverityEnum('severity').notNull(),
  source: text('source').notNull(),
  message: text('message').notNull(),
  ip_address: text('ip_address'), // Nullable field for IP addresses
  user_agent: text('user_agent'), // Nullable field for user agent strings
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Network activities table for map data points
export const networkActivitiesTable = pgTable('network_activities', {
  id: serial('id').primaryKey(),
  latitude: real('latitude').notNull(), // Geographic coordinates
  longitude: real('longitude').notNull(),
  activity_type: activityTypeEnum('activity_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  ip_address: text('ip_address').notNull(),
  port: integer('port'), // Nullable port number
  country: text('country'), // Nullable country name
  city: text('city'), // Nullable city name
  severity: logSeverityEnum('severity').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  metadata: jsonb('metadata'), // JSON object for additional data
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types inferred from table schemas
export type LogEntry = typeof logEntriesTable.$inferSelect;
export type NewLogEntry = typeof logEntriesTable.$inferInsert;

export type NetworkActivity = typeof networkActivitiesTable.$inferSelect;
export type NewNetworkActivity = typeof networkActivitiesTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  logEntries: logEntriesTable,
  networkActivities: networkActivitiesTable
};