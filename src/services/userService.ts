import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Creates or updates a user document in Firestore.
 * @param user The Firebase Auth user object.
 */
export const saveUserDocument = async (userData: UserData) => {
  try {
    const docRef = doc(db, 'users', userData.uid);
    const dataToSave = {
      displayName: userData.displayName,
      email: userData.email,
      photoURL: userData.photoURL,
      lastLogin: serverTimestamp(),
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    console.error('Error saving user document:', err);
    throw err;
  }
};
