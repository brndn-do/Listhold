import { AuthUser } from '@/types/authUser';
import { supabase } from '@/lib/supabase';

/**
 * Creates or updates a user's profile.
 * @param user - The authenticated user
 */
export const saveProfile = async (user: AuthUser): Promise<void> => {
  await supabase.from('profiles').upsert([
    {
      id: user.uid,
      display_name: user.displayName,
      avatar_url: user.photoURL,
    },
  ]);
};
