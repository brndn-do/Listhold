import { supabase } from './supabase.ts';
import { z } from 'zod';
import type { Database } from '../../../types/supabaseTypes.ts';

const createEventSchema = z
  .object({
    name: z.string().min(1).max(50),
    orgSlug: z
      .string()
      .min(3)
      .max(36)
      .regex(/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$/),
    slug: z
      .string()
      .min(3)
      .max(36)
      .regex(/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$/)
      .optional(),
    location: z.string().min(1).max(200),
    capacity: z.number().min(1).max(300),
    start: z.iso.datetime(),
    end: z.iso.datetime().optional(),
    description: z.string().min(1).max(1000).optional(),
    photo: z.string().min(1).max(1000).optional(), // Base64
  })
  .superRefine((data, ctx) => {
    if (data.end && new Date(data.start) >= new Date(data.end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['end'],
      });
    }
  });

type EventsInsert = Database['public']['Tables']['events']['Insert'];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req): Promise<Response> => {
  // Handle CORS Preflight Request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let reqData;

  try {
    reqData = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400, headers: corsHeaders });
  }

  const parsed = createEventSchema.safeParse(reqData);

  if (!parsed.success) {
    return new Response('Invalid form data', { status: 400, headers: corsHeaders });
  }

  const { name, orgSlug, slug, description, location, capacity, start, end } = parsed.data;

  // generate random event slug if not specified
  const finalSlug = slug ?? crypto.randomUUID();

  // check auth
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  // get org ID based on org slug
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (orgError || !orgData) {
    console.error('ERROR FETCHING ORG ID FROM SLUG:', orgError.message);
    return new Response('Internal', { status: 500, headers: corsHeaders });
  }

  const orgId = orgData.id;

  const toInsert: EventsInsert = {
    event_name: name,
    organization_id: orgId,
    creator_id: user.id,
    slug: finalSlug,
    description,
    capacity,
    location,
    start_time: start,
    end_time: end,
  };

  // create event
  const { data, error } = await supabase.from('events').insert(toInsert).select('slug').single();

  if (error) {
    console.error('ERROR INSERTING:', error.message);
    if (error.code === '23505') {
      return new Response(`An event with slug ${finalSlug} already exists`, { status: 409 });
    }
    return new Response('Internal', { status: 500, headers: corsHeaders });
  }

  if (!data) {
    console.error('ERROR INSERTING: row was not returned');
    return new Response('Internal', { status: 500, headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      success: true,
      slug: data.slug,
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
