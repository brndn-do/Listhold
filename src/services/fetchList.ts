import { supabase } from '@/lib/supabase';
import { ServiceError } from '@/types/serviceError';

export interface SignupData {
  id: string;
  userId: string;
  displayName: string | null;
  avatarURL: string | null;
  status: 'confirmed' | 'waitlisted' | 'withdrawn';
  answers: Record<string, string | boolean>;
  createdAt: Date;
}

export const fetchList = async (eventId: string): Promise<SignupData[]> => {
  const { data, error } = await supabase
    .from('event_list_view')
    .select('*')
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'waitlisted'])
    .order('position');

  if (error) {
    throw new ServiceError('internal');
  }

  if (!data) {
    throw new ServiceError('not-found');
  }

  return data.map((row) => {
    return {
      id: row.signup_id!,
      userId: row.user_id!,
      displayName: row.display_name,
      avatarURL: row.avatar_url,
      status: row.status!,
      answers: row.answers as SignupData['answers'],
      createdAt: new Date(row.created_at!),
    };
  });
};
