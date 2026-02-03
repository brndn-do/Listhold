'use client';

import { getSession, subscribeToAuthState } from '@/services/authService';
import { fetchProfile, ProfileData } from '@/services/fetchProfile';
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
      if (!data) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const profile = await fetchProfile(data.uid);
        if (!profile) {
          const defaultProfile: ProfileData = {
            uid: data.uid,
            displayName: data.displayName ?? null,
            avatarURL: data.avatarURL ?? null,
            profileCompletedAt: null,
          };
          await saveProfile(defaultProfile);
          setUser(defaultProfile);
        } else {
          setUser(profile);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
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
