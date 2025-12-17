import { supabase } from './supabase.ts';
import { z } from 'zod';
import type { Database } from '../../../types/supabaseTypes.ts';

const createOrgSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(3)
    .max(36)
    .regex(/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$/)
    .optional(),
  description: z.string().min(1).max(1000).optional(),
  avatar: z.string().min(1).max(1000).optional(), // Base64
});

type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];

Deno.serve(async (req): Promise<Response> => {
  const reqData = await req.json();
  const parsed = createOrgSchema.safeParse(reqData);

  if (!parsed.success) {
    return new Response('Invalid form data', { status: 400 });
  }

  const { name, slug, description } = parsed.data;

  // generate random slug if not specified
  const finalSlug = slug ?? crypto.randomUUID();

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
    organization_name: name,
    owner_id: user.id,
    slug: finalSlug,
    description: description,
  };

  // create organization
  const { data, error } = await supabase
    .from('organizations')
    .insert(toInsert)
    .select('slug')
    .single();

  if (error) {
    console.error('ERROR INSERTING: ', error.message);
    if (error.code === '23505') {
      return new Response(`An organization with slug ${finalSlug} already exists`, { status: 409 });
    }
    return new Response('Internal', { status: 500 });
  }

  if (!data) {
    console.error('ERROR INSERTING: row was not returned');
    return new Response('Internal', { status: 500 });
  }

  return new Response(
    JSON.stringify({
      success: true,
      slug: data.slug,
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  );
});
