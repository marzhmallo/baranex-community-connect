
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
import { Textarea } from "@/components/ui/textarea";

// Form schema fragment for address
export const addressSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  purok: z.string().min(1, "Purok is required"),
  barangay: z.string().min(1, "Barangay is required"),
  municipality: z.string().min(1, "Municipality is required"),
  province: z.string().min(1, "Province is required"),
  region: z.string().min(1, "Region is required"),
  country: z.string().min(1, "Country is required"),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  form: UseFormReturn<any>;
}

const AddressForm: React.FC<AddressFormProps> = ({ form }) => {
  return (
    <>
      <h3 className="text-lg font-medium mb-4 pt-4 border-t">Contact Information</h3>
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street Address *</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Complete street address" 
                className="resize-none" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name="purok"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purok *</FormLabel>
              <FormControl>
                <Input placeholder="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="barangay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barangay *</FormLabel>
              <FormControl>
                <Input placeholder="San Jose" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="municipality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Municipality/City *</FormLabel>
              <FormControl>
                <Input placeholder="Manila" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="province"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province *</FormLabel>
              <FormControl>
                <Input placeholder="Metro Manila" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region *</FormLabel>
              <FormControl>
                <Input placeholder="NCR" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country *</FormLabel>
              <FormControl>
                <Input placeholder="Philippines" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default AddressForm;
