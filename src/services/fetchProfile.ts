import { supabase } from '@/lib/supabase';
import { ServiceError } from '@/types/serviceError';

export interface ProfileData {
  uid: string;
  displayName: string | null;
  avatarURL: string | null;
}

export const fetchProfile = async (uid: string): Promise<ProfileData> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', uid)
    .single();

  if (error) {
    throw new ServiceError('internal');
  }

  if (!data) {
    throw new ServiceError('not-found');
  }

  return {
    uid,
    displayName: data.display_name,
    avatarURL: data.avatar_url,
  };
};
