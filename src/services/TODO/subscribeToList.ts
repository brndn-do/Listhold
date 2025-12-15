import { db } from '@/lib/firebase';
import { SignupData } from '@/types/signupData';
import { WithId } from '@/types/withId';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  FirestoreDataConverter,
  Timestamp,
} from 'firebase/firestore';

/**
 * Generic Firestore data converter for a given type.
 */
function converter<T extends object>(): FirestoreDataConverter<T> {
  return {
    toFirestore(t: T) {
      return { ...t };
    },
    fromFirestore(snapshot) {
      return { ...(snapshot.data() as T) };
    },
  };
}

const signupConverter = converter<SignupData>();

/**
 * Subscribes to the signups subcollection for a given event.
 *
 * @param eventId - The event ID
 * @param onData - Callback invoked with the array of signups
 * @param onError - Callback invoked if an error occurs
 * @returns Unsubscribe function
 */
export const subscribeToSignups = (
  eventId: string,
  onData: (signups: WithId<SignupData>[]) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  const signupsRef = collection(db, 'events', eventId, 'signups').withConverter(signupConverter);
  const q = query(signupsRef, orderBy('signupTime'));

  return onSnapshot(
    q,
    (snapshot) => {
      const signups = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          signupTime:
            data.signupTime instanceof Timestamp ? data.signupTime.toDate() : data.signupTime,
        };
      });
      onData(signups);
    },
    (error) => {
      onError?.(error);
    },
  );
};

/**
 * Subscribes to the waitlist subcollection for a given event.
 *
 * @param eventId - The event ID
 * @param onData - Callback invoked with the array of waitlisted signups
 * @param onError - Callback invoked if an error occurs
 * @returns Unsubscribe function
 */
export const subscribeToWaitlist = (
  eventId: string,
  onData: (waitlist: WithId<SignupData>[]) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  const waitlistRef = collection(db, 'events', eventId, 'waitlist').withConverter(signupConverter);
  const q = query(waitlistRef, orderBy('signupTime'));

  return onSnapshot(
    q,
    (snapshot) => {
      const waitlist = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          signupTime:
            data.signupTime instanceof Timestamp ? data.signupTime.toDate() : data.signupTime,
        };
      });
      onData(waitlist);
    },
    (error) => {
      onError?.(error);
    },
  );
};
