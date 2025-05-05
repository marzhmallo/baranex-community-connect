
import { z } from 'zod';
import { 
  personalInfoSchema, 
  addressSchema, 
  contactSchema,
  otherInfoSchema,
  governmentIDsSchema,
  emergencyContactSchema,
  remarksSchema
} from './';

// Combine all schema fragments
export const formSchema = z.object({
  ...personalInfoSchema.shape,
  ...addressSchema.shape,
  ...contactSchema.shape,
  ...otherInfoSchema.shape,
  ...governmentIDsSchema.shape,
  ...emergencyContactSchema.shape,
  ...remarksSchema.shape,
});

export type ResidentFormValues = z.infer<typeof formSchema>;

// Default values for the form
export const defaultValues: Partial<ResidentFormValues> = {
  firstName: "",
  lastName: "",
  middleName: "",
  suffix: "",
  gender: "Male",
  birthDate: "",
  address: "",
  purok: "1",
  barangay: "San Jose",
  municipality: "Manila",
  province: "Metro Manila",
  region: "NCR",
  country: "Philippines",
  contactNumber: "",
  email: "",
  occupation: "",
  civilStatus: "Single",
  monthlyIncome: 0,
  yearsInBarangay: 0,
  nationality: "Filipino",
  isVoter: false,
  hasPhilhealth: false,
  hasSss: false,
  hasPagibig: false,
  hasTin: false,
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactNumber: "",
  status: "Active",
  remarks: "",
};
