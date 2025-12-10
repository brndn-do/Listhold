import { functions } from '@/lib/firebase';
import { FunctionsError, httpsCallable } from 'firebase/functions';

interface CreateEventRequest {
  name: string;
  location: string;
  start: string;
  end?: string;
  capacity: number;
  eventId?: string;
  organizationId: string;
}

interface CreateEventResult {
  eventId: string;
  message: string;
}

const cloudFunction = httpsCallable<CreateEventRequest, CreateEventResult>(
  functions,
  'createEvent',
);

/**
 * Creates an event
 * @param request - An object including the request details.
 * @returns The id of the newly created event.
 * @throws if the cloud function errors.
 */
export const createEvent = async (request: CreateEventRequest): Promise<string> => {
  try {
    const result = await cloudFunction(request);
    const data = result.data;
    return data.eventId;
  } catch (err: unknown) {
    const firebaseError = err as FunctionsError;
    throw new Error(firebaseError.code);
  }
};
