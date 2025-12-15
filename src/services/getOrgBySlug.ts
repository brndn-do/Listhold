import 'server-only';

import { ClientOrgData } from '@/types/clientOrgData';
import { Database } from '../../supabaseTypes';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

/**
 * Fetches an organization by its Slug.
 *
 * @param orgSlug - The unique slug of the organization
 * @returns A Promise resolving to the organization data with its ID, or null if not found
 */
export const getOrgBySlug = async (orgSlug: string): Promise<ClientOrgData | null> => {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as OrganizationRow;

  return {
    slug: row.slug,
    name: row.organization_name,
    description: row.description ?? undefined,
    ownerId: row.owner_id,
    createdAt: new Date(row.created_at),
  };
};
