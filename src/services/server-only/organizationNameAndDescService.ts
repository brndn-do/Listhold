// Ensure this file only runs on the server side.
import 'server-only';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Given an organization ID, gets the organization name and description from Firestore.
 * Server-side only.
 * @param id The organization document ID in Firestore.
 * @returns A promise that resolves to an object containing the organization name and description.
 */
export const getOrganizationNameAndDescById = async (
  id: string,
): Promise<{ name: string; description: string } | null> => {
  try {
    const collectionRef = adminDb.collection('organizations');
    const docRef = collectionRef.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`no organization found with id: ${id}`);
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
    console.error('Error fetching organization', err);
    throw err;
  }
};
