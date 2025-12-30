import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabaseTypes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and secret key must be defined');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
