import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { invitationId, profileId, invitedEmail, inviterName, profileName, shareCode, shareLink, role, message } = await req.json()

    // Validate required fields
    if (!invitationId || !profileId || !invitedEmail || !inviterName || !profileName || !shareCode || !shareLink) {
      throw new Error('Missing required fields')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Send email using Resend (you can also use SendGrid, Mailgun, etc.)
    const emailResponse = await sendEmail({
      to: invitedEmail,
      subject: `${inviterName} invited you to join "${profileName}"`,
      html: generateEmailHTML({
        inviterName,
        profileName,
        shareCode,
        shareLink,
        role,
        message,
        invitationId
      })
    })

    if (emailResponse.success) {
      // Update invitation status to 'sent'
      const { error: updateError } = await supabaseClient
        .from('profile_invitations')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (updateError) {
        console.error('Error updating invitation status:', updateError)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invitation email sent successfully',
          emailId: emailResponse.emailId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      throw new Error('Failed to send email')
    }

  } catch (error) {
    console.error('Error in send-invitation-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

// Email sending function using Resend
async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ExpenseTracker <noreply@yourproject.vercel.app>', // Update this to your Vercel domain
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const data = await response.json()
    
    if (response.ok) {
      return { success: true, emailId: data.id }
    } else {
      console.error('Resend API error:', data)
      return { success: false, error: data.message }
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

// Generate beautiful HTML email template
function generateEmailHTML({ 
  inviterName, 
  profileName, 
  shareCode, 
  shareLink, 
  role, 
  message, 
  invitationId 
}: {
  inviterName: string
  profileName: string
  shareCode: string
  shareLink: string
  role: string
  message: string
  invitationId: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to join ${profileName}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
          background-color: #f8fafc;
        }
        .container { 
          background: white; 
          border-radius: 12px; 
          padding: 40px; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          color: #3b82f6; 
          margin-bottom: 10px;
        }
        .title { 
          font-size: 28px; 
          font-weight: 600; 
          color: #1f2937; 
          margin-bottom: 10px;
        }
        .subtitle { 
          font-size: 16px; 
          color: #6b7280; 
        }
        .content { 
          margin: 30px 0; 
        }
        .profile-info { 
          background: #f3f4f6; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 20px 0; 
        }
        .profile-name { 
          font-size: 20px; 
          font-weight: 600; 
          color: #1f2937; 
          margin-bottom: 10px;
        }
        .role-badge { 
          display: inline-block; 
          background: #3b82f6; 
          color: white; 
          padding: 4px 12px; 
          border-radius: 20px; 
          font-size: 14px; 
          font-weight: 500;
        }
        .share-section { 
          background: #eff6ff; 
          border: 1px solid #dbeafe; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 20px 0; 
        }
        .share-code { 
          font-family: 'Courier New', monospace; 
          background: white; 
          padding: 12px; 
          border-radius: 6px; 
          border: 1px solid #d1d5db; 
          font-size: 16px; 
          font-weight: 600; 
          color: #374151;
          text-align: center;
          margin: 10px 0;
        }
        .cta-button { 
          display: inline-block; 
          background: #3b82f6; 
          color: white; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px; 
          margin: 20px 0;
          text-align: center;
        }
        .cta-button:hover { 
          background: #2563eb; 
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #e5e7eb; 
          color: #6b7280; 
          font-size: 14px;
        }
        .message-box { 
          background: #fef3c7; 
          border: 1px solid #f59e0b; 
          border-radius: 8px; 
          padding: 15px; 
          margin: 20px 0; 
        }
        .message-text { 
          font-style: italic; 
          color: #92400e; 
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">💰 ExpenseTracker</div>
          <div class="title">You're Invited!</div>
          <div class="subtitle">${inviterName} wants you to join their expense tracking profile</div>
        </div>
        
        <div class="content">
          <p>Hi there!</p>
          
          <p><strong>${inviterName}</strong> has invited you to join their expense tracking profile on ExpenseTracker.</p>
          
          <div class="profile-info">
            <div class="profile-name">${profileName}</div>
            <div class="role-badge">${role.charAt(0).toUpperCase() + role.slice(1)}</div>
          </div>
          
          ${message ? `
            <div class="message-box">
              <p class="message-text">"${message}"</p>
            </div>
          ` : ''}
          
          <div class="share-section">
            <h3>Join this profile using:</h3>
            
            <p><strong>Share Code:</strong></p>
            <div class="share-code">${shareCode}</div>
            
            <p><strong>Or click the button below:</strong></p>
            <a href="${shareLink}" class="cta-button">Join Profile Now</a>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${shareLink}" style="color: #3b82f6; word-break: break-all;">${shareLink}</a>
            </p>
          </div>
          
          <p>Once you join, you'll be able to:</p>
          <ul>
            <li>View and track shared expenses</li>
            <li>Add new expenses to the profile</li>
            <li>See spending patterns and budgets</li>
            <li>Collaborate with other members</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>This invitation was sent from ExpenseTracker</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p style="font-size: 12px; color: #9ca3af;">
            Invitation ID: ${invitationId}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
