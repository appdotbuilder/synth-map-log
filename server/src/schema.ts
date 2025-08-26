import { z } from 'zod';

// Log entry severity levels
export const logSeveritySchema = z.enum(['info', 'warning', 'error', 'debug', 'critical']);
export type LogSeverity = z.infer<typeof logSeveritySchema>;

// Network activity types for map data points
export const activityTypeSchema = z.enum(['intrusion', 'firewall', 'connection', 'scan', 'breach', 'traffic']);
export type ActivityType = z.infer<typeof activityTypeSchema>;

// Log entry schema
export const logEntrySchema = z.object({
  id: z.number(),
  timestamp: z.coerce.date(),
  severity: logSeveritySchema,
  source: z.string(),
  message: z.string(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.coerce.date()
});

export type LogEntry = z.infer<typeof logEntrySchema>;

// Network activity data point schema for map
export const networkActivitySchema = z.object({
  id: z.number(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  activity_type: activityTypeSchema,
  title: z.string(),
  description: z.string(),
  ip_address: z.string(),
  port: z.number().int().min(1).max(65535).nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  severity: logSeveritySchema,
  timestamp: z.coerce.date(),
  metadata: z.record(z.any()).nullable(), // JSON object for additional data
  created_at: z.coerce.date()
});

export type NetworkActivity = z.infer<typeof networkActivitySchema>;

// Input schema for creating log entries
export const createLogEntryInputSchema = z.object({
  severity: logSeveritySchema,
  source: z.string(),
  message: z.string(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable()
});

export type CreateLogEntryInput = z.infer<typeof createLogEntryInputSchema>;

// Input schema for creating network activities
export const createNetworkActivityInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  activity_type: activityTypeSchema,
  title: z.string(),
  description: z.string(),
  ip_address: z.string(),
  port: z.number().int().min(1).max(65535).nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  severity: logSeveritySchema,
  metadata: z.record(z.any()).nullable()
});

export type CreateNetworkActivityInput = z.infer<typeof createNetworkActivityInputSchema>;

// Query parameters for filtering logs
export const logQueryParamsSchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  severity: logSeveritySchema.optional(),
  since: z.coerce.date().optional()
});

export type LogQueryParams = z.infer<typeof logQueryParamsSchema>;

// Query parameters for filtering network activities
export const networkActivityQueryParamsSchema = z.object({
  limit: z.number().int().positive().optional(),
  activity_type: activityTypeSchema.optional(),
  severity: logSeveritySchema.optional(),
  since: z.coerce.date().optional()
});

export type NetworkActivityQueryParams = z.infer<typeof networkActivityQueryParamsSchema>;