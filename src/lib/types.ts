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

// Add new Household type to match the Supabase households table
export interface Household {
  id: string;
  name: string;
  address: string;
  purok: string;
  head_of_family: string | null;
  contact_number: string | null;
  year_established: number | null;
  status: string;
  monthly_income: string | null;
  property_type: string | null;
  house_type: string | null;
  water_source: string | null;
  electricity_source: string | null;
  toilet_type: string | null;
  garbage_disposal: string | null;
  remarks: string | null;
  created_at?: string;
  updated_at?: string;
  brgyid?: string;
}
