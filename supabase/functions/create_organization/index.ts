import { supabase } from '../_shared/lib/supabase.ts';
import {
  handleCorsPreflight,
  errorResponse,
  successResponse,
} from '../_shared/utils/responseUtils.ts';
import { getCallerId } from '../_shared/utils/authUtils.ts';
import { z } from 'jsr:@zod/zod@4.3.6';
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
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  let reqData;

  try {
    reqData = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = createOrgSchema.safeParse(reqData);

  if (!parsed.success) {
    return errorResponse('Invalid form data', 400);
  }

  const { name, slug, description } = parsed.data;

  // generate random slug if not specified
  const finalSlug = slug ?? crypto.randomUUID();

  const callerId = await getCallerId(req);
  if (!callerId) {
    return errorResponse('Unauthorized', 401);
  }

  const toInsert: OrganizationInsert = {
    organization_name: name,
    owner_id: callerId,
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
      return errorResponse(`An organization with slug ${finalSlug} already exists`, 409);
    }
    return errorResponse('Internal Server Error', 500);
  }

  if (!data) {
    console.error('ERROR INSERTING: row was not returned');
    return errorResponse('Internal Server Error', 500);
  }

  return successResponse(
    {
      success: true,
      slug: data.slug,
    },
    201,
  );
});
