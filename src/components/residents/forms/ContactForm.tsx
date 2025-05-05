
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from "zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Form schema fragment for contact information
export const contactSchema = z.object({
  contactNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in the format 09XXXXXXXXX"),
  email: z.string().email("Invalid email format").optional().or(z.literal('')),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  form: UseFormReturn<any>;
}

const ContactForm: React.FC<ContactFormProps> = ({ form }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="contactNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Number *</FormLabel>
            <FormControl>
              <Input placeholder="09123456789" {...field} />
            </FormControl>
            <FormDescription>
              Format: 09XXXXXXXXX
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address</FormLabel>
            <FormControl>
              <Input placeholder="juan@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ContactForm;
