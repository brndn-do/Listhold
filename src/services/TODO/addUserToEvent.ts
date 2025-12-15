import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

type Status = 'added' | 'waitlisted';

interface AddUserResult {
  status: 'signedUp' | 'waitlisted';
  message: string;
}

const cloudFunction = httpsCallable<
  {
    warmup: boolean;
    eventId: string;
    userId: string;
    answers: Record<string, boolean | null>;
  },
  AddUserResult
>(functions, 'addUserToEvent');

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
  const res = await cloudFunction({ warmup: false, eventId, userId, answers });
  const data: AddUserResult = res.data;
  if (data.status === 'signedUp') {
    return 'added';
  }
  return data.status;
};
