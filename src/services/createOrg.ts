import { supabase } from '@/lib/supabase';

interface CreateOrgRequest {
  name: string;
  id?: string;
}

/**
 * Creates an organization.
 * @param request - An object including the request details.
 * @returns The id of the newly created organization.
 * @throws If the user is not signed in or the organization could not be created.
 */
export const createOrg = async (request: CreateOrgRequest): Promise<string> => {
  const toSend = {
    name: request.name,
    slug: request.id,
  };

  const { data, error } = await supabase.functions.invoke('create_organization', {
    method: 'POST',
    body: toSend,
  });

  if (error || !data) {
    throw new Error('Error creating organization');
  }

  const { slug } = data;

  return slug;
};
