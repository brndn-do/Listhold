'use client';

import { auth } from '@/lib/firebase';
import { saveUserDocument } from '@/services/userService';
import { signInWithPopup, signOut, User, GoogleAuthProvider } from 'firebase/auth';
import { createContext, ReactNode, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

/**
 * Defines the shape of the authentication context.
 * - `user`: The current Firebase user, or null if not signed in.
 * - `loading`: Whether the authentication state is still loading.
 */
interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
}

// Create a react context for authentication state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication context to all child components
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, loading] = useAuthState(auth);
  const value = { user, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom react hook to access authentication context.
 *
 * @throws Error if called outside of an `AuthProvider`.
 * @returns `{user, loading}`
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Handles user sign-in with Google.
 *
 * Opens a popup for Google authentication, and after a successful login,
 * saves the user document to Firestore using `saveUserDocument()`.
 */
export const handleSignIn = async () => {
  const provider = new GoogleAuthProvider();

  // Prompts account selection each time
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    await saveUserDocument(result);
  } catch (err) {
    console.error(err);
  }
};

/**
 * Handles user sign-out.
 * 
 * Signs the user out from Firebase Authentication.
 */
export const handleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
  }
};
