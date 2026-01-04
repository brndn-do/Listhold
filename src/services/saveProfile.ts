import { supabase } from '@/lib/supabase';
import { ProfileData } from '@/services/fetchProfile';

/**
 * Creates or updates a user's profile.
 * @param user - The authenticated user
 */
export const saveProfile = async (user: ProfileData): Promise<void> => {
  await supabase.from('profiles').upsert([
    {
      id: user.uid,
      display_name: user.displayName,
      avatar_url: user.avatarURL,
    },
  ]);
};
