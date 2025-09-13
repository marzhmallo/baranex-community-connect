import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record: user } = await req.json();

    // Get login details from the request
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'Unknown IP';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Parse device info from user agent
    let deviceInfo = 'Unknown Device';
    if (userAgent.includes('Windows')) {
      if (userAgent.includes('Chrome')) deviceInfo = 'Windows - Chrome';
      else if (userAgent.includes('Firefox')) deviceInfo = 'Windows - Firefox';
      else if (userAgent.includes('Edge')) deviceInfo = 'Windows - Edge';
      else deviceInfo = 'Windows - Other Browser';
    } else if (userAgent.includes('Mac')) {
      if (userAgent.includes('Chrome')) deviceInfo = 'macOS - Chrome';
      else if (userAgent.includes('Safari')) deviceInfo = 'macOS - Safari';
      else if (userAgent.includes('Firefox')) deviceInfo = 'macOS - Firefox';
      else deviceInfo = 'macOS - Other Browser';
    } else if (userAgent.includes('Android')) {
      deviceInfo = 'Android - Mobile';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      deviceInfo = 'iOS - Mobile';
    }

    console.log('Sending login alert email to:', user.email);

    const { data, error } = await resend.emails.send({
      from: 'Baranex Security <noreply@resend.dev>',
      to: user.email,
      subject: 'Baranex Security Alert: New Login Detected',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 0; margin: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Baranex Security Alert</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 24px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Hello <strong style="color: #1f2937;">${user.raw_user_meta_data?.firstname || user.email}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                We noticed a login to your Baranex account from the following device:
              </p>
              
              <!-- Login Details Card -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                
                <div style="margin-bottom: 16px;">
                  <span style="display: inline-block; font-weight: 600; color: #4f46e5; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Device:</span>
                  <p style="margin: 4px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 500;">${deviceInfo}</p>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <span style="display: inline-block; font-weight: 600; color: #4f46e5; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">IP Address:</span>
                  <p style="margin: 4px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 500;">${ipAddress}</p>
                </div>
                
                <div style="margin-bottom: 0;">
                  <span style="display: inline-block; font-weight: 600; color: #4f46e5; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Timestamp:</span>
                  <p style="margin: 4px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 500;">${timestamp} (PST)</p>
                </div>
                
              </div>
              
              <!-- Warning -->
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 500;">
                  ⚠️ If you did not perform this login, please take immediate action by securing your account.
                </p>
              </div>
              
              <!-- Actions -->
              <div style="margin: 32px 0 24px 0;">
                <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">
                  If this wasn't you, here's what you should do:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">
                    <a href="#" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Change your password immediately</a>
                  </li>
                  <li style="margin-bottom: 8px;">
                    <a href="#" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Contact Support</a>
                  </li>
                  <li style="margin-bottom: 0;">
                    <a href="#" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Review your account activity</a>
                  </li>
                </ul>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
                <p style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">
                  Thank you for using Baranex,
                </p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                  The Baranex Security Team
                </p>
              </div>
              
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                This is an automated security notification. Please do not reply to this email.
              </p>
            </div>
            
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    console.log('Login alert email sent successfully:', data);

    return new Response(JSON.stringify({ 
      message: "Login alert email sent successfully",
      emailId: data?.id 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });

  } catch (err: any) {
    console.error('Login alert function error:', err);
    return new Response(JSON.stringify({ 
      error: err?.message ?? 'An unexpected error occurred' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);