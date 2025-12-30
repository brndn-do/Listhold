import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../types/supabaseTypes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and key must be defined');
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);
