import { db } from '../db';
import { networkActivitiesTable } from '../db/schema';
import { type NetworkActivity, type NetworkActivityQueryParams } from '../schema';
import { and, eq, gte, desc, type SQL } from 'drizzle-orm';

export async function getNetworkActivities(params?: NetworkActivityQueryParams): Promise<NetworkActivity[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (params?.activity_type) {
      conditions.push(eq(networkActivitiesTable.activity_type, params.activity_type));
    }

    if (params?.severity) {
      conditions.push(eq(networkActivitiesTable.severity, params.severity));
    }

    if (params?.since) {
      conditions.push(gte(networkActivitiesTable.timestamp, params.since));
    }

    // Build the final query in one chain to avoid type issues
    const baseQuery = db.select().from(networkActivitiesTable);
    
    let finalQuery;
    if (conditions.length > 0) {
      finalQuery = baseQuery
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(networkActivitiesTable.timestamp));
    } else {
      finalQuery = baseQuery
        .orderBy(desc(networkActivitiesTable.timestamp));
    }

    // Apply limit if specified
    const results = params?.limit 
      ? await finalQuery.limit(params.limit).execute()
      : await finalQuery.execute();

    // Convert metadata type and return results
    return results.map(activity => ({
      ...activity,
      metadata: activity.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to fetch network activities:', error);
    throw error;
  }
}