
import { Resident } from '../types';

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
    status: 'Permanent', // Fixed to use valid status
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
    status: 'Permanent', // Fixed to use valid status
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
    status: 'Permanent', // Fixed to use valid status
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
    status: 'Permanent', // Fixed to use valid status
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
    status: 'Permanent', // Fixed to use valid status
    emergencyContact: {
      name: 'Elena Gonzales',
      relationship: 'Wife',
      contactNumber: '09554321098'
    }
  }
];
