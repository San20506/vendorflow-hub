import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface SlackReportPayload {
  webhookUrl: string
  payload: Record<string, any>
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const payload: SlackReportPayload = await req.json()

    // Validate webhook URL
    if (!payload.webhookUrl.startsWith('https://hooks.slack.com')) {
      return new Response(JSON.stringify({ error: 'Invalid Slack webhook URL' }), { status: 400 })
    }

    let retries = 0
    const maxRetries = 2

    while (retries <= maxRetries) {
      try {
        const slackResponse = await fetch(payload.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload.payload),
        })

        if (!slackResponse.ok) {
          const errorText = await slackResponse.text()
          console.error('Slack API error:', slackResponse.status, errorText)

          if (retries < maxRetries && (slackResponse.status === 429 || slackResponse.status >= 500)) {
            retries++
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
            continue
          }

          return new Response(
            JSON.stringify({ error: 'Failed to send Slack message', details: errorText }),
            { status: 500 }
          )
        }

        console.log('Report posted to Slack successfully')

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      } catch (err) {
        console.error(`Slack send attempt ${retries + 1} failed:`, err)

        if (retries < maxRetries) {
          retries++
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
          continue
        }

        return new Response(JSON.stringify({ error: 'Failed to send Slack message', details: String(err) }), {
          status: 500,
        })
      }
    }

    return new Response(
      JSON.stringify({ error: 'Failed to send Slack message after retries' }),
      { status: 500 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), { status: 500 })
  }
})
