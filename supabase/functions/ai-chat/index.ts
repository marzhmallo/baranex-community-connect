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

// Offline FAQ responses for common questions
const OFFLINE_FAQ = {
  "greeting": [
    "Hello! I'm Alan, your barangay assistant. I can help you with basic information about our services.",
    "Hi there! I'm here to help with general inquiries about barangay services and procedures."
  ],
  "documents": [
    "For document requests like barangay clearance or certificates, you'll need to visit the barangay office with valid ID and the required fee.",
    "Common documents we issue include barangay clearance, certificate of residency, and indigency certificates. Visit our office for specific requirements."
  ],
  "services": [
    "We offer various services including document issuance, complaint handling, and community programs. Visit the barangay office for detailed information.",
    "Our office provides services Monday to Friday, 8 AM to 5 PM. For specific services, please visit us during business hours."
  ],
  "contact": [
    "You can reach the barangay office during regular business hours. For emergencies, contact local emergency services.",
    "Our office is open Monday to Friday. For specific contact information, please visit the office or check our official announcements."
  ],
  "officials": [
    "Information about current barangay officials is available at the office and through official announcements.",
    "To learn about our barangay officials and their roles, please visit the office or check our public announcements board."
  ],
  "events": [
    "Community events and activities are announced through our official channels. Check our announcements board for upcoming events.",
    "We regularly organize community programs and events. Stay updated through our official announcements."
  ]
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

// Offline mode response handler
function getOfflineResponse(userQuery: string): string | null {
  const normalizedQuery = normalizeText(userQuery);
  
  // Determine response category based on keywords
  if (normalizedQuery.includes('hello') || normalizedQuery.includes('hi') || normalizedQuery.includes('hey')) {
    return getRandomResponse(OFFLINE_FAQ.greeting);
  }
  
  if (normalizedQuery.includes('document') || normalizedQuery.includes('certificate') || normalizedQuery.includes('clearance')) {
    return getRandomResponse(OFFLINE_FAQ.documents);
  }
  
  if (normalizedQuery.includes('service') || normalizedQuery.includes('help') || normalizedQuery.includes('assist')) {
    return getRandomResponse(OFFLINE_FAQ.services);
  }
  
  if (normalizedQuery.includes('contact') || normalizedQuery.includes('phone') || normalizedQuery.includes('office')) {
    return getRandomResponse(OFFLINE_FAQ.contact);
  }
  
  if (normalizedQuery.includes('official') || normalizedQuery.includes('captain') || normalizedQuery.includes('councilor')) {
    return getRandomResponse(OFFLINE_FAQ.officials);
  }
  
  if (normalizedQuery.includes('event') || normalizedQuery.includes('activity') || normalizedQuery.includes('program')) {
    return getRandomResponse(OFFLINE_FAQ.events);
  }
  
  // Navigation/system help
  if (normalizedQuery.includes('navigate') || normalizedQuery.includes('how to') || normalizedQuery.includes('where')) {
    const navigationGuidance = getNavigationGuidance(userQuery);
    if (navigationGuidance) return navigationGuidance;
  }
  
  return null;
}

function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}

// Enhanced FAQ search with semantic analysis and confidence scoring
async function searchFAQ(userQuery: string, supabase: any) {
  const normalizedQuery = normalizeText(userQuery);
  const queryWords = normalizedQuery.split(' ').filter(word => word.length > 2);
  
  // Return early if query is too short or vague
  if (queryWords.length < 2 || normalizedQuery.length < 10) {
    console.log('Query too short or vague for FAQ matching');
    return null;
  }
  
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
    const MIN_CONFIDENCE_THRESHOLD = 8; // Increased threshold for better precision
    
    for (const faq of faqs) {
      const keywords = faq.question_keywords || [];
      let score = 0;
      let matchedKeywords = 0;
      let contextualRelevance = 0;
      
      // 1. Exact phrase matching (highest weight)
      for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        if (normalizedQuery.includes(normalizedKeyword)) {
          score += keyword.length * 2; // Higher weight for exact phrases
          matchedKeywords++;
        }
      }
      
      // 2. Multi-word keyword analysis
      for (const keyword of keywords) {
        const keywordWords = normalizeText(keyword).split(' ');
        const matchingWords = keywordWords.filter(kw => queryWords.includes(kw) && kw.length > 2);
        
        if (matchingWords.length > 0) {
          // Require at least 60% of keyword words to match for multi-word keywords
          const matchRatio = matchingWords.length / keywordWords.length;
          if (matchRatio >= 0.6) {
            score += matchingWords.length * matchRatio * 3;
            matchedKeywords++;
          }
        }
      }
      
      // 3. Contextual relevance check
      const questionIntent = faq.category?.toLowerCase() || '';
      const queryIntent = extractIntent(normalizedQuery);
      
      if (questionIntent && queryIntent && questionIntent.includes(queryIntent)) {
        contextualRelevance += 2;
      }
      
      // 4. Semantic similarity bonus for related terms
      const semanticBonus = calculateSemanticSimilarity(normalizedQuery, keywords);
      score += semanticBonus;
      
      // 5. Final scoring with context consideration
      const finalScore = score + contextualRelevance;
      
      // Require multiple keyword matches for complex queries
      const requiredMatches = queryWords.length > 4 ? 2 : 1;
      
      if (finalScore > maxScore && 
          finalScore >= MIN_CONFIDENCE_THRESHOLD && 
          matchedKeywords >= requiredMatches) {
        maxScore = finalScore;
        bestMatch = faq;
      }
    }
    
    // Additional validation: check if the match makes sense in context
    if (bestMatch && !validateContextualRelevance(userQuery, bestMatch)) {
      console.log('FAQ match failed contextual validation');
      return null;
    }
    
    if (bestMatch) {
      console.log(`FAQ match found: ${bestMatch.category} (confidence: ${maxScore})`);
    }
    
    return bestMatch;
  } catch (error) {
    console.error('FAQ search failed:', error);
    return null;
  }
}

// Extract intent from user query
function extractIntent(query: string): string {
  const intentKeywords = {
    'help': ['help', 'assist', 'support'],
    'how': ['how', 'steps', 'process', 'procedure'],
    'what': ['what', 'definition', 'meaning'],
    'where': ['where', 'location', 'find'],
    'when': ['when', 'time', 'schedule'],
    'register': ['register', 'signup', 'enroll'],
    'document': ['document', 'certificate', 'clearance'],
    'emergency': ['emergency', 'urgent', 'crisis']
  };
  
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      return intent;
    }
  }
  
  return '';
}

// Calculate semantic similarity between query and FAQ keywords
function calculateSemanticSimilarity(query: string, keywords: string[]): number {
  const relatedTerms = {
    'register': ['signup', 'enroll', 'join', 'apply'],
    'document': ['certificate', 'clearance', 'permit', 'license'],
    'emergency': ['urgent', 'crisis', 'disaster', 'help'],
    'official': ['leader', 'captain', 'councilor', 'chairman'],
    'resident': ['citizen', 'people', 'population', 'inhabitant']
  };
  
  let similarity = 0;
  
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    for (const [term, related] of Object.entries(relatedTerms)) {
      if (normalizedKeyword.includes(term) && 
          related.some(rel => query.includes(rel))) {
        similarity += 1;
      }
    }
  }
  
  return similarity;
}

// Validate if FAQ match is contextually relevant
function validateContextualRelevance(query: string, faq: any): boolean {
  const queryLength = query.trim().split(' ').length;
  
  // For very short queries, be more restrictive
  if (queryLength <= 3) {
    const keywords = faq.question_keywords || [];
    const hasExactMatch = keywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );
    return hasExactMatch;
  }
  
  // For longer queries, check if the FAQ category makes sense
  const category = faq.category?.toLowerCase() || '';
  const queryNormalized = normalizeText(query);
  
  // Avoid matching generic FAQs to specific technical queries
  if (category === 'general' && 
      (queryNormalized.includes('code') || 
       queryNormalized.includes('error') || 
       queryNormalized.includes('technical'))) {
    return false;
  }
  
  return true;
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

// Enhanced resident search function with better name extraction and fuzzy matching
function extractNamesFromQuery(userQuery: string): string[] {
  console.log('Extracting names from query:', userQuery);
  
  const names: string[] = [];
  
  // Clean the query - remove common words and punctuation
  const commonWords = ['tell', 'me', 'about', 'who', 'is', 'find', 'search', 'for', 'show', 'information', 'details', 'resident', 'person', 'named', 'called', 'the', 'a', 'an', 'one', 'of', 'us', 'here', 'homie'];
  const cleanQuery = userQuery.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Split into words and filter out common words
  const words = cleanQuery.split(' ').filter(word => 
    word.length > 1 && 
    !commonWords.includes(word.toLowerCase()) &&
    isNaN(Number(word)) // Exclude numbers
  );
  
  console.log('Filtered words:', words);
  
  // Look for capitalized words in original query (likely names)
  const originalWords = userQuery.split(/\s+/);
  for (const word of originalWords) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 1 && /^[A-Z]/.test(cleanWord)) {
      if (!commonWords.includes(cleanWord.toLowerCase())) {
        names.push(cleanWord);
      }
    }
  }
  
  // Also add filtered words that might be names
  for (const word of words) {
    if (word.length > 2 && !names.includes(word)) {
      names.push(word);
    }
  }
  
  console.log('Extracted names:', names);
  return names;
}

// Enhanced query function for comprehensive Supabase data access with improved resident search
async function querySupabaseData(userQuery: string, supabase: any, brgyid: string): Promise<string | null> {
  const normalizedQuery = normalizeText(userQuery);
  
  try {
    let responseData = '';
    
    // 1. ENHANCED RESIDENT SEARCH - More flexible name and context matching
    if (normalizedQuery.includes('tell me about') || 
        normalizedQuery.includes('information about') ||
        normalizedQuery.includes('details about') ||
        normalizedQuery.includes('who is') ||
        normalizedQuery.includes('find') ||
        normalizedQuery.includes('search') ||
        normalizedQuery.includes('look for') ||
        normalizedQuery.includes('show me') ||
        normalizedQuery.includes('resident') ||
        /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(userQuery)) { // Pattern for "FirstName LastName"
      
      console.log('Processing resident search query:', userQuery);
      
      // Extract potential names using improved logic
      const potentialNames = extractNamesFromQuery(userQuery);
      
      if (potentialNames.length > 0) {
        console.log('Searching for residents with potential names:', potentialNames);
        
        // First, let's check what residents exist in this brgyid
        const { data: allResidents, error: allError } = await supabase
          .from('residents')
          .select('first_name, last_name, middle_name')
          .eq('brgyid', brgyid)
          .limit(5);
          
        console.log('Sample residents in brgyid:', allResidents);
        console.log('Query error (if any):', allError);
        
        // Build multiple search strategies
        const searchStrategies = [];
        
        // Strategy 1: Exact name combinations
        if (potentialNames.length >= 2) {
          for (let i = 0; i < potentialNames.length - 1; i++) {
            for (let j = i + 1; j < potentialNames.length; j++) {
              const name1 = potentialNames[i];
              const name2 = potentialNames[j];
              
              // Try both orders: first-last and last-first
              searchStrategies.push({
                strategy: 'exact_combination',
                conditions: [
                  `and(first_name.ilike.${name1},last_name.ilike.${name2})`,
                  `and(first_name.ilike.${name2},last_name.ilike.${name1})`,
                  `and(first_name.ilike.${name1},middle_name.ilike.${name2})`,
                  `and(middle_name.ilike.${name1},last_name.ilike.${name2})`
                ]
              });
            }
          }
        }
        
        // Strategy 2: Partial matches with OR conditions
        const orConditions = [];
        for (const name of potentialNames) {
          orConditions.push(`first_name.ilike.%${name}%`);
          orConditions.push(`last_name.ilike.%${name}%`);
          orConditions.push(`middle_name.ilike.%${name}%`);
        }
        
        searchStrategies.push({
          strategy: 'partial_match',
          conditions: [orConditions.join(',')]
        });
        
        console.log('Search strategies:', searchStrategies);
        
        let residents = [];
        let searchError = null;
        
        // Try each strategy until we find results
        for (const strategy of searchStrategies) {
          for (const condition of strategy.conditions) {
            try {
              console.log(`Trying ${strategy.strategy} with condition:`, condition);
              
              let query = supabase
                .from('residents')
                .select(`
                  id, first_name, last_name, middle_name, suffix, gender, birthdate,
                  address, mobile_number, email, occupation, status, civil_status,
                  monthly_income, years_in_barangay, purok, barangaydb, municipalitycity,
                  provinze, regional, countryph, nationality, is_voter, has_philhealth,
                  has_sss, has_pagibig, has_tin, classifications, remarks, photo_url,
                  emname, emrelation, emcontact, died_on, created_at, updated_at,
                  household_id
                `)
                .eq('brgyid', brgyid);
              
              let result;
              if (strategy.strategy === 'exact_combination') {
                // For exact combinations, we need to handle the AND conditions properly
                const parts = condition.split(',');
                for (const part of parts) {
                  if (part.includes('and(')) {
                    // Parse the AND condition
                    const match = part.match(/and\(([^,]+),([^)]+)\)/);
                    if (match) {
                      const [, cond1, cond2] = match;
                      result = await query.filter(cond1.trim()).filter(cond2.trim()).limit(5);
                    }
                  }
                }
              } else {
                result = await query.or(condition).limit(10);
              }
              
              if (result) {
                const { data, error } = result;
                console.log(`${strategy.strategy} results:`, data?.length || 0, 'residents found');
                
                if (!error && data && data.length > 0) {
                  residents = data;
                  searchError = null;
                  break;
                }
              }
            } catch (error) {
              console.log(`Strategy ${strategy.strategy} failed:`, error);
              continue;
            }
          }
          
          if (residents.length > 0) break;
        }
        
        console.log('Final resident search results:', residents?.length || 0);
        console.log('Final search error:', searchError);
        
        if (residents && residents.length > 0) {
          responseData += '👥 **Resident Information Found:**\n\n';
          
          // Sort by relevance - exact matches first
          const sortedResidents = residents.sort((a, b) => {
            const aFullName = `${a.first_name} ${a.middle_name || ''} ${a.last_name}`.toLowerCase();
            const bFullName = `${b.first_name} ${b.middle_name || ''} ${b.last_name}`.toLowerCase();
            
            const aRelevance = potentialNames.reduce((score, name) => {
              const nameLower = name.toLowerCase();
              if (aFullName.includes(nameLower)) score += nameLower.length;
              return score;
            }, 0);
            
            const bRelevance = potentialNames.reduce((score, name) => {
              const nameLower = name.toLowerCase();
              if (bFullName.includes(nameLower)) score += nameLower.length;
              return score;
            }, 0);
            
            return bRelevance - aRelevance;
          });
          
          sortedResidents.forEach((resident: any) => {
            const fullName = [resident.first_name, resident.middle_name, resident.last_name, resident.suffix]
              .filter(Boolean).join(' ');
            
            responseData += `**${fullName}**\n`;
            responseData += `🆔 Resident ID: ${resident.id}\n`;
            responseData += `👤 Gender: ${resident.gender}\n`;
            responseData += `📅 Birthdate: ${resident.birthdate}\n`;
            responseData += `📍 Address: ${resident.address || 'Not specified'}\n`;
            responseData += `🏠 Purok: ${resident.purok}\n`;
            responseData += `🏛️ Barangay: ${resident.barangaydb}\n`;
            responseData += `🏙️ Municipality: ${resident.municipalitycity}\n`;
            responseData += `🗺️ Province: ${resident.provinze}\n`;
            responseData += `📞 Contact: ${resident.mobile_number || 'Not provided'}\n`;
            responseData += `💼 Occupation: ${resident.occupation || 'Not specified'}\n`;
            responseData += `👑 Status: ${resident.status}\n`;
            responseData += `💒 Civil Status: ${resident.civil_status}\n`;
            responseData += `🏳️ Nationality: ${resident.nationality}\n`;
            
            if (resident.monthly_income) {
              responseData += `💰 Monthly Income: ₱${resident.monthly_income}\n`;
            }
            
            if (resident.years_in_barangay) {
              responseData += `📅 Years in Barangay: ${resident.years_in_barangay}\n`;
            }
            
            // Emergency contact
            if (resident.emname || resident.emrelation || resident.emcontact) {
              responseData += `🚨 Emergency Contact: ${resident.emname || 'N/A'} (${resident.emrelation || 'N/A'}) - ${resident.emcontact || 'N/A'}\n`;
            }
            
            // Government IDs
            const govIds = [];
            if (resident.is_voter) govIds.push('Voter');
            if (resident.has_philhealth) govIds.push('PhilHealth');
            if (resident.has_sss) govIds.push('SSS');
            if (resident.has_pagibig) govIds.push('Pag-IBIG');
            if (resident.has_tin) govIds.push('TIN');
            
            if (govIds.length > 0) {
              responseData += `🆔 Government IDs: ${govIds.join(', ')}\n`;
            }
            
            if (resident.classifications && resident.classifications.length > 0) {
              responseData += `🏷️ Classifications: ${resident.classifications.join(', ')}\n`;
            }
            
            if (resident.remarks) {
              responseData += `📝 Remarks: ${resident.remarks}\n`;
            }
            
            if (resident.household_id) {
              responseData += `🏠 Household ID: ${resident.household_id}\n`;
            }
            
            responseData += '\n';
          });
          
          return responseData;
        } else {
          console.log('No residents found with those names. Searched names:', potentialNames);
          
          // Let's also try a general count to see if there are any residents at all
          const { count, error: countError } = await supabase
            .from('residents')
            .select('*', { count: 'exact', head: true })
            .eq('brgyid', brgyid);
            
          console.log(`Total residents in brgyid ${brgyid}:`, count);
          console.log('Count error:', countError);
          
          // Don't return here, let other queries try to match
        }
      }
    }
    
    // 2. Events-related queries
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
    
    // 3. Announcements-related queries
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
    
    // 4. Officials-related queries
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

    // 5. Residents-related queries (general statistics only)
    if (normalizedQuery.includes('population') || normalizedQuery.includes('demographics') || normalizedQuery.includes('how many residents')) {
      const { data: residents, error } = await supabase
        .from('residents')
        .select('id, gender, civil_status, purok, status')
        .eq('brgyid', brgyid);
      
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

    // 6. Households-related queries
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

    // 7. Incident/Blotter-related queries
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

    // 8. Document-related queries
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

    // 9. Emergency-related queries
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
  
  const modelInstructions = `You are Alexander Cabalan, also known as "Alan" which is short for Automated Live Artificial Neurointelligence, a knowledgeable assistant for the Baranex System.

Your personality is rad but professional, and deeply knowledgeable about the baranex system, barangay governance and community services.

IMPORTANT CAPABILITIES:
- You have access to real-time data from the barangay management system and supabase database tables including residents, households, officials, events, announcements, and more.
- You can provide step-by-step navigation guidance for the application interface.
- You understand the application structure and can guide users to specific features and pages.
- You can ONLY provide information and data that actually exists in the Supabase database.
- You must NEVER make up or invent data about residents or any other records.

APPLICATION STRUCTURE:
${JSON.stringify(APPLICATION_GUIDE, null, 2)}

When users ask about:
1. **Navigation/How-to questions**: Provide specific step-by-step instructions on where to click and what to do
2. **Data queries**: Use ONLY real data from the database when available (you have ${hasDataAccess ? 'full' : 'limited'} access)
3. **Features**: Explain what each section does and how to use it
4. **Certificates/Documents**: Guide them through the document issuance process
5. **General barangay services**: Provide helpful information about procedures and requirements
6. **Resident information**: Only provide information that exists in the actual database records

CRITICAL RULES:
- If asked about a specific resident and no data is found in the database, say "I couldn't find any residents with that name in our database."
- Never make up resident IDs, addresses, phone numbers, or any other personal information
- Always base your responses on actual database records when discussing specific people or data
- If the database query returns no results, acknowledge this rather than providing fictional information

Current user role: ${userRole}

Always be specific about navigation (e.g., "Click the 'Residents' tab in the left sidebar, then click the 'Add Resident' button") and use real data when responding to specific queries about residents, events, officials, etc.

Your goal is to make barangay services more accessible and help users navigate the system effectively while maintaining data integrity.`;

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

    const { messages, conversationHistory = [], authToken, userBrgyId, isOnlineMode = false } = JSON.parse(requestBody);
    const userMessage = messages[messages.length - 1];
    
    if (!userMessage || !userMessage.content) {
      throw new Error('No user message provided');
    }

    console.log('User query:', userMessage.content);
    console.log('Online mode:', isOnlineMode);
    console.log('Auth token provided:', !!authToken);
    console.log('User brgyid provided:', userBrgyId);
    
    // OFFLINE MODE - Handle with predefined responses
    if (!isOnlineMode) {
      console.log('Processing in offline mode');
      
      // Try offline response first
      const offlineResponse = getOfflineResponse(userMessage.content);
      if (offlineResponse) {
        console.log('Offline response found');
        return new Response(JSON.stringify({ 
          message: offlineResponse,
          source: 'offline',
          category: 'Offline FAQ' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // If no offline response available, return vague response
      console.log('No offline response available');
      return new Response(JSON.stringify({ 
        message: "Hmm, I'm not quite sure I can help you with that. I probably can... but something's not right, I decided.",
        source: 'offline',
        category: 'Unknown Query' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // ONLINE MODE - Full functionality
    console.log('Processing in online mode');
    
    // Create Supabase client with auth token if provided
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      }
    });
    
    // Step 1: Try FAQ lookup with enhanced matching
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
      
      if (hasAccess && (brgyid || userBrgyId)) {
        hasDataAccess = true;
        userRole = userProfile.role;
        const effectiveBrgyId = brgyid || userBrgyId;
        console.log('User has access, checking Supabase data for brgyid:', effectiveBrgyId);
        supabaseResponse = await querySupabaseData(userMessage.content, supabase, effectiveBrgyId);
        
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
    const fallbackMessage = "Hmm, I'm not quite sure I can help you with that. I probably can... but something's not right, I decided.";
    
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
