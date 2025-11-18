// Ensure this file only runs on the server side.
import 'server-only';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Given an organization ID, gets the organization name and description from Firestore.
 * Server-side only.
 * @param id The organization document ID in Firestore.
 * @returns A promise that resolves to an object containing the organization name, description, and owner ID.
 */
export const getOrganizationById = async (
  id: string,
): Promise<{ name: string; description: string; ownerId: string } | null> => {
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
          ownerId: data?.ownerId,
        }
      : null;
  } catch (err) {
    console.error('Error fetching organization', err);
    throw err;
  }
};

/**
 * Given an owner ID, gets the owner's name of the organization from Firestore.
 * @param id The user ID of the owner in Firebase
 * @returns A promise that resolves to the owner's display name.
 */
export const getOwnerNameById = async (id: string): Promise<string> => {
  try {
    const collectionRef = adminDb.collection('users');
    const docRef = collectionRef.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('user does not exist');
    }

    const data = doc.data();
    return data?.displayName;
  } catch (err) {
    console.error('Error fetching owner name', err);
    throw err;
  }
};
