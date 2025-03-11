
// Resident types
export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  birthDate: string;
  address: string;
  contactNumber: string;
  email?: string;
  occupation?: string;
  educationLevel?: string;
  familySize?: number;
  profileImageUrl?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    contactNumber: string;
  };
  dateRegistered: string;
  status: 'Active' | 'Inactive' | 'Deceased' | 'Transferred';
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
