import { supabase } from '@/lib/supabase';
import { ServiceError } from '@/types/serviceError';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Database } from '../../types/supabaseTypes';

type SignupStatus = Database['public']['Enums']['signup_status_enum'];

/**
 * Removes a user from an event
 * @param eventId - the event ID
 * @param userId - the UID of the user being removed
 * @returns the old status of the signup.
 * @throws if the serverless function errors.
 */
export const removeUserFromEvent = async (
  eventId: string,
  userId: string,
): Promise<SignupStatus> => {
  const { data, error } = await supabase.functions.invoke('remove_user_from_event', {
    body: {
      userId,
      eventId,
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

  if (!data || data.status !== 'withdrawn') {
    throw new ServiceError('misc');
  }

  return data.oldStatus as SignupStatus;
};
