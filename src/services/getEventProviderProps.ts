import 'server-only';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { EventProviderProps } from '@/context/EventProvider';

/**
 * Given an event's slug, fetches the non-realtime data needed for the event's page.
 *
 * Does not fetch signups under the event as they are considered realtime.
 *
 * @param slug - The unique slug of the event
 * @returns A Promise resolving to data needed for an event page, or null.
 */
export const getEventProviderProps = async (
  slug: string,
): Promise<Omit<EventProviderProps, 'children'> | null> => {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select(
      `
        id, slug, event_name, description,
        location, start_time, end_time, capacity,
        organizations(slug, organization_name),
        prompts(id, prompt_type, prompt_text, is_required, is_private)
      `,
    )
    .eq('slug', slug)
    .order('display_order', { referencedTable: 'prompts', ascending: true })
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    eventId: data.id,
    name: data.event_name,
    description: data.description ?? undefined,
    orgSlug: data.organizations.slug,
    orgName: data.organizations.organization_name,
    start: new Date(data.start_time),
    end: data.end_time ? new Date(data.end_time) : undefined,
    location: data.location,
    capacity: data.capacity,
    prompts: data.prompts.map((prompt) => {
      return {
        id: prompt.id,
        type: prompt.prompt_type as 'yes/no' | 'notice',
        text: prompt.prompt_text,
        required: prompt.is_required,
        private: prompt.is_private,
      };
    }),
  };
};
