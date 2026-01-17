'use client';

import { getSession, subscribeToAuthState } from '@/services/authService';
import { ProfileData } from '@/services/fetchProfile';
import { saveProfile } from '@/services/saveProfile';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Defines the shape of the authentication context.
 * - `user`: The current authenticated user, or null/undefined if not signed in or not yet loaded.
 * - `loading`: Whether the authentication state is still loading.
 */
interface AuthContextType {
  readonly user: ProfileData | null;
  readonly loading: boolean;
}

// Create a react context for authentication state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication context to all child components
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession();
    const unsubAuthState = subscribeToAuthState(async (data) => {
      if (data) {
        try {
          await saveProfile(data);
          setUser(data);
        } catch(err) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
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
