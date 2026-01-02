import { supabase } from '@/lib/supabase';
import { ServiceError } from '@/types/serviceError';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface Prompt {
  displayOrder: number;
  promptType: 'yes/no' | 'notice',
  promptText: string;
  isRequired: boolean;
  isPrivate: boolean;
}

export interface CreateEventRequest {
  name: string;
  orgSlug?: string;
  slug?: string;
  location: string;
  capacity: number;
  start: string;
  end?: string;
  description?: string;
  photo?: File;
  prompts?: Prompt[]
}

/**
 * Creates an event
 * @param request - An object including the request details.
 * @returns The id of the newly created event.
 * @throws if the cloud function errors.
 */
export const createEvent = async (request: CreateEventRequest): Promise<string> => {
  const toSend = {
    name: request.name,
    orgSlug: request.orgSlug,
    slug: request.slug,
    location: request.location,
    capacity: request.capacity,
    start: request.start,
    end: request.end,
    description: request.description,
    prompts: request.prompts,
  };

  const { data, error } = await supabase.functions.invoke('create_event', {
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
