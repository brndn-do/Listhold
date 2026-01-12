import { supabase } from '../_shared/supabase.ts';
import { z } from 'zod';
import type { Database } from '../../../types/supabaseTypes.ts';

const promptSchema = z.object({
  displayOrder: z.number().min(1),
  promptType: z.enum(['yes/no', 'notice']),
  promptText: z.string().min(1).max(300),
  isRequired: z.boolean().default(true),
  isPrivate: z.boolean().default(true),
});

const createEventSchema = z
  .object({
    name: z.string().min(1).max(50),
    orgSlug: z
      .string()
      .min(3)
      .max(36)
      .regex(/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$/)
      .optional(),
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
    prompts: z.array(promptSchema).optional(),
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
type PromptsInsert = Database['public']['Tables']['prompts']['Insert'];

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

  const { name, orgSlug, slug, description, location, capacity, start, end, prompts } = parsed.data;

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

  let orgId: string | null = null;
  if (orgSlug) {
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
    orgId = orgData.id;
  }

  const toInsert: EventsInsert = {
    event_name: name,
    organization_id: orgId,
    owner_id: user.id,
    slug: finalSlug,
    description,
    capacity,
    location,
    start_time: start,
    end_time: end,
  };

  // create event
  const { data, error } = await supabase
    .from('events')
    .insert(toInsert)
    .select('id, slug')
    .single();

  if (error) {
    console.error('ERROR INSERTING:', error.code, error.message);
    if (error.code === '23505') {
      return new Response(`An event with slug ${finalSlug} already exists`, { status: 409 });
    }
    if (error.code === '23514') {
      return new Response(`Slug ${finalSlug} is reserved`, { status: 409 });
    }
    return new Response('Internal', { status: 500, headers: corsHeaders });
  }

  if (!data) {
    console.error('ERROR INSERTING: row was not returned');
    return new Response('Internal', { status: 500, headers: corsHeaders });
  }

  // Insert prompts if provided
  if (prompts && prompts.length > 0) {
    const promptsToInsert: PromptsInsert[] = prompts.map((prompt) => ({
      event_id: data.id,
      display_order: prompt.displayOrder,
      prompt_type: prompt.promptType,
      prompt_text: prompt.promptText,
      is_required: prompt.isRequired,
      is_private: prompt.isPrivate,
    }));

    const { error: promptsError } = await supabase.from('prompts').insert(promptsToInsert);

    if (promptsError) {
      console.error('ERROR INSERTING PROMPTS:', promptsError.message);
      // Delete the event to maintain consistency
      await supabase.from('events').delete().eq('id', data.id);
      return new Response('Failed to create event with prompts', {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      slug: data.slug,
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
