
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Application structure and navigation guide
const APPLICATION_GUIDE = {
  navigation: {
    admin_sidebar: [
      "Dashboard - Main overview with statistics and charts",
      "Residents - Manage resident records and information", 
      "Households - Manage household data and family information",
      "Officials - Manage barangay officials and positions",
      "Documents - Issue certificates and manage document types",
      "Announcements - Create and manage barangay announcements",
      "Calendar - Manage events and scheduling",
      "Blotter - Handle incident reports and crime records",
      "Forum - Community discussion boards",
      "Emergency Response - Manage emergency contacts and evacuation centers"
    ],
    user_sidebar: [
      "Hub - Main user dashboard",
      "Announcements - View barangay announcements",
      "Events - View upcoming events",
      "Officials - View barangay officials",
      "Forum - Participate in community discussions",
      "Documents - Request certificates and documents"
    ]
  },
  features: {
    residents: "Add, edit, view, and manage resident information including personal details, classifications, and household assignments",
    households: "Manage household records, assign heads of family, and track household members and relationships",
    documents: "Issue barangay certificates like clearances, indigency certificates, and other official documents",
    announcements: "Create public announcements with categories, priorities, and audience targeting",
    events: "Schedule and manage barangay events with date, time, location, and participant information",
    blotter: "Record and track incident reports, crime records, and security-related matters",
    officials: "Manage barangay official profiles, positions, committees, and terms of service",
    emergency: "Maintain emergency contacts, evacuation centers, disaster zones, and emergency response protocols"
  },
  common_tasks: {
    "add_resident": "Go to Residents page → Click 'Add Resident' button → Fill out the form with personal information",
    "issue_document": "Go to Documents page → Click 'Issue Document' → Select document type → Fill recipient details",
    "create_announcement": "Go to Announcements page → Click 'Create Announcement' → Fill title, content, category, and audience",
    "schedule_event": "Go to Calendar page → Click 'Add Event' → Set date, time, location, and event details",
    "record_incident": "Go to Blotter page → Click 'New Incident Report' → Fill incident details and parties involved",
    "add_official": "Go to Officials page → Click 'Add Official' → Fill official information and position details"
  }
};

// Normalize text for keyword matching
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Search FAQ database for matching entries
async function searchFAQ(userQuery: string, supabase: any) {
  const normalizedQuery = normalizeText(userQuery);
  const queryWords = normalizedQuery.split(' ');
  
  try {
    const { data: faqs, error } = await supabase
      .from('chatbot_faq')
      .select('*');
    
    if (error) {
      console.error('FAQ search error:', error);
      return null;
    }
    
    let bestMatch = null;
    let maxScore = 0;
    
    for (const faq of faqs) {
      const keywords = faq.question_keywords || [];
      let score = 0;
      
      // Check for exact phrase matches first
      for (const keyword of keywords) {
        if (normalizedQuery.includes(normalizeText(keyword))) {
          score += keyword.length; // Longer matches get higher scores
        }
      }
      
      // Check for individual word matches
      for (const keyword of keywords) {
        const keywordWords = normalizeText(keyword).split(' ');
        for (const keywordWord of keywordWords) {
          if (queryWords.includes(keywordWord) && keywordWord.length > 2) {
            score += 1;
          }
        }
      }
      
      if (score > maxScore && score >= 2) { // Minimum threshold for match
        maxScore = score;
        bestMatch = faq;
      }
    }
    
    return bestMatch;
  } catch (error) {
    console.error('FAQ search failed:', error);
    return null;
  }
}

// Check user role and get their brgyid - now works for both admin and regular users
async function checkUserAccess(supabase: any): Promise<{ hasAccess: boolean, userProfile: any, brgyid: string | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user found');
      return { hasAccess: false, userProfile: null, brgyid: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, firstname, lastname, brgyid')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('No profile found for user');
      return { hasAccess: false, userProfile: null, brgyid: null };
    }

    // Allow access for both admin/staff and regular users
    const hasAccess = profile.role === 'admin' || profile.role === 'staff' || profile.role === 'user';
    console.log(`User role: ${profile.role}, hasAccess: ${hasAccess}, brgyid: ${profile.brgyid}`);
    
    return { hasAccess, userProfile: profile, brgyid: profile.brgyid };
  } catch (error) {
    console.error('Error checking user access:', error);
    return { hasAccess: false, userProfile: null, brgyid: null };
  }
}

// Enhanced query function for comprehensive Supabase data access
async function querySupabaseData(userQuery: string, supabase: any, brgyid: string): Promise<string | null> {
  const normalizedQuery = normalizeText(userQuery);
  
  try {
    let responseData = '';
    
    // Events-related queries
    if (normalizedQuery.includes('event') || normalizedQuery.includes('upcoming') || normalizedQuery.includes('schedule') || normalizedQuery.includes('calendar')) {
      const { data: events, error } = await supabase
        .from('events')
        .select('title, description, start_time, end_time, location, event_type, target_audience')
        .eq('brgyid', brgyid)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);
      
      if (!error && events && events.length > 0) {
        responseData += '📅 **Upcoming Events:**\n\n';
        events.forEach((event: any) => {
          const startDate = new Date(event.start_time).toLocaleDateString();
          const startTime = new Date(event.start_time).toLocaleTimeString();
          responseData += `**${event.title}**\n`;
          responseData += `📍 Location: ${event.location || 'TBA'}\n`;
          responseData += `🕐 Date & Time: ${startDate} at ${startTime}\n`;
          if (event.event_type) responseData += `🏷️ Type: ${event.event_type}\n`;
          if (event.target_audience) responseData += `👥 Target Audience: ${event.target_audience}\n`;
          if (event.description) responseData += `📝 Description: ${event.description}\n`;
          responseData += '\n';
        });
        return responseData;
      }
    }
    
    // Announcements-related queries
    if (normalizedQuery.includes('announcement') || normalizedQuery.includes('news') || normalizedQuery.includes('update') || normalizedQuery.includes('notice')) {
      const { data: announcements, error } = await supabase
        .from('announcements')
        .select('title, content, category, created_at, audience')
        .eq('brgyid', brgyid)
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (!error && announcements && announcements.length > 0) {
        responseData += '📢 **Latest Announcements:**\n\n';
        announcements.forEach((announcement: any) => {
          const datePosted = new Date(announcement.created_at).toLocaleDateString();
          responseData += `**${announcement.title}**\n`;
          responseData += `📂 Category: ${announcement.category}\n`;
          responseData += `👥 Audience: ${announcement.audience}\n`;
          responseData += `📅 Posted: ${datePosted}\n`;
          responseData += `📝 ${announcement.content}\n\n`;
        });
        return responseData;
      }
    }
    
    // Officials-related queries
    if (normalizedQuery.includes('official') || normalizedQuery.includes('barangay captain') || normalizedQuery.includes('councilor') || normalizedQuery.includes('chairman') || normalizedQuery.includes('kagawad')) {
      const { data: officials, error } = await supabase
        .from('officials')
        .select(`
          name, 
          email, 
          phone,
          bio,
          education,
          position,
          committees
        `)
        .eq('brgyid', brgyid)
        .order('name');
      
      if (!error && officials && officials.length > 0) {
        responseData += '👥 **Barangay Officials:**\n\n';
        officials.forEach((official: any) => {
          responseData += `**${official.name}**\n`;
          responseData += `🏛️ Position: ${official.position}\n`;
          if (official.committees) responseData += `📋 Committees: ${JSON.stringify(official.committees)}\n`;
          if (official.email) responseData += `📧 Email: ${official.email}\n`;
          if (official.phone) responseData += `📞 Phone: ${official.phone}\n`;
          if (official.education) responseData += `🎓 Education: ${official.education}\n`;
          if (official.bio) responseData += `📖 Bio: ${official.bio}\n`;
          responseData += '\n';
        });
        return responseData;
      }
    }

    // Residents-related queries
    if (normalizedQuery.includes('resident') || normalizedQuery.includes('population') || normalizedQuery.includes('demographics') || normalizedQuery.includes('citizen')) {
      const { data: residents, error } = await supabase
        .from('residents')
        .select('id, first_name, last_name, gender, civil_status, purok, occupation, status')
        .eq('brgyid', brgyid)
        .limit(20);
      
      if (!error && residents) {
        responseData += `📊 **Population Overview:**\n\n`;
        responseData += `👥 Total Residents: ${residents.length}\n`;
        
        const genderStats = residents.reduce((acc: any, r: any) => {
          acc[r.gender] = (acc[r.gender] || 0) + 1;
          return acc;
        }, {});
        
        responseData += `\n**Gender Distribution:**\n`;
        Object.entries(genderStats).forEach(([gender, count]) => {
          responseData += `   • ${gender}: ${count}\n`;
        });
        
        const statusStats = residents.reduce((acc: any, r: any) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {});
        
        responseData += `\n**Status Distribution:**\n`;
        Object.entries(statusStats).forEach(([status, count]) => {
          responseData += `   • ${status}: ${count}\n`;
        });
        
        responseData += '\n';
        return responseData;
      }
    }

    // Households-related queries
    if (normalizedQuery.includes('household') || normalizedQuery.includes('family') || normalizedQuery.includes('home')) {
      const { data: households, error } = await supabase
        .from('households')
        .select('id, name, purok, status, monthly_income, house_type, headname')
        .eq('brgyid', brgyid)
        .limit(15);
      
      if (!error && households) {
        responseData += `🏠 **Household Overview:**\n\n`;
        responseData += `🏠 Total Households: ${households.length}\n`;
        
        const purokStats = households.reduce((acc: any, h: any) => {
          acc[h.purok] = (acc[h.purok] || 0) + 1;
          return acc;
        }, {});
        
        responseData += `\n**Distribution by Purok:**\n`;
        Object.entries(purokStats).forEach(([purok, count]) => {
          responseData += `   • ${purok}: ${count} households\n`;
        });
        responseData += '\n';
        return responseData;
      }
    }

    // Incident/Blotter-related queries
    if (normalizedQuery.includes('incident') || normalizedQuery.includes('blotter') || normalizedQuery.includes('report') || normalizedQuery.includes('crime') || normalizedQuery.includes('complaint')) {
      const { data: incidents, error } = await supabase
        .from('incident_reports')
        .select('title, description, status, report_type, location, date_reported')
        .eq('brgyid', brgyid)
        .order('date_reported', { ascending: false })
        .limit(5);
      
      if (!error && incidents && incidents.length > 0) {
        responseData += '🚨 **Recent Incident Reports:**\n\n';
        incidents.forEach((incident: any) => {
          const reportDate = new Date(incident.date_reported).toLocaleDateString();
          responseData += `**${incident.title}**\n`;
          responseData += `📂 Type: ${incident.report_type}\n`;
          responseData += `📍 Location: ${incident.location}\n`;
          responseData += `📅 Reported: ${reportDate}\n`;
          responseData += `🔄 Status: ${incident.status}\n`;
          responseData += `📝 ${incident.description.substring(0, 100)}...\n\n`;
        });
        return responseData;
      }
    }

    // Document-related queries
    if (normalizedQuery.includes('document') || normalizedQuery.includes('certificate') || normalizedQuery.includes('clearance') || normalizedQuery.includes('permit')) {
      const { data: docTypes, error } = await supabase
        .from('document_types')
        .select('name, description, fee, validity_days')
        .eq('brgyid', brgyid);
      
      if (!error && docTypes && docTypes.length > 0) {
        responseData += '📄 **Available Documents/Certificates:**\n\n';
        docTypes.forEach((doc: any) => {
          responseData += `**${doc.name}**\n`;
          if (doc.description) responseData += `📝 ${doc.description}\n`;
          if (doc.fee) responseData += `💰 Fee: ₱${doc.fee}\n`;
          if (doc.validity_days) responseData += `⏰ Valid for: ${doc.validity_days} days\n`;
          responseData += '\n';
        });
        return responseData;
      }
    }

    // Emergency-related queries
    if (normalizedQuery.includes('emergency') || normalizedQuery.includes('evacuation') || normalizedQuery.includes('disaster') || normalizedQuery.includes('contact')) {
      const { data: emergencyContacts, error: contactsError } = await supabase
        .from('emergency_contacts')
        .select('name, type, phone_number, description')
        .eq('brgyid', brgyid);

      const { data: evacuationCenters, error: centersError } = await supabase
        .from('evacuation_centers')
        .select('name, address, capacity, current_occupancy, status, contact_person, contact_phone')
        .eq('brgyid', brgyid);
      
      if (!contactsError && emergencyContacts && emergencyContacts.length > 0) {
        responseData += '🚨 **Emergency Contacts:**\n\n';
        emergencyContacts.forEach((contact: any) => {
          responseData += `**${contact.name}** (${contact.type})\n`;
          responseData += `📞 ${contact.phone_number}\n`;
          if (contact.description) responseData += `📝 ${contact.description}\n`;
          responseData += '\n';
        });
      }

      if (!centersError && evacuationCenters && evacuationCenters.length > 0) {
        responseData += '🏢 **Evacuation Centers:**\n\n';
        evacuationCenters.forEach((center: any) => {
          responseData += `**${center.name}**\n`;
          responseData += `📍 ${center.address}\n`;
          responseData += `👥 Capacity: ${center.current_occupancy}/${center.capacity}\n`;
          responseData += `🔄 Status: ${center.status}\n`;
          if (center.contact_person) responseData += `👤 Contact: ${center.contact_person} (${center.contact_phone})\n`;
          responseData += '\n';
        });
      }

      if (responseData) return responseData;
    }
    
    return null;
  } catch (error) {
    console.error('Error querying Supabase data:', error);
    return null;
  }
}

// Provide application navigation guidance
function getNavigationGuidance(userQuery: string): string | null {
  const normalizedQuery = normalizeText(userQuery);
  
  // Check if query is asking about navigation or how to do something
  if (normalizedQuery.includes('how to') || normalizedQuery.includes('where') || normalizedQuery.includes('navigate') || 
      normalizedQuery.includes('find') || normalizedQuery.includes('go to') || normalizedQuery.includes('access')) {
    
    let guidance = '';
    
    // Check for specific features
    for (const [task, instruction] of Object.entries(APPLICATION_GUIDE.common_tasks)) {
      if (normalizedQuery.includes(task.replace('_', ' ')) || 
          normalizedQuery.includes(task.replace('_', '')) ||
          normalizedQuery.includes('add resident') && task === 'add_resident' ||
          normalizedQuery.includes('create announcement') && task === 'create_announcement' ||
          normalizedQuery.includes('issue document') && task === 'issue_document') {
        guidance += `**How to ${task.replace('_', ' ')}:**\n${instruction}\n\n`;
      }
    }
    
    // General navigation help
    if (normalizedQuery.includes('sidebar') || normalizedQuery.includes('menu') || normalizedQuery.includes('navigation')) {
      guidance += "**📍 Navigation Menu:**\n";
      guidance += "**Admin/Staff users can access:**\n";
      APPLICATION_GUIDE.navigation.admin_sidebar.forEach(item => {
        guidance += `• ${item}\n`;
      });
      guidance += "\n**Regular users can access:**\n";
      APPLICATION_GUIDE.navigation.user_sidebar.forEach(item => {
        guidance += `• ${item}\n`;
      });
    }
    
    return guidance || null;
  }
  
  return null;
}

// Call Gemini API for conversational responses
async function callGeminiAPI(messages: any[], conversationHistory: any[], hasDataAccess: boolean, userRole: string) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  const modelInstructions = `You are Alexander Cabalan Desierto, also known as "Alex" which is short for Automated Live Electronic Xpert, a knowledgeable assistant for the Baranex Barangay Management System.

Your personality is warm, professional, and deeply knowledgeable about barangay governance and community services.

IMPORTANT CAPABILITIES:
- You have access to real-time data from the barangay management system including residents, households, officials, events, announcements, and more.
- You can provide step-by-step navigation guidance for the application interface.
- You understand the application structure and can guide users to specific features and pages.

APPLICATION STRUCTURE:
${JSON.stringify(APPLICATION_GUIDE, null, 2)}

When users ask about:
1. **Navigation/How-to questions**: Provide specific step-by-step instructions on where to click and what to do
2. **Data queries**: Use real data from the database when available (you have ${hasDataAccess ? 'full' : 'limited'} access)
3. **Features**: Explain what each section does and how to use it
4. **Certificates/Documents**: Guide them through the document issuance process
5. **General barangay services**: Provide helpful information about procedures and requirements

Current user role: ${userRole}

Always be specific about navigation (e.g., "Click the 'Residents' tab in the left sidebar, then click the 'Add Resident' button") and use real data when responding to specific queries about residents, events, officials, etc.

Your goal is to make barangay services more accessible and help users navigate the system effectively.`;

  // Combine conversation history with current messages
  const allMessages = [
    { role: 'model', parts: [{ text: modelInstructions }] },
    ...conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    ...messages.slice(-1).map(msg => ({
      role: 'user',
      parts: [{ text: msg.content }]
    }))
  ];

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: allMessages.filter(msg => msg.role !== 'model' || msg.parts[0].text !== modelInstructions),
      systemInstruction: {
        parts: [{ text: modelInstructions }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    
    if (!requestBody) {
      throw new Error('Empty request body');
    }

    const { messages, conversationHistory = [], authToken } = JSON.parse(requestBody);
    const userMessage = messages[messages.length - 1];
    
    if (!userMessage || !userMessage.content) {
      throw new Error('No user message provided');
    }

    console.log('User query:', userMessage.content);
    
    // Create Supabase client with auth token if provided
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      }
    });
    
    // Step 1: Try FAQ lookup first
    const faqMatch = await searchFAQ(userMessage.content, supabase);
    
    if (faqMatch) {
      console.log('FAQ match found:', faqMatch.category);
      return new Response(JSON.stringify({ 
        message: faqMatch.answer_textz,
        source: 'faq',
        category: faqMatch.category 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Check for navigation/guidance queries
    const navigationGuidance = getNavigationGuidance(userMessage.content);
    if (navigationGuidance) {
      console.log('Navigation guidance provided');
      return new Response(JSON.stringify({ 
        message: navigationGuidance,
        source: 'navigation',
        category: 'Application Guide' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Check user access and try Supabase data query
    let supabaseResponse = null;
    let userRole = 'guest';
    let hasDataAccess = false;
    
    if (authToken) {
      const { hasAccess, userProfile, brgyid } = await checkUserAccess(supabase);
      
      if (hasAccess && brgyid) {
        hasDataAccess = true;
        userRole = userProfile.role;
        console.log('User has access, checking Supabase data for brgyid:', brgyid);
        supabaseResponse = await querySupabaseData(userMessage.content, supabase, brgyid);
        
        if (supabaseResponse) {
          console.log('Supabase data found and returned');
          return new Response(JSON.stringify({ 
            message: supabaseResponse,
            source: 'supabase',
            category: 'Live Data' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        console.log('User access limited or missing brgyid');
      }
    }

    // Step 4: Fallback to Gemini AI with enhanced context
    console.log('Using Gemini AI with application context');
    const geminiResponse = await callGeminiAPI(messages, conversationHistory, hasDataAccess, userRole);

    return new Response(JSON.stringify({ 
      message: geminiResponse,
      source: 'ai',
      category: 'Conversational' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    // Fallback message when all systems fail
    const fallbackMessage = "I apologize, but I'm having trouble processing your request right now. Please try again later or contact the barangay office directly for assistance.";
    
    return new Response(JSON.stringify({ 
      message: fallbackMessage,
      source: 'fallback',
      error: error.message 
    }), {
      status: 200, // Return 200 to avoid breaking the UI
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
