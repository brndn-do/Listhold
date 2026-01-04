import { supabase } from './supabase.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const errorResponse = (message: string, status: number) => {
  return new Response(message, { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const SMTP2GO_API_KEY = Deno.env.get('SMTP2GO_API_KEY');
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL');

  if (!SMTP2GO_API_KEY || !FROM_EMAIL) {
    console.warn('SMTP2GO_API_KEY or FROM_EMAIL not set, skipping email');
    return;
  }

  try {
    const res = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: SMTP2GO_API_KEY,
        sender: `Listhold <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        html_body: html,
      }),
    });

    if (!res.ok) {
      console.error('SMTP2GO error:', await res.text());
    }
  } catch (e) {
    console.error('Failed to send email:', e);
  }
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
  const { userId, eventId } = reqData;

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

    // get creator ID and event name
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('creator_id, event_name, slug')
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

    // Handle application-level errors returned by the function
    if (data && data.error) {
      return errorResponse(data.error, 404);
    }

    if (!data || !data.signup_id) {
      console.error('Unexpected response format:', data);
      return errorResponse('Internal', 500);
    }

    // Send email if someone was promoted
    if (data.promoted_user_id) {
      const emailTask = async () => {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(data.promoted_user_id);

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

    return new Response(
      JSON.stringify({
        success: true,
        signupId: data.signup_id,
        status: data.new_status,
        oldStatus: data.old_status,
        promotedUserId: data.promoted_user_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse('Internal', 500);
  }
});
