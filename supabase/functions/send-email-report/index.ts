import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailReportPayload {
  to: string
  subject: string
  html: string
  vendorName?: string
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const payload: EmailReportPayload = await req.json()

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500 })
    }

    let retries = 0
    const maxRetries = 2

    while (retries <= maxRetries) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'reports@vendorflow-hub.com',
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
          }),
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error('Resend API error:', emailResponse.status, errorText)

          if (retries < maxRetries && (emailResponse.status === 429 || emailResponse.status >= 500)) {
            retries++
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries)) // Exponential backoff
            continue
          }

          return new Response(
            JSON.stringify({ error: 'Failed to send email', details: errorText }),
            { status: 500 }
          )
        }

        const emailResult = await emailResponse.json()

        console.log('Report email sent successfully:', emailResult)

        return new Response(
          JSON.stringify({ success: true, emailId: emailResult.id }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      } catch (err) {
        console.error(`Email send attempt ${retries + 1} failed:`, err)

        if (retries < maxRetries) {
          retries++
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
          continue
        }

        return new Response(JSON.stringify({ error: 'Failed to send email', details: String(err) }), { status: 500 })
      }
    }

    return new Response(
      JSON.stringify({ error: 'Failed to send email after retries' }),
      { status: 500 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), { status: 500 })
  }
})
