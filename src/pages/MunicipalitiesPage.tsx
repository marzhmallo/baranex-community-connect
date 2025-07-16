import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Mail, User, Lock, Building, MapPin, ArrowLeft } from 'lucide-react';
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
  
  const captchaRef = useRef<HCaptcha>(null);
  const hcaptchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "a002bff6-3d98-4db2-8406-166e106c1958";

  // Fetch available barangays
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
      let brgyId: string | null = null;
      let isSuperiorAdmin = false;

      // Process barangay selection or creation
      if (values.barangayId === "new-barangay") {
        const { data: existingBarangay, error: brgyCheckError } = await supabase
          .from('barangays')
          .select('id')
          .ilike('barangayname', values.barangayname?.trim() || '')
          .eq('municipality', values.municipality?.trim() || '')
          .eq('province', values.province?.trim() || '')
          .single();

        if (brgyCheckError && brgyCheckError.code !== 'PGRST116') {
          toast({
            title: "Database Error",
            description: brgyCheckError.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (existingBarangay) {
          toast({
            title: "Barangay Already Exists",
            description: "This barangay is already registered in our system. Please select it from the dropdown instead.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const { data: brgyData, error: brgyError } = await supabase
          .from('barangays')
          .insert({
            barangayname: values.barangayname?.trim() || '',
            municipality: values.municipality?.trim() || '',
            province: values.province?.trim() || '',
            region: values.region?.trim() || '',
            country: values.country || 'Philippines',
            created_at: new Date().toISOString(),
            is_custom: false
          })
          .select('id')
          .single();

        if (brgyError) {
          toast({
            title: "Barangay Creation Error",
            description: brgyError.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (brgyData) {
          brgyId = brgyData.id;
          isSuperiorAdmin = true;
        }
      } else {
        brgyId = values.barangayId || null;
        isSuperiorAdmin = false;
      }

      const userStatus = values.barangayId === "new-barangay" ? "active" : "pending";

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
        // Insert into profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            adminid: authData.user.id,
            brgyid: brgyId,
            username: values.username,
            firstname: values.firstname,
            middlename: values.middlename || null,
            lastname: values.lastname,
            email: values.email,
            phone: values.phone || null,
            gender: values.gender,
            purok: values.purok,
            bday: values.bday,
            role: values.role,
            status: userStatus,
            superior_admin: isSuperiorAdmin,
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
          const successMessage = userStatus === "active" 
            ? "Municipality admin account created successfully!" 
            : "Municipality admin account created and pending approval.";
          
          toast({
            title: "Account created",
            description: successMessage
          });
          
          signupForm.reset();
          navigate('/echelon');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/echelon')}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold">Register Municipality Admin</CardTitle>
          </div>
          <CardDescription>
            Create a new municipality administrator account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
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
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800">New Municipality Registration</h4>
                  
                  <FormField
                    control={signupForm.control}
                    name="barangayname"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default MunicipalitiesPage;