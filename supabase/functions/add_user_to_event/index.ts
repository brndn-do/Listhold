import { getCallerId } from '../_shared/utils/authUtils.ts';
import { supabase } from '../_shared/lib/supabase.ts';
import {
  handleCorsPreflight,
  errorResponse,
  successResponse,
} from '../_shared/utils/responseUtils.ts';

Deno.serve(async (req): Promise<Response> => {
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  let reqData;

  try {
    reqData = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { userId, eventId, answers } = reqData;

  try {
    const callerId = await getCallerId(req);
    if (!callerId) {
      return errorResponse('Unauthorized', 401);
    }

    // get creator ID
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('owner_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) {
      console.error('Error fetching event owner:', eventError);
      return errorResponse('Internal Server Error', 500);
    }

    if (!eventData) {
      return errorResponse('Event not found', 404);
    }

    const ownerId = eventData.owner_id;

    // If the caller is not the user being added nor the creator of the event
    if (callerId !== userId && callerId !== ownerId) {
      return errorResponse('Unauthorized', 403);
    }

    // authorized, call postgres function
    const { data: rawData, error } = await supabase.rpc('add_user_to_event', {
      p_user_id: userId,
      p_event_id: eventId,
      p_answers: answers ?? {},
    });

    if (error) {
      console.error('POSTGRES FUNCTION ERROR: ', error.message);
      return errorResponse('Internal Server Error', 500);
    }

    const data = rawData as {
      id?: string;
      status?: string;
    };

    if (!data || !data.id) {
      console.error('Unexpected RPC response:', data);
      return errorResponse('Internal Server Error', 500);
    }

    return successResponse(
      {
        success: true,
        signupId: data.id,
        status: data.status,
      },
      201,
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse('Internal Server Error', 500);
  }
});
