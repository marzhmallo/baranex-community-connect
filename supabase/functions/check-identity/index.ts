import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  try {
    const { email, phone } = await req.json()

    if (!email && !phone) {
      return new Response(JSON.stringify({ error: 'Missing email or phone' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)

    // Normalize inputs
    const normEmail = typeof email === 'string' ? email.trim().toLowerCase() : null
    const normPhone = typeof phone === 'string' ? phone.trim() : null

    // 1) Check auth.users via GoTrue Admin endpoint
    let emailExistsAuth = false
    if (normEmail) {
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(normEmail)}`, {
        method: 'GET',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      })
      if (res.ok) {
        const json = await res.json()
        // json.users may be array; handle both shapes
        const usersArray = Array.isArray(json) ? json : (Array.isArray(json.users) ? json.users : [])
        emailExistsAuth = usersArray.length > 0
      } else {
        // If admin endpoint fails, we still continue with profiles checks
        console.error('Admin users lookup failed', await res.text())
      }
    }

    // 2) Check profiles for email and phone
    let emailExistsProfiles = false
    let phoneExistsProfiles = false

    if (normEmail) {
      const { count: emailCount, error: emailErr } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .ilike('email', normEmail)
      if (emailErr) console.error('profiles email check error:', emailErr)
      emailExistsProfiles = (emailCount ?? 0) > 0
    }

    if (normPhone) {
      const { count: phoneCount, error: phoneErr } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('phone', normPhone)
      if (phoneErr) console.error('profiles phone check error:', phoneErr)
      phoneExistsProfiles = (phoneCount ?? 0) > 0
    }

    const emailTaken = !!(emailExistsAuth || emailExistsProfiles)
    const phoneTaken = !!phoneExistsProfiles

    return new Response(
      JSON.stringify({ emailTaken, phoneTaken, emailExistsAuth, emailExistsProfiles, phoneExistsProfiles }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (err) {
    console.error('check-identity error:', err)
    return new Response(JSON.stringify({ error: 'Unexpected error', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
