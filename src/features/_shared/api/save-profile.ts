import { supabase } from '@/features/_shared/lib/supabase';
import { UserProfile } from '@/features/_shared/api/fetch-profile';

/**
 * Creates or updates a user's profile.
 * @param user - The authenticated user
 */
export const saveProfile = async (user: UserProfile): Promise<void> => {
  await supabase.from('profiles').upsert([
    {
      id: user.uid,
      display_name: user.displayName,
      avatar_url: user.avatarURL,
      profile_completed_at: user.profileCompletedAt?.toISOString() ?? null,
    },
  ]);
};
