import 'server-only';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Given an event ID, gets the event name and description from Firestore.
 * Server-side only.
 * @param id The event document ID in Firestore.
 * @returns A promise that resolves to an object containing the event name and description.
 */
export const getEventNameAndDescById = async (
  id: string,
): Promise<{ name: string; description: string } | null> => {
  try {
    const collectionRef = adminDb.collection('events');
    const docRef = collectionRef.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`no event found with id: ${id}`);
      return null;
    }

    const data = doc.data();

    return data
      ? {
          name: data?.name,
          description: data?.description,
        }
      : null;
  } catch (err) {
    console.error('Error fetching event', err);
    throw err;
  }
};
