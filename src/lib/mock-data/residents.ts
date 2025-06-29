
import { Resident } from '../types';

// Mock Residents Data
export const residents: Resident[] = [
  {
    id: '1',
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    gender: 'Male',
    birthdate: '1985-06-15',
    address: '123 Rizal Street, Barangay San Jose',
    mobile_number: '09123456789',
    email: 'juan.delacruz@example.com',
    occupation: 'Teacher',
    educationLevel: 'College Graduate',
    familySize: 4,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    birthDate: '1985-06-15',
    contactNumber: '09123456789',
    emergencyContact: {
      name: 'Maria Dela Cruz',
      relationship: 'Wife',
      contactNumber: '09187654321'
    }
  },
  {
    id: '2',
    first_name: 'Maria',
    last_name: 'Santos',
    gender: 'Female',
    birthdate: '1990-03-22',
    address: '456 Bonifacio Avenue, Barangay San Jose',
    mobile_number: '09234567890',
    email: 'maria.santos@example.com',
    occupation: 'Nurse',
    educationLevel: 'College Graduate',
    familySize: 2,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Maria',
    lastName: 'Santos',
    birthDate: '1990-03-22',
    contactNumber: '09234567890',
    emergencyContact: {
      name: 'Pedro Santos',
      relationship: 'Father',
      contactNumber: '09298765432'
    }
  },
  {
    id: '3',
    first_name: 'Pedro',
    last_name: 'Reyes',
    gender: 'Male',
    birthdate: '1975-11-30',
    address: '789 Mabini Street, Barangay San Jose',
    mobile_number: '09345678901',
    occupation: 'Carpenter',
    educationLevel: 'High School Graduate',
    familySize: 5,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Pedro',
    lastName: 'Reyes',
    birthDate: '1975-11-30',
    contactNumber: '09345678901',
    emergencyContact: {
      name: 'Ana Reyes',
      relationship: 'Wife',
      contactNumber: '09376543210'
    }
  },
  {
    id: '4',
    first_name: 'Rosa',
    last_name: 'Diaz',
    gender: 'Female',
    birthdate: '1988-07-12',
    address: '101 Aguinaldo Street, Barangay San Jose',
    mobile_number: '09456789012',
    email: 'rosa.diaz@example.com',
    occupation: 'Accountant',
    educationLevel: 'College Graduate',
    familySize: 3,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Rosa',
    lastName: 'Diaz',
    birthDate: '1988-07-12',
    contactNumber: '09456789012',
    emergencyContact: {
      name: 'Carlos Diaz',
      relationship: 'Husband',
      contactNumber: '09465432109'
    }
  },
  {
    id: '5',
    first_name: 'Antonio',
    last_name: 'Gonzales',
    gender: 'Male',
    birthdate: '1965-04-28',
    address: '202 Luna Street, Barangay San Jose',
    mobile_number: '09567890123',
    occupation: 'Farmer',
    educationLevel: 'Elementary Graduate',
    familySize: 6,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Antonio',
    lastName: 'Gonzales',
    birthDate: '1965-04-28',
    contactNumber: '09567890123',
    emergencyContact: {
      name: 'Elena Gonzales',
      relationship: 'Wife',
      contactNumber: '09554321098'
    }
  }
];
