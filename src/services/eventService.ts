import { db } from '@/lib/firebase';
import { doc, DocumentSnapshot, FirestoreError, onSnapshot } from 'firebase/firestore';

/**
 * Streams a Firestore document by its ID.
 * @param eventId The ID of the event to stream.
 * @param handler The function to call with the event data.
 * @param errorHandler The function to call if an error occurs.
 * @returns A function to unsubscribe from the event stream.
 */
export const streamEventById = (
  eventId: string,
  handler: (data: object | null) => void,
  errorHandler: (error: FirestoreError) => void,
) => {
  const docRef = doc(db, 'events', eventId);
  const unsub = onSnapshot(
    docRef,
    (docSnapshot: DocumentSnapshot) => {
      if (docSnapshot.exists()) {
        handler(docSnapshot.data());
      } else {
        handler(null);
      }
    },
    (error: FirestoreError) => {
      errorHandler(error);
    },
  );
  return unsub;
};
