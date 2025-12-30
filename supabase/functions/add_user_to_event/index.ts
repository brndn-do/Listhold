import { supabase } from './supabase.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const errorResponse = (message: string, status: number) => {
  return new Response(message, { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

  const { userId, eventId, answers } = reqData;
  
  try {
    // check auth
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !caller) {
      return errorResponse('Unauthorized', 401);
    }

    // get creator ID
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('creator_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) {
      return errorResponse('Internal', 500);
    }

    if (!eventData) {
      return errorResponse('Event not found', 404);
    }

    const creatorId = eventData.creator_id;

    // If the caller is not the user being added nor the creator of the event
    if (caller.id !== userId && caller.id !== creatorId) {
      return errorResponse('Unauthorized', 403);
    }

    // authorized, call postgres function
    const { data, error } = await supabase.rpc('add_user_to_event', {
      p_user_id: userId,
      p_event_id: eventId,
      p_answers: answers ?? {},
    });

    if (error) {
      console.error('POSTGRES FUNCTION ERROR: ', error.message);
      return errorResponse('Internal', 500);
    }

    if (!data || !data.id) {
      return errorResponse('Internal', 500);
    }

    return new Response(
      JSON.stringify({
        success: true,
        signupId: data.id,
        status: data.status,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse('Internal', 500);
  }
});
