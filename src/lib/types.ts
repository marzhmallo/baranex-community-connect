// Resident types
export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  gender: string;
  birthDate: string; // ISO format date string
  address: string;
  contactNumber?: string;
  email?: string;
  status: 'Permanent' | 'Temporary' | 'Deceased' | 'Relocated';
  civilStatus?: string;
  occupation?: string;
  yearsInBarangay?: number;
  classifications?: string[];
  educationLevel?: string;
  familySize?: number;
  created_at?: string; // Added created_at to match the database column name
  nationality?: string;
  monthlyIncome?: number;
  purok?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  region?: string;
  country?: string;
  isVoter?: boolean;
  hasPhilhealth?: boolean;
  hasSss?: boolean;
  hasPagibig?: boolean;
  hasTin?: boolean;
  remarks?: string;
  photoUrl?: string;
  diedOn?: string | null; // Date of death for deceased residents
  died_on?: string | null; // Database field name for date of death
  householdId?: string | null;
  updated_at?: string; // Added updated_at to match the database column name
  brgyId?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    contactNumber: string;
  };
}

// Announcement types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  datePosted: string;
  category: 'Event' | 'News' | 'Alert' | 'Service' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  imageUrl?: string;
  attachmentUrl?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

// Forum types
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  datePosted: string;
  category: 'General' | 'Question' | 'Suggestion' | 'Concern' | 'Other';
  tags: string[];
  likes: number;
  commentCount: number;
  imageUrl?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  datePosted: string;
  likes: number;
}

// Crime report types
export interface CrimeReport {
  id: string;
  reportNumber: string;
  reportTitle: string;
  description: string;
  dateReported: string;
  dateOfIncident: string;
  location: string;
  reportedBy: {
    id: string;
    name: string;
    contactNumber: string;
  };
  status: 'New' | 'Investigating' | 'Resolved' | 'Closed' | 'Transferred';
  severity: 'Minor' | 'Moderate' | 'Serious' | 'Critical';
  assignedTo?: string;
  witnesses?: string[];
  evidenceList?: string[];
  resolutionDetails?: string;
  imageUrls?: string[];
}

// Dashboard statistics
export interface DashboardStats {
  totalResidents: number;
  newResidentsThisMonth: number;
  activeAnnouncements: number;
  openCrimeReports: number;
  upcomingEvents: number;
  maleResidents: number;
  femaleResidents: number;
  averageAge: number;
  ageGroups: {
    label: string;
    value: number;
  }[];
  mostActiveForumCategories: {
    category: string;
    count: number;
  }[];
  crimeReportsByMonth: {
    month: string;
    count: number;
  }[];
}

// Household types
export interface Household {
  id: string;
  name: string;
  address?: string; // Keep for backward compatibility but make optional
  barangayname?: string | null; // New address field
  municipality?: string | null; // New address field
  province?: string | null; // New address field
  region?: string | null; // New address field
  country?: string | null; // New address field
  purok: string;
  head_of_family?: string | null; // UUID reference to resident
  headname?: string | null; // Plain text name
  head_of_family_name?: string | null; // Computed field for display
  contact_number?: string | null;
  year_established?: number | null;
  status: string;
  monthly_income?: string | null;
  property_type?: string | null;
  house_type?: string | null;
  water_source?: string | null;
  electricity_source?: string | null;
  toilet_type?: string | null;
  garbage_disposal?: string | null;
  remarks?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  brgyid?: string | null;
}

// Document types
export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  template: string;
  required_fields: Record<string, string>;
  fee: number;
  validity_days?: number;
  created_at?: string;
  updated_at?: string;
}

export interface IssuedDocument {
  id: string;
  document_type_id: string;
  resident_id?: string;
  household_id?: string;
  document_number: string;
  purpose?: string;
  data: Record<string, any>;
  issued_date: string;
  issued_by?: string;
  expiry_date?: string;
  status: 'issued' | 'pending' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'waived';
  payment_amount?: number;
  payment_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentLog {
  id: string;
  document_id: string;
  action: 'issued' | 'updated' | 'cancelled' | 'reprinted';
  performed_by?: string;
  details?: Record<string, any>;
  created_at: string;
}

// Updated Official interface to match the database structure
export interface Official {
  id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  bio?: string;
  photo_url?: string;
  term_start?: string;
  term_end?: string;
  created_at?: string;
  updated_at?: string;
  brgyid?: string;
  is_sk?: boolean[];
  birthdate?: string;
  address?: string;
  educ?: any;
  achievements?: any;
  committees?: any;
  education?: string;
  rank_number?: number;
  rank_label?: string;
  officialPositions?: OfficialPosition[];
}

// New interface for official positions
export interface OfficialPosition {
  id: string;
  official_id: string;
  position: string;
  committee?: string;
  term_start: string;
  term_end?: string;
  is_current?: boolean;
  created_at?: string;
  updated_at?: string;
  description?: string;
}
