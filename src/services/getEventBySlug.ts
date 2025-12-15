import 'server-only';

import { ClientEventData } from '@/types/clientEventData';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Database } from '../../supabaseTypes';

type EventRow = Database['public']['Tables']['events']['Row'];
type OrgRow = Database['public']['Tables']['organizations']['Row'];

/**
 * Fetches an event by its ID.
 *
 * @param eventId - The unique identifier of the event
 * @returns A Promise resolving to the event data with its ID, or null if not found
 */
export const getEventBySlug = async (eventSlug: string): Promise<ClientEventData | null> => {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*, organizations(organization_name, slug)')
    .eq('slug', eventSlug)
    .single();

  if (error || !data) {
    return null;
  }

  // Cast to include the joined table data
  const row = data as unknown as EventRow & {
    organizations: Pick<OrgRow, 'organization_name' | 'slug'>;
  };

  return {
    id: row.id,
    slug: row.slug,
    name: row.event_name,
    description: row.description ?? undefined,
    orgSlug: row.organizations.slug,
    orgName: row.organizations.organization_name,
    creatorId: row.creator_id,
    location: row.location,
    start: new Date(row.start_time),
    end: row.end_time ? new Date(row.end_time) : undefined,
    capacity: row.capacity,
    createdAt: new Date(row.created_at),
  };
};
