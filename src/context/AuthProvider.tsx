'use client';

import { auth } from '@/lib/firebase';
import { signInWithPopup, signOut, User, GoogleAuthProvider } from 'firebase/auth';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

/**
 * Defines the shape of the authentication context.
 * - `user`: The current Firebase user, or null/undefined if not signed in or not yet loaded.
 * - `loading`: Whether the authentication state is still loading.
 */
interface AuthContextType {
  readonly user: User | null | undefined;
  readonly loading: boolean;
}

// Create a react context for authentication state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication context to all child components
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, loading] = useAuthState(auth);
  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom react hook to access authentication context.
 *
 * @throws Error if called outside of an `AuthProvider`.
 * @returns `{user, loading}`
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Signs the user in using Google's OAuth popup flow.
 *
 * Opens a Google authentication popup window. After a successful login,
 * resolves with the authenticated Firebase `User` object.
 *
 * @returns A `Promise` that resolves with a Firebase `User` object.
 * @throws If the Google sign-in popup fails or is blocked.
 */
export const handleSignIn = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();

  // Prompts account selection each time
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  return user;
};

/**
 * Signs the current user out of Firebase Authentication.
 *
 * @returns A `Promise` that resolves once the user is signed out.
 * @throws If sign-out fails.
 */
export const handleSignOut = async (): Promise<void> => {
  await signOut(auth);
};
