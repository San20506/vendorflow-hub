import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

interface AlertNotificationPayload {
  alert_id: string
  vendor_id: string
  alert_type: string
  metric: string
  baseline: number
  current_value: number
  confidence: number
  recommendation: string
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const payload: AlertNotificationPayload = await req.json()

    // Fetch vendor email
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('email, name')
      .eq('id', payload.vendor_id)
      .single()

    if (vendorError || !vendor?.email) {
      console.error('Vendor not found:', vendorError)
      return new Response(JSON.stringify({ error: 'Vendor not found' }), { status: 404 })
    }

    // Build email content
    const alertTypeLabel = payload.alert_type.replace(/_/g, ' ').toUpperCase()
    const change = ((payload.current_value - payload.baseline) / payload.baseline) * 100
    const appUrl = 'https://app.vendorflow-hub.com' // Update with your domain

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #6b21a8; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .metric-box { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: bold; color: #111; margin: 5px 0; }
    .metric-change { font-size: 14px; color: ${change > 0 ? '#dc2626' : '#16a34a'}; }
    .recommendation { background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .button { display: inline-block; background-color: #6b21a8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🚨 Alert: ${alertTypeLabel}</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Confidence: ${(payload.confidence * 100).toFixed(0)}%</p>
    </div>
    <div class="content">
      <p>Hi ${vendor.name || 'Vendor'},</p>

      <p>We detected an anomaly in your sales data:</p>

      <div class="metric-box">
        <div class="metric-label">${payload.metric}</div>
        <div class="metric-value">${payload.current_value.toFixed(2)}</div>
        <div>
          <span style="color: #666;">Baseline:</span>
          <span style="font-weight: bold;">${payload.baseline.toFixed(2)}</span>
        </div>
        <div class="metric-change">
          ${change > 0 ? '+' : ''}${change.toFixed(1)}% change
        </div>
      </div>

      <div class="recommendation">
        <strong>Recommended Action:</strong>
        <p style="margin: 10px 0 0 0;">${payload.recommendation}</p>
      </div>

      <p>
        <a href="${appUrl}/insights" class="button">View Full Analysis</a>
      </p>

      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        You can adjust alert sensitivity or dismiss this alert in your Insights dashboard.
      </p>
    </div>
    <div class="footer">
      <p>VendorFlow Hub • Alerts sent at ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
    `

    // Send via Resend
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
            from: 'alerts@vendorflow-hub.com',
            to: vendor.email,
            subject: `🚨 ${alertTypeLabel}: ${payload.metric}`,
            html: emailHtml,
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

        // Log success
        console.log('Email sent successfully:', emailResult)

        // Record in alert history
        await supabase.from('alert_history').insert({
          alert_id: payload.alert_id,
          vendor_id: payload.vendor_id,
          action: 'email_sent',
          new_status: 'ongoing',
        })

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
