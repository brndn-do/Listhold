export const sendEmail = async (to: string, subject: string, html: string) => {
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
