import { supabase } from '../_shared/lib/supabase.ts';
import { getCallerId } from '../_shared/utils/authUtils.ts';
import {
  handleCorsPreflight,
  errorResponse,
  successResponse,
} from '../_shared/utils/responseUtils.ts';
import type { Database } from '../../../types/supabaseTypes.ts';
import { z } from 'jsr:@zod/zod@4.3.6';

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

Deno.serve(async (req): Promise<Response> => {
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  let reqData;

  try {
    reqData = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = createEventSchema.safeParse(reqData);

  if (!parsed.success) {
    return errorResponse('Invalid form data', 400);
  }

  const { name, orgSlug, slug, description, location, capacity, start, end, prompts } = parsed.data;

  // generate random event slug if not specified
  const finalSlug = slug ?? crypto.randomUUID();

  const callerId = await getCallerId(req);
  if (!callerId) {
    return errorResponse('Unauthorized', 401);
  }

  console.log(callerId);

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
      return errorResponse('Internal Server Error', 500);
    }
    orgId = orgData.id;
  }

  const toInsert: EventsInsert = {
    event_name: name,
    organization_id: orgId,
    owner_id: callerId,
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
      return errorResponse(`An event with slug ${finalSlug} already exists`, 409);
    }
    if (error.code === '23514') {
      return errorResponse(`Slug ${finalSlug} is reserved`, 409);
    }
    return errorResponse('Internal Server Error', 500);
  }

  if (!data) {
    console.error('ERROR INSERTING: row was not returned');
    return errorResponse('Internal Server Error', 500);
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
      return errorResponse('Failed to create event with prompts', 500);
    }
  }

  return successResponse(
    {
      success: true,
      slug: data.slug,
    },
    201,
  );
});
