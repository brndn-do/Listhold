import { supabase } from '@/lib/supabase';
import { ServiceError } from '@/types/serviceError';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface CreateOrgRequest {
  name: string;
  id?: string;
}

/**
 * Creates an organization.
 * @param request - An object including the request details.
 * @returns The id of the newly created organization.
 * @throws A `ServiceError` if the organization could not be created.
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

  if (error) {
    const functionsError = error as FunctionsHttpError;
    const status = functionsError.context.status;
    if (status === 409) {
      throw new ServiceError('already-exists');
    }
    throw new ServiceError('internal');
  }

  if (!data) {
    throw new ServiceError('internal');
  }

  const { slug } = data;

  return slug;
};
