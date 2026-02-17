'use client';

import { loadSession, subscribeToAuthState } from '@/features/_shared/api/auth-service';
import { fetchProfile, UserProfile } from '@/features/_shared/api/fetch-profile';
import { saveProfile } from '@/features/_shared/api/save-profile';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useRef } from 'react';

/**
 * Defines the shape of the authentication context.
 * - `user`: The current authenticated user, or null/undefined if not signed in or not yet loaded.
 * - `loading`: Whether the authentication state is still loading.
 * - `updateUser`: Function to manually update the user profile in context (e.g. after editing).
 */
interface AuthContextType {
  readonly user: UserProfile | null;
  readonly loading: boolean;
  readonly updateUser: (data: UserProfile) => void;
}

// Create a react context for authentication state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication context to all child components
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUid = useRef<string | null>(null);

  const updateUser = (data: UserProfile) => {
    setUser(data);
  };

  useEffect(() => {
    loadSession();

    const unsubAuthState = subscribeToAuthState(async (data) => {
      if (!data) {
        setUser(null);
        lastUid.current = null;
        setLoading(false);
        return;
      }

      if (data.uid === lastUid.current) {
        return;
      }

      lastUid.current = data.uid;
      setLoading(true);

      try {
        const profile = await fetchProfile(data.uid);
        if (!profile) {
          const defaultProfile: UserProfile = {
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
        lastUid.current = null;
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubAuthState();
    };
  }, []);

  const value = useMemo(() => ({ user, loading, updateUser }), [user, loading]);

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
