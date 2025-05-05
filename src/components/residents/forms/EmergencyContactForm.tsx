
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from "zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Form schema fragment for emergency contact
export const emergencyContactSchema = z.object({
  emergencyContactName: z.string().min(2, "Name must be at least 2 characters"),
  emergencyContactRelationship: z.string().min(2, "Relationship must be at least 2 characters"),
  emergencyContactNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in the format 09XXXXXXXXX"),
});

export type EmergencyContactFormValues = z.infer<typeof emergencyContactSchema>;

interface EmergencyContactFormProps {
  form: UseFormReturn<any>;
}

const EmergencyContactForm: React.FC<EmergencyContactFormProps> = ({ form }) => {
  return (
    <>
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-4">Emergency Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="emergencyContactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Maria Dela Cruz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContactRelationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship *</FormLabel>
                <FormControl>
                  <Input placeholder="Spouse" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number *</FormLabel>
                <FormControl>
                  <Input placeholder="09123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );
};

export default EmergencyContactForm;
