
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from "zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

// Form schema fragment for government IDs
export const governmentIDsSchema = z.object({
  isVoter: z.boolean().default(false),
  hasPhilhealth: z.boolean().default(false),
  hasSss: z.boolean().default(false),
  hasPagibig: z.boolean().default(false),
  hasTin: z.boolean().default(false),
});

export type GovernmentIDsFormValues = z.infer<typeof governmentIDsSchema>;

interface GovernmentIDsFormProps {
  form: UseFormReturn<any>;
}

const GovernmentIDsForm: React.FC<GovernmentIDsFormProps> = ({ form }) => {
  return (
    <>
      <h3 className="text-md font-medium mb-2 pt-2">Government IDs</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name="isVoter"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Voter</FormLabel>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hasPhilhealth"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>PhilHealth</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasSss"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>SSS</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasPagibig"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Pag-IBIG</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasTin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>TIN</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default GovernmentIDsForm;
