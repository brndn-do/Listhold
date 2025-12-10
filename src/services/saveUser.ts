import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuthUser } from '@/types/authUser';

/**
 * Creates or updates a user.
 * @param user The User object from Firebase Authentication.
 */
export const saveUser = async (user: AuthUser): Promise<void> => {
  const userData = {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp(),
  };
  const docRef = doc(db, 'users', user.uid);
  await setDoc(docRef, userData, { merge: true });
};
