import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

/**
 * Creates or updates a user document in Firestore.
 * @param user The User object from Firebase Authentication.
 */
export const saveUserDocument = async (user: User) => {
  const userData = {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp(),
  };
  try {
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, userData, { merge: true });
  } catch (err) {
    console.error('Error saving user document:', err);
    throw err;
  }
};
