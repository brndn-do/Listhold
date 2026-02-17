import { supabase } from '@/features/_shared/lib/supabase';
import { ServiceError } from '@/features/_shared/types/serviceError';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface Prompt {
  displayOrder: number;
  promptType: 'yes/no' | 'notice';
  promptText: string;
  isRequired: boolean;
  isPrivate: boolean;
}

export interface CreateEventInput {
  name: string;
  orgSlug?: string;
  slug?: string;
  location: string;
  capacity: number;
  start: string;
  end?: string;
  description?: string;
  photo?: File;
  prompts?: Prompt[];
}

/**
 * Creates an event
 * @param input - An object including the request details.
 * @returns The id of the newly created event.
 * @throws if the cloud function errors.
 */
export const createEvent = async (input: CreateEventInput): Promise<string> => {
  const toSend = {
    name: input.name,
    orgSlug: input.orgSlug,
    slug: input.slug,
    location: input.location,
    capacity: input.capacity,
    start: input.start,
    end: input.end,
    description: input.description,
    prompts: input.prompts,
  };

  const { data, error } = await supabase.functions.invoke('create_event', {
    body: toSend,
  });

  if (error) {
    const functionsError = error as FunctionsHttpError;
    const status = functionsError.context.status;
    const errorMessage = await functionsError.context.text();

    if (status === 409) {
      if (errorMessage.includes('reserved')) {
        throw new ServiceError('reserved');
      }
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
