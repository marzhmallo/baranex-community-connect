
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form schema fragment for remarks and status
export const remarksSchema = z.object({
  remarks: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Deceased", "Transferred"]),
});

export type RemarksFormValues = z.infer<typeof remarksSchema>;

interface RemarksFormProps {
  form: UseFormReturn<any>;
}

const RemarksForm: React.FC<RemarksFormProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="remarks"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Remarks</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Additional notes about this resident" 
                className="resize-none" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Resident Status *</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Deceased">Deceased</SelectItem>
                <SelectItem value="Transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default RemarksForm;
