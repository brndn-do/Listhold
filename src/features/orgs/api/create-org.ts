import { supabase } from '@/features/_shared/lib/supabase';
import { ServiceError } from '@/features/_shared/types/serviceError';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface CreateOrgInput {
  name: string;
  slug?: string;
  description?: string;
}

/**
 * Creates an organization.
 * @param input - An object including the request details.
 * @returns The slug of the newly created organization.
 * @throws A `ServiceError` if the organization could not be created.
 */
export const createOrg = async (input: CreateOrgInput): Promise<string> => {
  const toSend = {
    name: input.name,
    slug: input.slug,
    description: input.description,
  };

  const { data, error } = await supabase.functions.invoke('create_organization', {
    body: toSend,
  });

  if (error) {
    const functionsError = error as FunctionsHttpError;
    const status = functionsError.context.status;
    if (status === 409) {
      throw new ServiceError('already-exists');
    }
    if (status === 401) {
      throw new ServiceError('unauthorized');
    }
    throw new ServiceError('internal');
  }

  if (!data) {
    throw new ServiceError('internal');
  }

  const { slug } = data;

  return slug;
};
