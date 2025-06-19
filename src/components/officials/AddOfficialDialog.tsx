
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Official } from '@/lib/types';
import { OfficialPhotoUpload } from './OfficialPhotoUpload';

const officialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  bio: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().min(1, 'Birth date is required'),
  education: z.string().optional(),
  is_sk: z.boolean().optional()
});

type OfficialFormValues = z.infer<typeof officialSchema>;

interface AddOfficialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  official?: Official | null;
}

export function AddOfficialDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  official 
}: AddOfficialDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditMode = !!official;
  
  // Get current user's brgyid
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });
  
  const form = useForm<OfficialFormValues>({
    resolver: zodResolver(officialSchema),
    defaultValues: {
      name: official?.name || '',
      email: official?.email || '',
      phone: official?.phone || '',
      bio: official?.bio || '',
      address: official?.address || '',
      birthdate: official?.birthdate || '',
      education: official?.education || '',
      is_sk: Array.isArray(official?.is_sk) ? official.is_sk[0] : false
    }
  });
  
  const onSubmit = async (data: OfficialFormValues) => {
    if (!currentUser?.brgyid) {
      toast({
        title: 'Error',
        description: 'User barangay information not found',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const officialData = {
        ...data,
        photo_url: photoUrl || official?.photo_url,
        brgyid: currentUser.brgyid,
        is_sk: [data.is_sk || false] // Convert boolean to array format
      };
      
      let result;
      
      if (isEditMode && official) {
        // Update existing official
        result = await supabase
          .from('officials')
          .update(officialData)
          .eq('id', official.id);
      } else {
        // Insert new official
        result = await supabase
          .from('officials')
          .insert(officialData);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: `Official ${isEditMode ? 'updated' : 'added'} successfully`,
        description: `${data.name} has been ${isEditMode ? 'updated' : 'added'} successfully.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['officials-with-positions'] });
      onSuccess();
      onOpenChange(false);
      form.reset();
      setPhotoUrl('');
    } catch (error) {
      console.error('Error saving official:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'add'} official. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Official' : 'Add New Official'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <OfficialPhotoUpload
                currentPhotoUrl={photoUrl || official?.photo_url}
                onPhotoUploaded={setPhotoUrl}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="education"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter educational background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter biography or description"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_sk"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Sangguniang Kabataan (SK) Official
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Check if this official is part of the SK
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Official' : 'Add Official'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
