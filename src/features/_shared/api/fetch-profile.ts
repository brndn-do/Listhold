import { supabase } from '@/features/_shared/lib/supabase';
import { ServiceError } from '@/features/_shared/types/serviceError';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  avatarURL: string | null;
  profileCompletedAt: Date | null;
}

export const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, profile_completed_at')
    .eq('id', uid)
    .maybeSingle();

  if (error) {
    throw new ServiceError('internal');
  }

  if (!data) {
    return null;
  }

  return {
    uid,
    displayName: data.display_name,
    avatarURL: data.avatar_url,
    profileCompletedAt: data.profile_completed_at ? new Date(data.profile_completed_at) : null,
  };
};
