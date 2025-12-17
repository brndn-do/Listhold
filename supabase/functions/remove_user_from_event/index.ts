import { supabase } from './supabase.ts';

const errorResponse = (message: string, status: number) => {
  return new Response(message, { status, headers: { 'Content-Type': 'application/json' } });
};

Deno.serve(async (req): Promise<Response> => {
  try {
    const { userId, eventId } = await req.json();

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
    const { data, error } = await supabase.rpc('remove_user_from_event', {
      p_user_id: userId,
      p_event_id: eventId,
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
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse('Internal', 500);
  }
});
