import { supabase } from '@/lib/supabase';
import { ProfileData } from '@/services/fetchProfile';
import { ServiceError } from '@/types/serviceError';

/**
 * Signs the user in using Google.
 */
export const signInWithGoogle = (): void => {
  const currentPath = window.location.pathname + window.location.search;

  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(currentPath)}`,
      queryParams: {
        // Forces the Google account picker every time
        prompt: 'select_account',
      },
    },
  });
};

/**
 * Signs the current user out.
 *
 * @throws A `ServiceError` if sign-out fails.
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new ServiceError('misc');
  }
};

/**
 * Subscribes to authentication state changes.
 *
 * @param callback - Function called with the current user (or null) whenever auth state changes
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToAuthState = (callback: (user: ProfileData | null) => void): (() => void) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      callback(null);
    } else {
      const user: ProfileData = {
        uid: session?.user.id,
        displayName: session?.user.user_metadata.full_name ?? null,
        avatarURL: session?.user.user_metadata.avatar_url ?? null,
      };
      callback(user);
    }
  });

  return () => {
    data.subscription.unsubscribe();
  };
};

/**
 * Loads and syncs the current authentication session.
 */
export const getSession = async (): Promise<void> => {
  await supabase.auth.getSession();
};
