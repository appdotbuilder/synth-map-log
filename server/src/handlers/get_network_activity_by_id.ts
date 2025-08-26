import { db } from '../db';
import { networkActivitiesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type NetworkActivity } from '../schema';

export async function getNetworkActivityById(id: number): Promise<NetworkActivity | null> {
  try {
    // Query for the specific network activity by ID
    const results = await db.select()
      .from(networkActivitiesTable)
      .where(eq(networkActivitiesTable.id, id))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const activity = results[0];

    // Convert numeric fields (real columns) back to numbers before returning
    return {
      ...activity,
      latitude: parseFloat(activity.latitude.toString()),
      longitude: parseFloat(activity.longitude.toString()),
      metadata: activity.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Network activity fetch failed:', error);
    throw error;
  }
}