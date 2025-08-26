import { db } from '../db';
import { networkActivitiesTable } from '../db/schema';
import { type CreateNetworkActivityInput, type NetworkActivity } from '../schema';

export const createNetworkActivity = async (input: CreateNetworkActivityInput): Promise<NetworkActivity> => {
  try {
    // Insert network activity record
    const result = await db.insert(networkActivitiesTable)
      .values({
        latitude: input.latitude,
        longitude: input.longitude,
        activity_type: input.activity_type,
        title: input.title,
        description: input.description,
        ip_address: input.ip_address,
        port: input.port,
        country: input.country,
        city: input.city,
        severity: input.severity,
        timestamp: new Date(), // Current timestamp for the activity
        metadata: input.metadata
      })
      .returning()
      .execute();

    // Return the created network activity
    const networkActivity = result[0];
    return {
      ...networkActivity,
      // Ensure numeric fields are properly typed
      latitude: Number(networkActivity.latitude),
      longitude: Number(networkActivity.longitude),
      // Ensure metadata is properly typed
      metadata: networkActivity.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Network activity creation failed:', error);
    throw error;
  }
};