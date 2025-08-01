
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }).max(100, { message: 'Title must be less than 100 characters' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters' }),
  category: z.string().min(1, { message: 'Please select a category' }),
  audience: z.string().min(1, { message: 'Please select an audience' }),
  is_pinned: z.boolean().default(false),
  is_public: z.boolean().default(true),
  photo_url: z.string().optional(),
  attachment_url: z.string().optional(),
});

interface CreateAnnouncementFormProps {
  onAnnouncementCreated: () => void;
  onCancel: () => void;
}

const CreateAnnouncementForm = ({ onAnnouncementCreated, onCancel }: CreateAnnouncementFormProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '',
      audience: 'Public',
      is_pinned: false,
      is_public: true,
      photo_url: '',
      attachment_url: '',
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${userProfile?.id}/${fileName}`;

    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      console.error(`Error uploading ${bucket} file:`, error);
      throw error;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      let photoUrl = '';
      let attachmentUrl = '';

      // Upload photo if selected
      if (photoFile) {
        photoUrl = await uploadFile(photoFile, 'announcements');
      }

      // Upload attachment if selected
      if (attachmentFile) {
        attachmentUrl = await uploadFile(attachmentFile, 'announcements');
      }

      // Insert announcement record
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: values.title,
          content: values.content,
          category: values.category,
          audience: values.audience,
          is_pinned: values.is_pinned,
          is_public: values.is_public,
          photo_url: photoUrl || null,
          attachment_url: attachmentUrl || null,
          created_by: userProfile?.id,
          brgyid: userProfile?.brgyid,
        });

      if (error) {
        console.error('Error creating announcement:', error);
        toast({
          title: "Error",
          description: "Failed to create announcement. Please try again.",
          variant: "destructive",
        });
        return;
      }

      onAnnouncementCreated();
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Create New Announcement</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter announcement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter announcement content" 
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="News">News</SelectItem>
                        <SelectItem value="Alert">Alert</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Officials">Officials Only</SelectItem>
                        <SelectItem value="SK">SK Members</SelectItem>
                        <SelectItem value="Internal">Internal Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel>Photo</FormLabel>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange}
                  className="mt-1"
                />
                <FormDescription>
                  Optional: Upload an image for this announcement (max 5MB)
                </FormDescription>
              </div>

              <div>
                <FormLabel>Attachment</FormLabel>
                <Input 
                  type="file" 
                  onChange={handleAttachmentChange}
                  className="mt-1"
                />
                <FormDescription>
                  Optional: Attach a document (PDF, DOC, etc. - max 10MB)
                </FormDescription>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="is_pinned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Pin Announcement</FormLabel>
                      <FormDescription>
                        Pinned announcements appear at the top of the list
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public Visibility</FormLabel>
                      <FormDescription>
                        Make this announcement visible to the public
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="flex justify-end space-x-4 px-0">
              <Button 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Saving...
                  </>
                ) : 'Publish Announcement'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateAnnouncementForm;
