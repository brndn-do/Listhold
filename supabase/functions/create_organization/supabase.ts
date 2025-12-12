import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseSecretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

console.log('SUPABASE URL:', supabaseUrl);
console.log('SUPABASE KEY:', supabaseSecretKey);

export const supabase = createClient(supabaseUrl!, supabaseSecretKey!);