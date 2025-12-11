'use client';

import { signInWithGoogle, signOutUser, subscribeToAuthState } from '@/services/authService';
import { AuthUser } from '@/types/authUser';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Defines the shape of the authentication context.
 * - `user`: The current authenticated user, or null/undefined if not signed in or not yet loaded.
 * - `loading`: Whether the authentication state is still loading.
 */
interface AuthContextType {
  readonly user: AuthUser | null | undefined;
  readonly loading: boolean;
}

// Create a react context for authentication state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication context to all child components
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuthState = subscribeToAuthState((data) => {
      setUser(data);
      setLoading(false);
    });

    return () => {
      unsubAuthState();
    };
  }, []);

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
 * resolves with an `AuthUser` object.
 *
 * @returns A `Promise` that resolves with an `AuthUser` object.
 * @throws If the Google sign-in popup fails or is blocked.
 */
export const handleSignIn = async (): Promise<void> => {
  return await signInWithGoogle();
};

/**
 * Signs the current user out.
 *
 * @returns A `Promise` that resolves once the user is signed out.
 * @throws If sign-out fails.
 */
export const handleSignOut = async (): Promise<void> => {
  await signOutUser();
};
