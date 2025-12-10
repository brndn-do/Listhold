import { auth } from '@/lib/firebase';
import { AuthUser } from '@/types/authUser';
import { signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';

/**
 * Signs the user in using Google's OAuth popup flow.
 *
 * Opens a Google authentication popup window. After a successful login,
 * resolves with the authenticated Firebase `User` object.
 *
 * @returns A `Promise` that resolves with a Firebase `User` object.
 * @throws If the Google sign-in popup fails or is blocked.
 */
export const signInWithGoogle = async (): Promise<AuthUser> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
};

/**
 * Signs the current user out of Firebase Authentication.
 *
 * @returns A `Promise` that resolves once the user is signed out.
 * @throws If sign-out fails.
 */
export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Subscribes to authentication state changes.
 *
 * @param callback - Function called with the current user (or null) whenever auth state changes
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToAuthState = (callback: (user: AuthUser | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};
