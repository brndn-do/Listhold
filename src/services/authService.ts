import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/authUser';

/**
 * Signs the user in using Google's OAuth popup flow.
 *
 * Opens a Google authentication popup window. After a successful login,
 * resolves with the authenticated Firebase `User` object.
 *
 * @returns A `Promise` that resolves with a Firebase `User` object.
 * @throws If the Google sign-in popup fails or is blocked.
 */
export const signInWithGoogle = async (): Promise<void> => {
  const currentPath = window.location.pathname + window.location.search;

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(currentPath)}`,
    },
  });
};

/**
 * Signs the current user out of Firebase Authentication.
 *
 * @returns A `Promise` that resolves once the user is signed out.
 * @throws If sign-out fails.
 */
export const signOutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
};

/**
 * Subscribes to authentication state changes.
 *
 * @param callback - Function called with the current user (or null) whenever auth state changes
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToAuthState = (callback: (user: AuthUser | null) => void): (() => void) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      callback(null);
    }
    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
      if (!session?.user?.id) return;
      const user: AuthUser = {
        uid: session?.user.id,
        displayName: session?.user.user_metadata.full_name ?? null,
        email: session?.user.email ?? null,
        photoURL: session?.user.user_metadata.avatar_url ?? null,
      };
      callback(user || null);
    }
  });

  return () => {
    data.subscription.unsubscribe();
  };
};
