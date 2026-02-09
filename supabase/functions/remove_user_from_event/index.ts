import { supabase } from '../_shared/lib/supabase.ts';
import {
  handleCorsPreflight,
  errorResponse,
  successResponse,
} from '../_shared/utils/responseUtils.ts';
import { getCallerId } from '../_shared/utils/authUtils.ts';
import { sendEmail } from '../_shared/utils/emailUtils.ts';

Deno.serve(async (req): Promise<Response> => {
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  let reqData;

  try {
    reqData = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }
  const { userId, eventId } = reqData;

  try {
    const callerId = await getCallerId(req);
    if (!callerId) {
      return errorResponse('Unauthorized', 401);
    }

    // get creator ID and event name
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('owner_id, event_name, slug')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) {
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
    const { data: rawData, error } = await supabase.rpc('remove_user_from_event', {
      p_user_id: userId,
      p_event_id: eventId,
    });

    if (error) {
      console.error('POSTGRES FUNCTION ERROR: ', error.message);
      return errorResponse('Internal Server Error', 500);
    }

    const data = rawData as {
      signup_id?: string;
      new_status?: string;
      old_status?: string;
      promoted_user_id?: string;
      error?: string;
    };

    // Handle application-level errors returned by the function
    if (data && data.error) {
      return errorResponse(data.error, 404);
    }

    if (!data || !data.signup_id) {
      console.error('Unexpected response format:', data);
      return errorResponse('Internal Server Error', 500);
    }

    const promotedUserId = data.promoted_user_id;

    // Send email if someone was promoted
    if (promotedUserId) {
      const emailTask = async () => {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(promotedUserId);

          const appDomain = Deno.env.get('APP_DOMAIN');
          if (!appDomain) {
            console.warn('APP_DOMAIN not set, skipping email');
          }

          if (appDomain && userData && userData.user && userData.user.email) {
            const eventName = eventData.event_name;
            const eventSlug = eventData.slug;

            const subject = `You're off the waitlist for ${eventName}!`;
            const html = `
              <p>Good news! A spot opened up for the event: <b>${eventName}</b> and you have been moved to the main list!</p>
              <p>No further action is needed.</p>
              <p>You can view the event details <a href="${appDomain}/events/${eventSlug}">here</a>.</p>
              <br/>
              <hr/>
              <p style="font-size: 12px; color: #666;">
                You received this email because you joined the waitlist for <b>${eventName}</b>. 
                This is a one-time notification regarding your status change. 
                Your email has not been added to any marketing lists.
              </p>
            `;

            await sendEmail(userData.user.email, subject, html);
          }
        } catch (emailErr) {
          console.error('Background email task failed:', emailErr);
        }
      };

      // Use EdgeRuntime.waitUntil to run in background without blocking response
      // @ts-ignore: EdgeRuntime is available in the Supabase Edge Functions environment
      if (typeof EdgeRuntime !== 'undefined' && 'waitUntil' in EdgeRuntime) {
        // @ts-ignore: EdgeRuntime is available in the Supabase Edge Functions environment
        EdgeRuntime.waitUntil(emailTask());
      } else {
        // Fallback for local testing or environments without EdgeRuntime
        await emailTask();
      }
    }

    return successResponse(
      {
        success: true,
        signupId: data.signup_id,
        status: data.new_status,
        oldStatus: data.old_status,
        promotedUserId: data.promoted_user_id,
      },
      200,
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse('Internal Server Error', 500);
  }
});
