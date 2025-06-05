
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, FileImage } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FeedbackType, FEEDBACK_CATEGORIES } from '@/lib/types/feedback';
import { feedbackAPI } from '@/lib/api/feedback';
import { useAuth } from '@/components/AuthProvider';

interface FeedbackFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editData?: any;
}

interface FormData {
  type: FeedbackType;
  category: string;
  description: string;
  location?: string;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ 
  onSuccess, 
  onCancel,
  editData 
}) => {
  const { userProfile } = useAuth();
  const [selectedType, setSelectedType] = useState<FeedbackType>(editData?.type || 'barangay');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      type: editData?.type || 'barangay',
      category: editData?.category || '',
      description: editData?.description || '',
      location: editData?.location || ''
    }
  });

  const watchedType = watch('type');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 5) {
      toast({
        title: "Too many files",
        description: "Maximum 5 files allowed",
        variant: "destructive"
      });
      return;
    }
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    console.log('Form submission started');
    console.log('User profile:', userProfile);
    
    if (!userProfile?.id) {
      console.error('User profile ID not found');
      toast({
        title: "Error",
        description: "User profile not found. Please log in again.",
        variant: "destructive"
      });
      return;
    }

    if (!userProfile?.brgyid) {
      console.error('User brgyid not found');
      toast({
        title: "Error",
        description: "User barangay ID not found. Please contact administrator.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, we'll store attachment file names
      // In a real implementation, you'd upload to storage first
      const attachmentUrls = attachments.map(file => file.name);

      const reportData = {
        user_id: userProfile.id,
        brgyid: userProfile.brgyid,
        type: data.type,
        category: data.category,
        description: data.description,
        location: data.location || null,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
        status: 'pending' as const
      };

      console.log('Report data to submit:', reportData);

      if (editData) {
        await feedbackAPI.updateReport(editData.id, reportData);
        toast({
          title: "Report updated",
          description: "Your report has been updated successfully"
        });
      } else {
        await feedbackAPI.createReport(reportData);
        toast({
          title: "Report submitted",
          description: "Your report has been submitted successfully"
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: `Failed to submit report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editData ? 'Edit Report' : 'Submit New Report'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Report Type</Label>
              <Select
                value={selectedType}
                onValueChange={(value: FeedbackType) => {
                  setSelectedType(value);
                  setValue('type', value);
                  setValue('category', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barangay">Barangay Issue</SelectItem>
                  <SelectItem value="system">System Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_CATEGORIES[selectedType].map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">Category is required</p>
              )}
            </div>
          </div>

          {selectedType === 'barangay' && (
            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                {...register('location')}
                placeholder="Specific location or address"
              />
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              {...register('description', { required: 'Description is required' })}
              placeholder="Provide details about the issue..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label>Attachments (Optional)</Label>
            <div className="mt-2">
              <label className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                <Upload className="h-5 w-5" />
                <span>Upload images (max 5)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileImage className="h-4 w-4" />
                      <span className="text-sm flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : (editData ? 'Update Report' : 'Submit Report')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
