import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Mail, User, Lock, Building, MapPin, ArrowLeft, Plus, Building2, Bell, Settings, LogOut } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { supabase } from '@/integrations/supabase/client';

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  firstname: z.string().min(2, "First name is required"),
  lastname: z.string().min(2, "Last name is required"),
  middlename: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters long"),
  phone: z.string().min(10, "Please enter a valid phone number").optional(),
  gender: z.enum(["Male", "Female", "Other"], {
    required_error: "Please select a gender"
  }),
  purok: z.string().min(1, "Please enter your purok"),
  bday: z.string().min(1, "Please enter your date of birth"),
  role: z.enum(["admin", "staff", "user"]),
  barangayId: z.string().refine(val => val !== "", {
    message: "Please select a barangay or choose to register a new one"
  }),
  barangayname: z.string().optional(),
  municipality: z.string().optional(),
  province: z.string().optional(),
  region: z.string().optional(),
  country: z.string().default("Philippines").optional()
}).refine(data => {
  if (data.barangayId === "new-barangay" && (data.role === "admin" || data.role === "staff")) {
    return !!data.barangayname && !!data.municipality && !!data.province;
  }
  return true;
}, {
  message: "Required barangay information is missing",
  path: ["barangayname"]
});

type SignupFormValues = z.infer<typeof signupSchema>;

const MunicipalitiesPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [municipalities, setMunicipalities] = useState<{
    id: string;
    municipality: string;
    province: string;
    region: string;
    barangay: string;
  }[]>([]);
  const [barangays, setBarangays] = useState<{
    id: string;
    name: string;
    municipality: string;
    province: string;
  }[]>([]);
  const [barangaySearch, setBarangaySearch] = useState("");
  const [showBarangaySuggestions, setShowBarangaySuggestions] = useState(false);
  const [filteredBarangays, setFilteredBarangays] = useState<{
    id: string;
    name: string;
    municipality: string;
    province: string;
  }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const captchaRef = useRef<HCaptcha>(null);
  const hcaptchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "a002bff6-3d98-4db2-8406-166e106c1958";

  // Fetch municipalities from plaza table
  useEffect(() => {
    const fetchMunicipalities = async () => {
      const { data, error } = await supabase
        .from('plaza')
        .select('id, municipality, province, region, barangay')
        .order('province')
        .order('municipality');
      
      if (error) {
        console.error('Error fetching municipalities:', error);
        return;
      }
      
      if (data) {
        setMunicipalities(data);
      }
    };
    
    fetchMunicipalities();
  }, []);

  // Fetch available barangays for the modal form
  useEffect(() => {
    const fetchBarangays = async () => {
      const { data, error } = await supabase
        .from('barangays')
        .select('id, barangayname, municipality, province')
        .order('province')
        .order('municipality')
        .order('barangayname');
      
      if (error) {
        console.error('Error fetching barangays:', error);
        return;
      }
      
      if (data) {
        setBarangays(data.map(b => ({
          id: b.id,
          name: b.barangayname,
          municipality: b.municipality,
          province: b.province
        })));
      }
    };
    
    fetchBarangays();
  }, []);

  // Filter barangays based on search
  useEffect(() => {
    if (barangaySearch.trim() === "") {
      setFilteredBarangays([]);
      setShowBarangaySuggestions(false);
      return;
    }
    
    const filtered = barangays.filter(barangay => 
      barangay.name.toLowerCase().includes(barangaySearch.toLowerCase()) ||
      barangay.municipality.toLowerCase().includes(barangaySearch.toLowerCase()) ||
      barangay.province.toLowerCase().includes(barangaySearch.toLowerCase())
    );
    
    setFilteredBarangays(filtered.slice(0, 10));
    setShowBarangaySuggestions(true);
  }, [barangaySearch, barangays]);

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      firstname: "",
      lastname: "",
      middlename: "",
      username: "",
      phone: "",
      gender: undefined,
      purok: "",
      bday: "",
      role: "admin",
      barangayId: "",
      barangayname: "",
      municipality: "",
      province: "",
      region: "",
      country: "Philippines"
    }
  });

  const selectedBarangayId = signupForm.watch("barangayId");
  const isNewBarangay = selectedBarangayId === "new-barangay";

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    if (token) {
      console.log("Captcha verified successfully");
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
    setIsLoading(true);
    
    if (!captchaToken) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the captcha verification",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      let municipalityId: string | null = null;
      
      // For municipality registration, always register as new municipality
      if (values.barangayId === "new-barangay") {
        // Check if municipality already exists in plaza table
        const { data: existingMunicipality, error: plazaCheckError } = await supabase
          .from('plaza')
          .select('id')
          .eq('municipality', values.municipality?.trim() || '')
          .eq('province', values.province?.trim() || '')
          .single();

        if (plazaCheckError && plazaCheckError.code !== 'PGRST116') {
          toast({
            title: "Database Error",
            description: plazaCheckError.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (existingMunicipality) {
          toast({
            title: "Municipality Already Exists",
            description: "This municipality is already registered in our system.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Generate municipality ID
        municipalityId = crypto.randomUUID();
        
        // Create municipality entry in plaza table
        const { error: plazaError } = await supabase
          .from('plaza')
          .insert({
            id: municipalityId,
            barangay: values.barangayname?.trim() || '',
            municipality: values.municipality?.trim() || '',
            province: values.province?.trim() || '',
            region: values.region?.trim() || '',
            country: values.country || 'Philippines'
          });

        if (plazaError) {
          toast({
            title: "Municipality Registration Error",
            description: plazaError.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // Create user auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          captchaToken,
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            firstname: values.firstname,
            lastname: values.lastname
          }
        }
      });

      if (authError) {
        toast({
          title: "Error",
          description: authError.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Insert into profiles table with overseer role and null brgyid
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            adminid: authData.user.id,
            brgyid: null, // Municipality admin has no barangay
            mid: municipalityId, // Link to the municipality in plaza table
            username: values.username,
            firstname: values.firstname,
            middlename: values.middlename || null,
            lastname: values.lastname,
            email: values.email,
            phone: values.phone || null,
            gender: values.gender,
            purok: values.purok,
            bday: values.bday,
            role: 'overseer', // Municipality admin role
            status: 'active',
            superior_admin: true,
            created_at: new Date().toISOString()
          });

        if (profileError) {
          toast({
            title: "Profile Error",
            description: profileError.message,
            variant: "destructive"
          });
          console.error("Profile creation error:", profileError);
        } else {
          toast({
            title: "Account created",
            description: "Municipality overseer account created successfully!"
          });
          
          signupForm.reset();
          setIsModalOpen(false);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  const handleBarangaySelect = (barangay: {
    id: string;
    name: string;
    municipality: string;
    province: string;
  }) => {
    signupForm.setValue("barangayId", barangay.id);
    setBarangaySearch(`${barangay.name}, ${barangay.municipality}, ${barangay.province}`);
    setShowBarangaySuggestions(false);
  };

  const handleNewBarangaySelect = () => {
    signupForm.setValue("barangayId", "new-barangay");
    setBarangaySearch("Register New Municipality");
    setShowBarangaySuggestions(false);
  };

  const handleBarangaySearchChange = (value: string) => {
    setBarangaySearch(value);
    if (value === "") {
      signupForm.setValue("barangayId", "");
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out"
      });
      navigate("/login");
    }
  };

  const sidebarNavItems = [
    { icon: Building, label: 'Dashboard', active: false, count: null, path: '/echelon' },
    { icon: Bell, label: 'Pending Approvals', active: false, count: 3, path: '/echelon' },
    { icon: Building2, label: 'Municipalities', active: true, count: null, path: '/municipalities' },
    { icon: Building, label: 'Barangays', active: false, count: null, path: '/echelon' },
    { icon: User, label: 'User Management', active: false, count: null, path: '/echelon' },
    { icon: Settings, label: 'System Settings', active: false, count: null, path: '/echelon' },
  ];

  return (
    <div className="w-full bg-background min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r fixed h-full">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Baranex</h1>
              <p className="text-sm text-muted-foreground">System</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {sidebarNavItems.map((item, index) => (
              <li key={index}>
                <button 
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                    item.active 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.count && (
                    <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-1 ml-auto">
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="text-sm" />
              </div>
              <span className="text-sm text-foreground">Super Admin</span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">Municipalities</h1>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Register New Municipality</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register Municipality Admin</DialogTitle>
                <DialogDescription>
                  Create a new municipality administrator account
                </DialogDescription>
              </DialogHeader>
              
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="firstname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="text"
                                placeholder="Juan"
                                className="pl-10"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="lastname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="text"
                                placeholder="Dela Cruz"
                                className="pl-10"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={signupForm.control}
                    name="middlename"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type="text"
                              placeholder="Santos"
                              className="pl-10"
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="text"
                                placeholder="municipality_admin"
                                className="pl-10"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="admin@municipality.gov.ph"
                                className="pl-10"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Personal Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="bday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="+63 912 345 6789"
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="purok"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purok/Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="text"
                                placeholder="Purok 1"
                                className="pl-10"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Municipality Selection */}
                  <FormField
                    control={signupForm.control}
                    name="barangayId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select or Register Municipality</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                            <Input
                              value={barangaySearch}
                              onChange={(e) => handleBarangaySearchChange(e.target.value)}
                              placeholder="Search for a municipality or register new..."
                              className="pl-10"
                              disabled={isLoading}
                              onFocus={() => barangaySearch && setShowBarangaySuggestions(true)}
                            />
                            {showBarangaySuggestions && (
                              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                {filteredBarangays.map((barangay) => (
                                  <button
                                    key={barangay.id}
                                    type="button"
                                    onClick={() => handleBarangaySelect(barangay)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium">{barangay.name}</div>
                                    <div className="text-sm text-gray-500">{barangay.municipality}, {barangay.province}</div>
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={handleNewBarangaySelect}
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 font-medium border-t border-gray-200"
                                >
                                  + Register New Municipality
                                </button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* New Municipality Fields */}
                  {isNewBarangay && (
                     <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border dark:bg-muted/30 dark:border-muted-foreground/20">
                       <h4 className="font-medium text-foreground">New Municipality Registration</h4>
                       
                       <FormField
                         control={signupForm.control}
                         name="barangayname"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Barangay Name</FormLabel>
                             <FormControl>
                               <Input
                                 {...field}
                                 type="text"
                                 placeholder="Barangay Santo Niño"
                                 disabled={isLoading}
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />

                       <FormField
                         control={signupForm.control}
                         name="municipality"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Municipality Name</FormLabel>
                             <FormControl>
                               <Input
                                 {...field}
                                 type="text"
                                 placeholder="City of Davao"
                                 disabled={isLoading}
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={signupForm.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  placeholder="Davao del Sur"
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={signupForm.control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  placeholder="Region XI"
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* CAPTCHA */}
                  <div className="flex justify-center">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={hcaptchaSiteKey}
                      onVerify={handleCaptchaChange}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !captchaToken}
                  >
                    {isLoading ? "Creating Account..." : "Create Municipality Admin Account"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>

        {/* Municipalities List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {municipalities.map((municipality) => (
            <Card key={municipality.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>{municipality.municipality}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{municipality.barangay}</span>
                  </div>
                  <div>Province: {municipality.province}</div>
                  <div>Region: {municipality.region}</div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {municipalities.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No municipalities found</h3>
              <p className="text-gray-500 mb-4">Register the first municipality to get started.</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default MunicipalitiesPage;