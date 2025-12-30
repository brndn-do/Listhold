import { supabase } from '@/lib/supabase';
import { ServiceError } from '@/types/serviceError';
import { FunctionsHttpError } from '@supabase/supabase-js';

type Status = 'confirmed' | 'waitlisted';

/**
 * Adds a user to an event
 * @param eventId - the event ID
 * @param userId - the UID of the user being added
 * @param answers - the answers to the prompts
 * @returns a status describing whether the user was added to the main list or the waitlist.
 * @throws if the serverless function errors.
 */
export const addUserToEvent = async (
  eventId: string,
  userId: string,
  answers: Record<string, boolean | null>,
): Promise<Status> => {
  const { data, error } = await supabase.functions.invoke('add_user_to_event', {
    body: {
      userId,
      eventId,
      answers,
    },
  });

  if (error) {
    // Check if it is a specific HTTP error from the edge function
    if (error instanceof FunctionsHttpError) {
      const status = error.context?.status;
      switch (status) {
        case 401:
        case 403:
          throw new ServiceError('unauthorized');
        case 404:
          throw new ServiceError('not-found');
        default:
          throw new ServiceError('internal');
      }
    }
    throw new ServiceError('internal');
  }

  if (!data || !['confirmed', 'waitlisted'].includes(data.status)) {
    throw new ServiceError('misc');
  }

  return data.status;
};
