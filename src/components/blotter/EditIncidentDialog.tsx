
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";

interface EditIncidentDialogProps {
  incident: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  report_type: string;
  status: string;
  location: string;
  reporter_name: string;
  reporter_contact?: string;
}

const EditIncidentDialog = ({ incident, open, onOpenChange, onSuccess }: EditIncidentDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      report_type: "",
      status: "",
      location: "",
      reporter_name: "",
      reporter_contact: "",
    },
  });

  useEffect(() => {
    if (incident) {
      form.reset({
        title: incident.title || "",
        description: incident.description || "",
        report_type: incident.report_type || "",
        status: incident.status || "",
        location: incident.location || "",
        reporter_name: incident.reporter_name || "",
        reporter_contact: incident.reporter_contact || "",
      });
    }
  }, [incident, form]);

  const onSubmit = async (data: FormData) => {
    if (!incident?.id) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('incident_reports')
        .update({
          title: data.title,
          description: data.description,
          report_type: data.report_type as any,
          status: data.status as any,
          location: data.location,
          reporter_name: data.reporter_name,
          reporter_contact: data.reporter_contact || null,
        })
        .eq('id', incident.id);

      if (error) {
        console.error('Error updating incident report:', error);
        toast({
          title: "Error",
          description: "Failed to update incident report",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Incident report updated successfully",
      });

      onSuccess();
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
          <DialogTitle>Edit Incident Report</DialogTitle>
          <DialogDescription>
            Update the incident report details
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="report_type"
                rules={{ required: "Report type is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="status"
                rules={{ required: "Status is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Under_Investigation">Under Investigation</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Dismissed">Dismissed</SelectItem>
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
                      <Input {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[100px]" {...field} />
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
                      <Input {...field} />
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
                    <FormLabel>Reporter Contact</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                {submitting ? "Updating..." : "Update Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditIncidentDialog;
