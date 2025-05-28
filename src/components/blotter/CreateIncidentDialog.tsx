
import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";

interface CreateIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  title: string;
  description: string;
  report_type: string;
  location: string;
  reporter_name: string;
  reporter_contact?: string;
}

const CreateIncidentDialog = ({ open, onOpenChange }: CreateIncidentDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const { userProfile } = useAuth();
  
  const form = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      report_type: "",
      location: "",
      reporter_name: "",
      reporter_contact: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!userProfile?.id || !userProfile?.brgyid) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('incident_reports')
        .insert({
          title: data.title,
          description: data.description,
          report_type: data.report_type as any,
          location: data.location,
          reporter_name: data.reporter_name,
          reporter_contact: data.reporter_contact || null,
          brgyid: userProfile.brgyid,
          created_by: userProfile.id,
        });

      if (error) {
        console.error('Error creating incident report:', error);
        toast({
          title: "Error",
          description: "Failed to create incident report",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Incident report created successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>File New Incident Report</DialogTitle>
          <DialogDescription>
            Create a new crime incident report for your barangay
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the incident" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="report_type"
                rules={{ required: "Report type is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Theft">Theft</SelectItem>
                        <SelectItem value="Dispute">Dispute</SelectItem>
                        <SelectItem value="Vandalism">Vandalism</SelectItem>
                        <SelectItem value="Curfew">Curfew Violation</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                rules={{ required: "Location is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Where did this occur?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              rules={{ required: "Description is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide detailed information about the incident"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reporter_name"
                rules={{ required: "Reporter name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporter Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of person reporting" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporter_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporter Contact (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number or email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIncidentDialog;
