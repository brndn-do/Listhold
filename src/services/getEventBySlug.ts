import 'server-only';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { EventProviderProps } from '@/context/EventProvider';

/**
 * Retrieves event details by slug.
 *
 * Signups under the event are not included.
 *
 * @param slug - The unique slug identifier for the event.
 * @returns A Promise resolving to the event data formatted for the EventProvider, or null if not found.
 */
export const getEventBySlug = async (
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

  if (error) {
    console.error('getEventBySlug: Supabase error', {
      slug,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to fetch event ${slug}`, { cause: error });
  }

  if (!data) return null;

  return {
    eventId: data.id,
    name: data.event_name,
    description: data.description ?? undefined,
    orgSlug: data.organizations?.slug,
    orgName: data.organizations?.organization_name,
    start: new Date(data.start_time),
    end: data.end_time ? new Date(data.end_time) : undefined,
    location: data.location,
    capacity: data.capacity,
    prompts: data.prompts.map((prompt) => ({
      id: prompt.id,
      type: prompt.prompt_type as 'yes/no' | 'notice',
      text: prompt.prompt_text,
      required: prompt.is_required,
      private: prompt.is_private,
    })),
  };
};
