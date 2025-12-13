import 'server-only';

import { OrganizationData } from '@/types/organizationData';
import { WithId } from '@/types/withId';
import { Database } from '../../supabaseTypes';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

/**
 * Fetches an organization by its ID.
 *
 * @param orgId - The unique identifier of the organization
 * @returns A Promise resolving to the organization data with its ID, or null if not found
 */
export const getOrgById = async (orgId: string): Promise<WithId<OrganizationData> | null> => {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('slug', orgId)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as OrganizationRow;

  return {
    id: row.slug,
    name: row.organization_name,
    description: row.description ?? undefined,
    ownerId: row.owner_id,
    createdAt: new Date(row.created_at),
  };
};
