import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE = Deno.env.get('TWILIO_PHONE_NUMBER')

interface SMSReportPayload {
  phoneNumber: string
  message: string
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const payload: SMSReportPayload = await req.json()

    // Check if Twilio is configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
      console.warn('Twilio not configured - SMS skipped')
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Twilio not configured' }), {
        status: 200,
      })
    }

    // Validate phone number
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(payload.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), { status: 400 })
    }

    // Twilio API endpoint
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    // Prepare form data
    const formData = new URLSearchParams()
    formData.append('From', TWILIO_PHONE)
    formData.append('To', payload.phoneNumber)
    formData.append('Body', payload.message)

    // Basic auth header
    const authHeader =
      'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

    let retries = 0
    const maxRetries = 2

    while (retries <= maxRetries) {
      try {
        const smsResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        })

        if (!smsResponse.ok) {
          const errorText = await smsResponse.text()
          console.error('Twilio API error:', smsResponse.status, errorText)

          if (retries < maxRetries && (smsResponse.status === 429 || smsResponse.status >= 500)) {
            retries++
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
            continue
          }

          return new Response(
            JSON.stringify({ error: 'Failed to send SMS', details: errorText }),
            { status: 500 }
          )
        }

        const smsResult = await smsResponse.json()

        console.log('Report SMS sent successfully:', smsResult.sid)

        return new Response(
          JSON.stringify({ success: true, messageSid: smsResult.sid }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      } catch (err) {
        console.error(`SMS send attempt ${retries + 1} failed:`, err)

        if (retries < maxRetries) {
          retries++
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
          continue
        }

        return new Response(JSON.stringify({ error: 'Failed to send SMS', details: String(err) }), { status: 500 })
      }
    }

    return new Response(
      JSON.stringify({ error: 'Failed to send SMS after retries' }),
      { status: 500 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), { status: 500 })
  }
})
