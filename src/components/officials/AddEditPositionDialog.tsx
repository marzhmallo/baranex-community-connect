import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { OfficialPosition } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
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
import { Checkbox } from '@/components/ui/checkbox';

const positionSchema = z.object({
  position: z.string().min(1, 'Position is required'),
  committee: z.string().optional(),
  term_start: z.string().min(1, 'Start date is required'),
  term_end: z.string().optional(),
  is_current: z.boolean().optional(),
  description: z.string().optional(),
  position_no: z.number().min(1, 'Position number must be at least 1').optional()
});

type PositionFormValues = z.infer<typeof positionSchema>;

interface AddEditPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: OfficialPosition | null;
  officialId: string | null;
  onSuccess: () => void;
}

export function AddEditPositionDialog({ 
  open, 
  onOpenChange, 
  position, 
  officialId, 
  onSuccess 
}: AddEditPositionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const isEditMode = !!position;
  
  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      position: '',
      committee: '',
      term_start: '',
      term_end: '',
      is_current: false,
      description: '',
      position_no: undefined
    }
  });
  
  // Update form values when position changes or dialog opens
  useEffect(() => {
    if (position && open) {
      // Format dates for input fields (YYYY-MM-DD)
      const formatDateForInput = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      form.reset({
        position: position.position || '',
        committee: position.committee || '',
        term_start: formatDateForInput(position.term_start),
        term_end: formatDateForInput(position.term_end),
        is_current: position.is_current || !position.term_end,
        description: position.description || '',
        position_no: position.position_no || undefined
      });
    } else if (!position && open) {
      // Clear form when adding a new position
      form.reset({
        position: '',
        committee: '',
        term_start: '',
        term_end: '',
        is_current: false,
        description: '',
        position_no: undefined
      });
    }
  }, [position, open, form]);
  
  const handleIsCurrentChange = (checked: boolean) => {
    if (checked) {
      form.setValue('term_end', '');
    }
  };
  
  const onSubmit = async (data: PositionFormValues) => {
    if (!officialId) return;
    
    try {
      setIsSubmitting(true);
      
      // Ensure term_start is always provided (required by the database)
      const formattedData = {
        ...data,
        official_id: officialId,
        is_current: !!data.is_current,
        // Set a far future date for term_end if is_current is true
        term_end: data.is_current ? new Date('9999-12-31').toISOString().split('T')[0] : (data.term_end || new Date().toISOString().split('T')[0]),
        position: data.position,
        term_start: data.term_start, // Ensure this field is included
        position_no: data.position_no || null // Include position_no
      };
      
      let result;
      
      if (isEditMode && position) {
        // Update existing position
        result = await supabase
          .from('official_positions')
          .update(formattedData)
          .eq('id', position.id);
      } else {
        // Insert new position
        result = await supabase
          .from('official_positions')
          .insert(formattedData);
      }
      
      if (result.error) {
        throw result.error;
      }

      // Update the officials table with the same position_no
      if (data.position_no !== undefined) {
        const { error: officialError } = await supabase
          .from('officials')
          .update({ position_no: data.position_no })
          .eq('id', officialId);

        if (officialError) {
          console.error('Error updating official position_no:', officialError);
          // Don't throw here as the position was already saved successfully
        }
      }
      
      toast({
        title: `Position ${isEditMode ? 'updated' : 'added'} successfully`,
        description: `The position has been ${isEditMode ? 'updated' : 'added'} successfully.`
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving position:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'add'} position. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2637] border-[#2a3649] text-white">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Position' : 'Add Position'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Barangay Captain"
                      {...field}
                      className="bg-[#2a3649] border-[#3a4659]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position Rank (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 1 for Captain, 2 for Vice Captain"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      className="bg-[#2a3649] border-[#3a4659]"
                    />
                  </FormControl>
                  <div className="text-xs text-gray-400 mt-1">
                    Lower numbers appear first (1 = highest priority). This will also update the official's rank.
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="committee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Committee (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Peace & Order"
                      {...field}
                      className="bg-[#2a3649] border-[#3a4659]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="term_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-[#2a3649] border-[#3a4659]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="term_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term End Date (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={form.watch('is_current')}
                        className="bg-[#2a3649] border-[#3a4659]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="is_current"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-[#2a3649]">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleIsCurrentChange(!!checked);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Current Position</FormLabel>
                    <p className="text-xs text-gray-400">
                      Check if this is a current position (no end date)
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of the role"
                      {...field}
                      className="bg-[#2a3649] border-[#3a4659]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-[#3a4659]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
