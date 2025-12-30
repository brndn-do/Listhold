import { supabase } from '@/lib/supabase';
import { ServiceError } from '@/types/serviceError';

export interface SignupData {
  id: string;
  userId: string;
  displayName: string | null;
  avatarURL: string | null;
  status: 'confirmed' | 'waitlisted' | 'withdrawn';
  createdAt: Date;
}

export const fetchInitialList = async (eventId: string): Promise<SignupData[]> => {
  const { data, error } = await supabase
    .from('event_list')
    .select('*')
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'waitlisted'])
    .order('created_at');

  if (error || !data) {
    throw new ServiceError('internal');
  }

  return data.map((row) => {
    return {
      id: row.signup_id!,
      userId: row.user_id!,
      displayName: row.display_name,
      avatarURL: row.avatar_url,
      status: row.status!,
      createdAt: new Date(row.created_at!),
    };
  });
};
