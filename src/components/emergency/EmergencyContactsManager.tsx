
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { Plus, Phone, Edit, Trash2, Mail } from "lucide-react";

interface EmergencyContact {
  id: string;
  type: string;
  name: string;
  phone_number: string;
  email?: string;
  description?: string;
  created_at: string;
}

interface ContactFormData {
  type: string;
  name: string;
  phone_number: string;
  email?: string;
  description?: string;
}

const EmergencyContactsManager = () => {
  const { userProfile } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  const form = useForm<ContactFormData>({
    defaultValues: {
      type: "",
      name: "",
      phone_number: "",
      email: "",
      description: "",
    },
  });

  useEffect(() => {
    if (userProfile?.brgyid) {
      fetchContacts();
    }
  }, [userProfile?.brgyid]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('brgyid', userProfile?.brgyid)
        .order('type', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    if (!userProfile?.id || !userProfile?.brgyid) return;

    try {
      if (editingContact) {
        const { error } = await supabase
          .from('emergency_contacts')
          .update({
            type: data.type,
            name: data.name,
            phone_number: data.phone_number,
            email: data.email || null,
            description: data.description || null,
          })
          .eq('id', editingContact.id);

        if (error) throw error;
        toast({ title: "Success", description: "Emergency contact updated successfully" });
      } else {
        const { error } = await supabase
          .from('emergency_contacts')
          .insert({
            type: data.type,
            name: data.name,
            phone_number: data.phone_number,
            email: data.email || null,
            description: data.description || null,
            brgyid: userProfile.brgyid,
            created_by: userProfile.id,
          });

        if (error) throw error;
        toast({ title: "Success", description: "Emergency contact added successfully" });
      }

      form.reset();
      setIsDialogOpen(false);
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save emergency contact",
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) return;

    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Emergency contact deleted successfully" });
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete emergency contact",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (contact: EmergencyContact) => {
    setEditingContact(contact);
    form.reset({
      type: contact.type,
      name: contact.name,
      phone_number: contact.phone_number,
      email: contact.email || "",
      description: contact.description || "",
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingContact(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const callContact = (phoneNumber: string, name: string) => {
    if (window.confirm(`Call ${name} at ${phoneNumber}?`)) {
      window.open(`tel:${phoneNumber}`);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fire': return 'destructive';
      case 'police': return 'default';
      case 'medical': return 'secondary';
      case 'disaster': return 'outline';
      case 'rescue': return 'default';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'police': return '👮';
      case 'medical': return '🚑';
      case 'disaster': return '⛑️';
      case 'rescue': return '🚁';
      default: return '📞';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Emergency Contacts ({contacts.length})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </DialogTitle>
              <DialogDescription>
                {editingContact ? 'Update the emergency contact information.' : 'Add a new emergency contact for your barangay.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  rules={{ required: "Contact type is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fire">🔥 Fire Department</SelectItem>
                          <SelectItem value="police">👮 Police</SelectItem>
                          <SelectItem value="medical">🚑 Medical/Ambulance</SelectItem>
                          <SelectItem value="disaster">⛑️ Disaster Response</SelectItem>
                          <SelectItem value="rescue">🚁 Rescue Services</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Contact name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Barangay Fire Station" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone_number"
                  rules={{ required: "Phone number is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., +63 123 456 7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional information about this contact"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingContact ? 'Update Contact' : 'Add Contact'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(contact.type)}</span>
                    <Badge variant={getTypeColor(contact.type) as any}>
                      {contact.type}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(contact)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{contact.name}</CardTitle>
                {contact.description && (
                  <CardDescription>{contact.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => callContact(contact.phone_number, contact.name)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {contact.phone_number}
                </Button>
                {contact.email && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => window.open(`mailto:${contact.email}`)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {contact.email}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Emergency Contacts</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding emergency contacts for your barangay.
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Contact
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmergencyContactsManager;
