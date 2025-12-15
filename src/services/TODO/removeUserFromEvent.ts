import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

type Status = 'removedFromEvent' | 'removedFromWaitlist';

interface RemoveUserResult {
  status: 'leftEvent' | 'leftWaitlist';
  message: string;
  promotedUserId?: string;
}

const cloudFunction = httpsCallable<
  { warmup: boolean; eventId: string; userId: string },
  RemoveUserResult
>(functions, 'removeUserFromEvent');

/**
 *
 * @param eventId - The event ID.
 * @param userId - The UID of the user being removed.
 * @returns A status describing whether the user was removed from the main list or the waitlist.
 * @throws If the serverless function errors.
 */
export const removeUserFromEvent = async (eventId: string, userId: string): Promise<Status> => {
  const res = await cloudFunction({ warmup: false, eventId, userId });
  const data: RemoveUserResult = res.data;
  if (data.status === 'leftEvent') {
    return 'removedFromEvent';
  }
  return 'removedFromWaitlist';
};
