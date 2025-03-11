
import { Resident, Announcement, ForumPost, CrimeReport, DashboardStats, Comment } from './types';

// Mock Residents Data
export const residents: Resident[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    gender: 'Male',
    birthDate: '1985-06-15',
    address: '123 Rizal Street, Barangay San Jose',
    contactNumber: '09123456789',
    email: 'juan.delacruz@example.com',
    occupation: 'Teacher',
    educationLevel: 'College Graduate',
    familySize: 4,
    dateRegistered: '2023-01-15',
    status: 'Active',
    emergencyContact: {
      name: 'Maria Dela Cruz',
      relationship: 'Wife',
      contactNumber: '09187654321'
    }
  },
  {
    id: '2',
    firstName: 'Maria',
    lastName: 'Santos',
    gender: 'Female',
    birthDate: '1990-03-22',
    address: '456 Bonifacio Avenue, Barangay San Jose',
    contactNumber: '09234567890',
    email: 'maria.santos@example.com',
    occupation: 'Nurse',
    educationLevel: 'College Graduate',
    familySize: 2,
    dateRegistered: '2023-02-10',
    status: 'Active',
    emergencyContact: {
      name: 'Pedro Santos',
      relationship: 'Father',
      contactNumber: '09298765432'
    }
  },
  {
    id: '3',
    firstName: 'Pedro',
    lastName: 'Reyes',
    gender: 'Male',
    birthDate: '1975-11-30',
    address: '789 Mabini Street, Barangay San Jose',
    contactNumber: '09345678901',
    occupation: 'Carpenter',
    educationLevel: 'High School Graduate',
    familySize: 5,
    dateRegistered: '2023-01-20',
    status: 'Active',
    emergencyContact: {
      name: 'Ana Reyes',
      relationship: 'Wife',
      contactNumber: '09376543210'
    }
  },
  {
    id: '4',
    firstName: 'Rosa',
    lastName: 'Diaz',
    gender: 'Female',
    birthDate: '1988-07-12',
    address: '101 Aguinaldo Street, Barangay San Jose',
    contactNumber: '09456789012',
    email: 'rosa.diaz@example.com',
    occupation: 'Accountant',
    educationLevel: 'College Graduate',
    familySize: 3,
    dateRegistered: '2023-03-05',
    status: 'Active',
    emergencyContact: {
      name: 'Carlos Diaz',
      relationship: 'Husband',
      contactNumber: '09465432109'
    }
  },
  {
    id: '5',
    firstName: 'Antonio',
    lastName: 'Gonzales',
    gender: 'Male',
    birthDate: '1965-04-28',
    address: '202 Luna Street, Barangay San Jose',
    contactNumber: '09567890123',
    occupation: 'Farmer',
    educationLevel: 'Elementary Graduate',
    familySize: 6,
    dateRegistered: '2023-02-18',
    status: 'Active',
    emergencyContact: {
      name: 'Elena Gonzales',
      relationship: 'Wife',
      contactNumber: '09554321098'
    }
  }
];

// Mock Announcements Data
export const announcements: Announcement[] = [
  {
    id: '1',
    title: 'COVID-19 Vaccination Schedule',
    content: 'Free COVID-19 vaccination for residents on June 15-16, 2023 at the Barangay Hall from 8AM to 5PM. Bring valid ID and registration form.',
    authorId: 'admin1',
    authorName: 'Barangay Secretary',
    datePosted: '2023-06-10',
    category: 'Service',
    priority: 'High',
    startDate: '2023-06-15',
    endDate: '2023-06-16',
    location: 'Barangay Hall'
  },
  {
    id: '2',
    title: 'Barangay Fiesta Celebration',
    content: 'Annual Barangay Fiesta will be celebrated on July 25-26, 2023. Various activities including sports competitions, cultural shows, and religious ceremonies are planned.',
    authorId: 'admin1',
    authorName: 'Barangay Captain',
    datePosted: '2023-06-25',
    category: 'Event',
    priority: 'Medium',
    startDate: '2023-07-25',
    endDate: '2023-07-26',
    location: 'Barangay Plaza'
  },
  {
    id: '3',
    title: 'Road Construction Notice',
    content: 'Road construction on Rizal Street will begin on July 5, 2023 and continue for approximately 2 weeks. Please use alternative routes during this period.',
    authorId: 'admin2',
    authorName: 'Barangay Engineer',
    datePosted: '2023-07-01',
    category: 'Alert',
    priority: 'Medium',
    startDate: '2023-07-05',
    endDate: '2023-07-19',
    location: 'Rizal Street'
  },
  {
    id: '4',
    title: 'Typhoon Warning',
    content: 'Typhoon expected to hit our area within 48 hours. Residents are advised to secure their homes and prepare emergency supplies. Evacuation centers are being prepared.',
    authorId: 'admin1',
    authorName: 'Barangay Captain',
    datePosted: '2023-07-15',
    category: 'Alert',
    priority: 'Urgent',
    location: 'Entire Barangay'
  },
  {
    id: '5',
    title: 'Free Medical Mission',
    content: 'Free medical check-ups, dental services, and eye examinations will be provided on August 5, 2023 at the Barangay covered court. First-come, first-served basis.',
    authorId: 'admin3',
    authorName: 'Barangay Health Worker',
    datePosted: '2023-07-20',
    category: 'Service',
    priority: 'Medium',
    startDate: '2023-08-05',
    endDate: '2023-08-05',
    location: 'Barangay Covered Court'
  }
];

// Mock Forum Posts Data
export const forumPosts: ForumPost[] = [
  {
    id: '1',
    title: 'Water Supply Interruption',
    content: 'Has anyone else experienced water supply interruption in the western part of our barangay? It's been 2 days now and we're still without water.',
    authorId: '3',
    authorName: 'Pedro Reyes',
    datePosted: '2023-07-05',
    category: 'Concern',
    tags: ['utilities', 'water', 'service'],
    likes: 12,
    commentCount: 8
  },
  {
    id: '2',
    title: 'Stray Dogs Problem',
    content: 'There are too many stray dogs roaming around our area. Some are aggressive and chase children. What can we do about this issue?',
    authorId: '2',
    authorName: 'Maria Santos',
    datePosted: '2023-07-08',
    category: 'Concern',
    tags: ['safety', 'animals', 'community'],
    likes: 15,
    commentCount: 10
  },
  {
    id: '3',
    title: 'Basketball Tournament Proposal',
    content: 'I'd like to propose organizing a basketball tournament for the youth in our barangay during the summer vacation. Who would be interested in participating or helping organize?',
    authorId: '4',
    authorName: 'Rosa Diaz',
    datePosted: '2023-07-10',
    category: 'Suggestion',
    tags: ['sports', 'youth', 'event'],
    likes: 25,
    commentCount: 12
  },
  {
    id: '4',
    title: 'Garbage Collection Schedule',
    content: 'Can someone please clarify the garbage collection schedule? It seems to have changed recently and our trash wasn't collected this week.',
    authorId: '1',
    authorName: 'Juan Dela Cruz',
    datePosted: '2023-07-12',
    category: 'Question',
    tags: ['waste management', 'schedule', 'service'],
    likes: 8,
    commentCount: 6
  },
  {
    id: '5',
    title: 'Senior Citizen Benefits',
    content: 'My father just turned 60. What benefits or programs are available for senior citizens in our barangay?',
    authorId: '5',
    authorName: 'Antonio Gonzales',
    datePosted: '2023-07-15',
    category: 'Question',
    tags: ['senior citizens', 'benefits', 'programs'],
    likes: 10,
    commentCount: 7
  }
];

// Mock Comments Data
export const comments: Comment[] = [
  {
    id: '1',
    postId: '1',
    authorId: '2',
    authorName: 'Maria Santos',
    content: 'We're experiencing the same issue in our area. I called the water utility company and they said they're fixing a main pipe that burst. Should be resolved by tomorrow.',
    datePosted: '2023-07-05',
    likes: 5
  },
  {
    id: '2',
    postId: '1',
    authorId: '4',
    authorName: 'Rosa Diaz',
    content: 'The barangay should provide water trucks during these interruptions. Many families are struggling without water.',
    datePosted: '2023-07-06',
    likes: 8
  },
  {
    id: '3',
    postId: '2',
    authorId: '1',
    authorName: 'Juan Dela Cruz',
    content: 'I agree this is becoming a serious problem. We should report this to the barangay animal control unit.',
    datePosted: '2023-07-08',
    likes: 6
  },
  {
    id: '4',
    postId: '3',
    authorId: '5',
    authorName: 'Antonio Gonzales',
    content: 'This is a great idea! My son would be interested in participating. I can also help with organization and maybe get some sponsors for prizes.',
    datePosted: '2023-07-10',
    likes: 10
  },
  {
    id: '5',
    postId: '4',
    authorId: '3',
    authorName: 'Pedro Reyes',
    content: 'The new schedule is Monday and Thursday mornings for our area. They announced it last month but didn't distribute printed schedules.',
    datePosted: '2023-07-12',
    likes: 4
  }
];

// Mock Crime Reports Data
export const crimeReports: CrimeReport[] = [
  {
    id: '1',
    reportNumber: 'CR-2023-001',
    reportTitle: 'Theft at Sari-Sari Store',
    description: 'At approximately 2:30 PM, a male suspect in his 20s took items from the store without paying and fled on a motorcycle. Items stolen include cigarettes and canned goods.',
    dateReported: '2023-07-01',
    dateOfIncident: '2023-07-01',
    location: 'Rizal Street, corner Bonifacio Avenue',
    reportedBy: {
      id: '5',
      name: 'Antonio Gonzales',
      contactNumber: '09567890123'
    },
    status: 'Investigating',
    severity: 'Moderate',
    assignedTo: 'Officer Santos',
    witnesses: ['Maria Reyes', 'Pablo Castro']
  },
  {
    id: '2',
    reportNumber: 'CR-2023-002',
    reportTitle: 'Vandalism at Plaza',
    description: 'Graffiti found on the walls of the public restrooms at the plaza. Suspected to have occurred overnight. Offensive language and symbols were spray-painted.',
    dateReported: '2023-07-03',
    dateOfIncident: '2023-07-02',
    location: 'Barangay Plaza',
    reportedBy: {
      id: '1',
      name: 'Juan Dela Cruz',
      contactNumber: '09123456789'
    },
    status: 'New',
    severity: 'Minor',
    witnesses: ['Park Security Guard']
  },
  {
    id: '3',
    reportNumber: 'CR-2023-003',
    reportTitle: 'Domestic Disturbance',
    description: 'Neighbors reported loud shouting and sounds of items breaking from the residence. This is the third reported incident from the same address this month.',
    dateReported: '2023-07-05',
    dateOfIncident: '2023-07-05',
    location: 'Luna Street, House #15',
    reportedBy: {
      id: '2',
      name: 'Maria Santos',
      contactNumber: '09234567890'
    },
    status: 'Investigating',
    severity: 'Serious',
    assignedTo: 'Officer Mendoza',
    witnesses: ['Multiple neighbors']
  },
  {
    id: '4',
    reportNumber: 'CR-2023-004',
    reportTitle: 'Motorcycle Theft',
    description: 'Red Honda motorcycle (Plate #: ABC 123) stolen from in front of the owner's residence between 10 PM and 6 AM.',
    dateReported: '2023-07-10',
    dateOfIncident: '2023-07-09',
    location: 'Mabini Street, House #78',
    reportedBy: {
      id: '3',
      name: 'Pedro Reyes',
      contactNumber: '09345678901'
    },
    status: 'Investigating',
    severity: 'Serious',
    assignedTo: 'Officer Reyes'
  },
  {
    id: '5',
    reportNumber: 'CR-2023-005',
    reportTitle: 'Drug Activity Report',
    description: 'Suspicious activities observed at the abandoned building, with multiple people coming and going throughout the night. Possible drug-related activities.',
    dateReported: '2023-07-15',
    dateOfIncident: '2023-07-14',
    location: 'Abandoned building near Aguinaldo Street',
    reportedBy: {
      id: '4',
      name: 'Rosa Diaz',
      contactNumber: '09456789012'
    },
    status: 'Transferred',
    severity: 'Critical',
    assignedTo: 'Transferred to Police',
    resolutionDetails: 'Case transferred to Municipal Police for further investigation due to scope and severity.'
  }
];

// Mock Dashboard Statistics
export const dashboardStats: DashboardStats = {
  totalResidents: 856,
  newResidentsThisMonth: 12,
  activeAnnouncements: 8,
  openCrimeReports: 7,
  upcomingEvents: 3,
  maleResidents: 412,
  femaleResidents: 444,
  averageAge: 34,
  ageGroups: [
    { label: '0-14', value: 186 },
    { label: '15-24', value: 147 },
    { label: '25-44', value: 278 },
    { label: '45-64', value: 165 },
    { label: '65+', value: 80 }
  ],
  mostActiveForumCategories: [
    { category: 'Concern', count: 45 },
    { category: 'Question', count: 32 },
    { category: 'Suggestion', count: 27 },
    { category: 'General', count: 21 },
    { category: 'Other', count: 8 }
  ],
  crimeReportsByMonth: [
    { month: 'Jan', count: 6 },
    { month: 'Feb', count: 8 },
    { month: 'Mar', count: 5 },
    { month: 'Apr', count: 7 },
    { month: 'May', count: 10 },
    { month: 'Jun', count: 8 },
    { month: 'Jul', count: 12 }
  ]
};
