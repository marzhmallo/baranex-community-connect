
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

// Form schema fragment for other information
export const otherInfoSchema = z.object({
  occupation: z.string().optional(),
  monthlyIncome: z.number().nonnegative().optional(),
  yearsInBarangay: z.number().int().nonnegative().optional(),
});

export type OtherInfoFormValues = z.infer<typeof otherInfoSchema>;

interface OtherInfoFormProps {
  form: UseFormReturn<any>;
}

const OtherInfoForm: React.FC<OtherInfoFormProps> = ({ form }) => {
  return (
    <>
      <h3 className="text-lg font-medium mb-4 pt-4 border-t">Other Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="occupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Occupation</FormLabel>
              <FormControl>
                <Input placeholder="Teacher" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthlyIncome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Income</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="20000" 
                  onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  value={field.value === undefined ? '' : field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="yearsInBarangay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years in Barangay</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="5" 
                  onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  value={field.value === undefined ? '' : field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default OtherInfoForm;
