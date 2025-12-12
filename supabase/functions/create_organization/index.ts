import { supabase } from './supabase.ts';
import { z } from 'zod';
import type { Database } from '../../../supabaseTypes.ts';

const createOrgSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/)
    .optional(),
  description: z.string().min(1).max(200).optional(),
  avatar: z.string().optional(), // Base64
});

type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

Deno.serve(async (req): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const reqData = await req.json();
  const parsed = createOrgSchema.safeParse(reqData);

  if (!parsed.success) {
    return new Response('Invalid form data', { status: 400 });
  }

  const { name, slug, description } = parsed.data;

  // generate ID
  const organizationId = crypto.randomUUID();
  // set slug to ID if not provided
  const finalSlug = slug ?? organizationId;

  // check auth
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const toInsert: OrganizationInsert = {
    id: organizationId,
    organization_name: name,
    owner_id: user.id,
    slug: finalSlug,
    description: description,
  };

  // create organization
  const { data, error } = await supabase
    .from('organizations')
    .insert(toInsert)
    .select('id, slug')
    .single();

  const row = data as OrganizationRow | null;

  if (error) {
    console.error('ERROR INSERTING: ', error.message);
    if (error.code === '23505') {
      return new Response(`An organization with slug ${finalSlug} already exists`, { status: 409 });
    }
    return new Response('Internal', { status: 500 });
  }

  if (!row) {
    console.error('ERROR INSERTING: row was not returned');
    return new Response('Internal', { status: 500 });
  }

  return new Response(
    JSON.stringify({
      success: true,
      organizationId: row.id,
      slug: row.slug,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
