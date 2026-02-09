import { createClient } from 'jsr:@supabase/supabase-js@2.95.3';
import { Database } from '../../../../types/supabaseTypes.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and service role key must be defined');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
