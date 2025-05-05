
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useQueryClient } from '@tanstack/react-query';

// Import the refactored components
import {
  PersonalInfoForm,
  AddressForm,
  ContactForm,
  OtherInfoForm,
  GovernmentIDsForm,
  EmergencyContactForm,
  RemarksForm,
  formSchema,
  defaultValues,
  ResidentFormValues
} from './forms';
import { submitResidentForm } from './forms/submitHandler';

interface ResidentFormProps {
  onSubmit: () => void;
}

const ResidentForm = ({ onSubmit }: ResidentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = async (values: ResidentFormValues) => {
    setIsSubmitting(true);
    
    try {
      await submitResidentForm(values, {
        onSuccess: onSubmit,
        queryClient
      });
    } catch (error) {
      // Error already handled in submitResidentForm
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <PersonalInfoForm form={form} />
        <AddressForm form={form} />
        <ContactForm form={form} />
        <OtherInfoForm form={form} />
        <GovernmentIDsForm form={form} />
        <EmergencyContactForm form={form} />
        <RemarksForm form={form} />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={onSubmit} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Resident"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ResidentForm;
