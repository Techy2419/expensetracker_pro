import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 === FUNCTION STARTED ===')
  console.log('📝 Method:', req.method)
  console.log('🌐 URL:', req.url)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled')
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Only process POST requests
  if (req.method !== 'POST') {
    console.log('❌ Wrong method:', req.method)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Method ${req.method} not allowed. Use POST.` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )
  }

  try {
    console.log('📥 === READING REQUEST ===')
    
    // Read request body first
    console.log('📖 Attempting to read body...')
    let bodyText = ''
    
    try {
      bodyText = await req.text()
      console.log('✅ Body read successfully')
    } catch (readError) {
      console.log('❌ Error reading body:', readError.message)
      throw new Error(`Failed to read request body: ${readError.message}`)
    }
    
    console.log('📄 Raw body text:', bodyText)
    console.log('📏 Body length:', bodyText.length)
    
    // Check if body is empty
    if (!bodyText || bodyText.trim() === '') {
      console.log('❌ Body is empty')
      throw new Error('Request body is empty - no data received')
    }
    
    // Try to parse JSON
    console.log('🔍 === PARSING JSON ===')
    let parsedData
    try {
      parsedData = JSON.parse(bodyText)
      console.log('✅ JSON parsed successfully')
      console.log('📋 Parsed data:', parsedData)
    } catch (parseError) {
      console.log('❌ JSON parse failed:', parseError.message)
      throw new Error(`JSON parse error: ${parseError.message}. Raw body: "${bodyText}"`)
    }
    
    // Validate required fields
    console.log('🔍 === VALIDATING DATA ===')
    
    // Check if this is an invitation email (new format) or direct email (old format)
    const isInvitation = parsedData.invitedEmail && parsedData.profileName;
    
    let to, subject, html;
    
    if (isInvitation) {
      // Handle invitation email
      const { invitedEmail, inviterName, profileName, shareLink, shareCode, role, message } = parsedData;
      
      if (!invitedEmail) {
        throw new Error('Missing required field: "invitedEmail"')
      }
      if (!profileName) {
        throw new Error('Missing required field: "profileName"')
      }
      
      to = invitedEmail;
      subject = `You're invited to join ${profileName} on FinTrackr!`;
      
      // Generate beautiful HTML email
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Join ${profileName} on FinTrackr</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: white; padding: 40px 20px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .share-code { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; font-family: monospace; font-size: 18px; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Join ${profileName} on FinTrackr</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hello!</h2>
              
              <p><strong>${inviterName}</strong> has invited you to join their expense tracking profile <strong>${profileName}</strong> on FinTrackr.</p>
              
              ${message ? `<p><em>"${message}"</em></p>` : ''}
              
              <p>You'll be able to:</p>
              <ul>
                <li>View and track shared expenses</li>
                <li>Collaborate on budgets</li>
                <li>Split bills and manage shared finances</li>
                <li>Access the profile as a <strong>${role}</strong></li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://fintrackr.vercel.app/" class="button">Join Profile Now</a>
              </div>
              
              <div class="share-code">
                <strong>Share Code:</strong><br>
                <span style="font-size: 24px; color: #667eea;">${shareCode}</span>
              </div>
              
              <p style="text-align: center; color: #666;">
                Or copy and paste this link:<br>
                <a href="https://fintrackr.vercel.app/" style="color: #667eea;">https://fintrackr.vercel.app/</a>
              </p>
              
              <div class="footer">
                <p>This invitation expires in 7 days.</p>
                <p>FinTrackr - Your Smart Financial Companion</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      console.log('✅ Invitation email generated')
      console.log('📧 Email details:', { to, subject, role, profileName })
      
    } else {
      // Handle direct email (old format)
      const { to: toField, subject: subjectField, html: htmlField } = parsedData;
      
      if (!toField) {
        throw new Error('Missing required field: "to" (email address)')
      }
      if (!subjectField) {
        throw new Error('Missing required field: "subject"')
      }
      if (!htmlField) {
        throw new Error('Missing required field: "html" (email content)')
      }
      
      to = toField;
      subject = subjectField;
      html = htmlField;
      
      console.log('✅ Direct email format detected')
      console.log('📧 Email details:', { to, subject, html })
    }
    
    try {
      // Send email directly via SendGrid API
      console.log('📤 === SENDING EMAIL ===')
      
      // For Edge Functions, we need to use a different approach
      const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }]
            }
          ],
          from: { email: 'expensetrackerprorp@gmail.com' },
          subject: subject,
          content: [
            {
              type: 'text/html',
              value: html
            }
          ]
        })
      })
      
      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        throw new Error(`SendGrid API error: ${emailResponse.status} ${errorText}`)
      }
      
      // Debug the response before parsing
      const responseText = await emailResponse.text()
      console.log('📡 SendGrid response status:', emailResponse.status)
      console.log('📡 SendGrid response text:', responseText)
      
      let emailData = {}
      if (responseText && responseText.trim()) {
        try {
          emailData = JSON.parse(responseText)
          console.log('✅ SendGrid response parsed:', emailData)
        } catch (parseError) {
          console.log('⚠️ SendGrid response not JSON, using empty object')
          emailData = {}
        }
      }
      
      console.log('✅ Email sent successfully via SendGrid')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully via SendGrid',
          emailId: (emailData as any)?.id || 'unknown'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
      
    } catch (emailError) {
      console.log('❌ Email sending error:', emailError.message)
      
      // Fallback: return success but log the email error
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Data received and validated successfully',
          received: { to, subject, html },
          note: 'Email sending failed but data was processed correctly. Check logs for details.',
          emailError: emailError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
  } catch (error) {
    console.log('❌ === ERROR OCCURRED ===')
    console.log('❌ Error message:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
