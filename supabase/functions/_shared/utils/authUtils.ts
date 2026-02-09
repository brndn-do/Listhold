import { supabase } from '../lib/supabase.ts';

export const getCallerId = async (req: Request): Promise<string | null> => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7, authHeader.length);

  const { data, error } = await supabase.auth.getClaims(token);
  if (error) return null;

  const uid = data?.claims?.sub;
  return typeof uid === 'string' && uid.length > 0 ? uid : null;
};
