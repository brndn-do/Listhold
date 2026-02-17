import 'server-only';

import { supabaseAdmin } from '@/features/_shared/lib/supabaseAdmin';
import { OrgPageProps } from '@/features/orgs/components/OrgPage';

/**
 * Given an organization's slug, fetches the data needed for the organizations's page.
 *
 * Also fetches the organization's upcoming events, sorted by start time in ascending order (max 50).
 *
 * @param slug - The unique slug of the organization
 * @returns A Promise resolving to `OrgPageProps` or `null`
 */
export const getOrgBySlug = async (slug: string): Promise<OrgPageProps | null> => {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select(
      `slug, organization_name, description, owner_id, created_at,
        events(slug, event_name, start_time, location)
        `,
    )
    .eq('slug', slug)
    .gt('events.start_time', new Date().toISOString())
    .order('start_time', { referencedTable: 'events', ascending: true })
    .limit(50, { referencedTable: 'events' })
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    slug: data.slug,
    name: data.organization_name,
    description: data.description ?? undefined,
    ownerId: data.owner_id,
    events: data.events.map((event) => {
      return {
        slug: event.slug,
        name: event.event_name,
        start: new Date(event.start_time),
        location: event.location,
      };
    }),
  };
};
