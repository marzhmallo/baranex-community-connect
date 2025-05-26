
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Mail, User, Lock, Building, MapPin } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Please enter your email or username"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  firstname: z.string().min(2, "First name is required"),
  lastname: z.string().min(2, "Last name is required"),
  middlename: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters long"),
  phone: z.string().min(10, "Please enter a valid phone number").optional(),
  role: z.enum(["admin", "staff", "user"]),
  barangayId: z.string().refine(val => val !== "", {
    message: "Please select a barangay or choose to register a new one"
  }),
  barangayname: z.string().optional(),
  municipality: z.string().optional(),
  province: z.string().optional(),
  region: z.string().optional(),
  country: z.string().default("Philippines").optional(),
}).refine(data => {
  if (data.barangayId === "new-barangay" && (data.role === "admin" || data.role === "staff")) {
    return !!data.barangayname && !!data.municipality && !!data.province;
  }
  return true;
}, {
  message: "Required barangay information is missing",
  path: ["barangayname"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [barangays, setBarangays] = useState<{id: string, name: string, municipality: string, province: string}[]>([]);
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  
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

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

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
      role: "user",
      barangayId: "",
      barangayname: "",
      municipality: "",
      province: "",
      region: "",
      country: "Philippines",
    },
  });

  const selectedRole = signupForm.watch("role");
  const selectedBarangayId = signupForm.watch("barangayId");
  const isNewBarangay = selectedBarangayId === "new-barangay";

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    if (token) {
      console.log("Captcha verified successfully");
    }
  };

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    
    if (!captchaToken) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the captcha verification",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting login with:", values.emailOrUsername);
      
      // First check if it's an email or username
      const isEmail = values.emailOrUsername.includes('@');
      let email = values.emailOrUsername;
      
      // If it's not an email, look up the email from username
      if (!isEmail) {
        console.log("Looking up email for username:", values.emailOrUsername);
        
        // Check profiles table first
        let { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', values.emailOrUsername)
          .maybeSingle();
        
        if (profileData?.email) {
          email = profileData.email;
        } else {
          // Check users table
          let { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('username', values.emailOrUsername)
            .maybeSingle();
          
          if (userData?.email) {
            email = userData.email;
          } else {
            toast({
              title: "User Not Found",
              description: "No user found with that username",
              variant: "destructive",
            });
            setIsLoading(false);
            captchaRef.current?.resetCaptcha();
            setCaptchaToken(null);
            return;
          }
        }
      }
      
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: values.password,
        options: {
          captchaToken,
        }
      });
      
      if (error) {
        console.error("Login error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (user) {
        console.log("Login successful, user authenticated");
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        // AuthProvider will handle the redirect based on user role
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
    setIsLoading(true);
    
    if (!captchaToken) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the captcha verification",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      let brgyId: string | null = null;
      
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
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        if (existingBarangay) {
          toast({
            title: "Barangay Already Exists",
            description: "This barangay is already registered in our system. Please select it from the dropdown instead.",
            variant: "destructive",
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
            is_custom: true
          })
          .select('id')
          .single();
          
        if (brgyError) {
          toast({
            title: "Barangay Creation Error",
            description: brgyError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        if (brgyData) {
          brgyId = brgyData.id;
        }
      } else {
        brgyId = values.barangayId || null;
      }
      
      const userStatus = (values.role === "admin" || values.role === "staff") && values.barangayId === "new-barangay" 
        ? "active" 
        : "pending";
      
      // Create user auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          captchaToken,
          data: {
            firstname: values.firstname,
            lastname: values.lastname,
          }
        }
      });
      
      if (authError) {
        toast({
          title: "Error",
          description: authError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (authData.user) {
        // Insert into appropriate table based on role
        if (values.role === "admin" || values.role === "staff") {
          // Insert into profiles table for admin/staff
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
              role: values.role,
              status: userStatus,
              created_at: new Date().toISOString()
            });
          
          if (profileError) {
            toast({
              title: "Profile Error",
              description: profileError.message,
              variant: "destructive",
            });
            console.error("Profile creation error:", profileError);
          }
        } else {
          // Insert into users table for regular users
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              brgyid: brgyId,
              username: values.username,
              firstname: values.firstname,
              middlename: values.middlename || null,
              lastname: values.lastname,
              email: values.email,
              phone: values.phone ? parseFloat(values.phone) : null,
              role: values.role,
              status: userStatus,
              created_at: new Date().toISOString()
            });
          
          if (userError) {
            toast({
              title: "User Error",
              description: userError.message,
              variant: "destructive",
            });
            console.error("User creation error:", userError);
          }
        }
        
        const successMessage = userStatus === "active"
          ? "Account created successfully! You can now log in."
          : "Account created and pending approval from the barangay administrator.";

        toast({
          title: "Account created",
          description: successMessage,
        });
        setActiveTab("login");
        signupForm.reset();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  return (
    <div className="h-screen w-full flex lg:flex-row flex-col bg-gradient-to-br from-blue-100 via-white to-blue-50 overflow-hidden">
      {/* Left side - Brand/Info */}
      <div className="lg:w-1/2 w-full h-full p-6 flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">Baranex Management System</h1>
          <h2 className="text-2xl font-semibold mb-8">Create your account today</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col items-center p-3 bg-white/10 rounded-lg">
              <Mail className="mb-2 h-8 w-8 text-white" />
              <h3 className="text-sm font-semibold">Efficient Management</h3>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/10 rounded-lg">
              <User className="mb-2 h-8 w-8 text-white" />
              <h3 className="text-sm font-semibold">Resident Records</h3>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/10 rounded-lg">
              <svg className="mb-2 h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L14 14M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className="text-sm font-semibold">Real-time Updates</h3>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/10 rounded-lg">
              <svg className="mb-2 h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3 className="text-sm font-semibold">Document Management</h3>
            </div>
          </div>
          
          <div className="space-y-2 text-sm opacity-80">
            <p>• Streamlined barangay administration</p>
            <p>• Comprehensive household tracking</p>
            <p>• Integrated document processing</p>
            <p>• Secure data management</p>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth Form */}
      <div className="lg:w-1/2 w-full h-full p-6 flex justify-center items-center overflow-hidden">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {activeTab === "login" 
                ? "Enter your credentials to access your account" 
                : "Enter your details to create a new account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as "login" | "signup")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="emailOrUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email or Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="you@example.com or username" 
                                className="pl-9" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••" 
                                className="pl-9" 
                                {...field} 
                              />
                              <button 
                                type="button"
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-center my-4">
                      <HCaptcha
                        ref={captchaRef}
                        sitekey={hcaptchaSiteKey}
                        onVerify={handleCaptchaChange}
                        onExpire={() => setCaptchaToken(null)}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading || !captchaToken}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <ScrollArea className="h-[400px] pr-4">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={signupForm.control}
                          name="firstname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
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
                                <Input placeholder="Doe" {...field} />
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
                              <Input placeholder="Middle Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={signupForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input placeholder="johndoe" className="pl-9" {...field} />
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
                                <Input placeholder="you@example.com" className="pl-9" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={signupForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+63 XXX XXX XXXX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={signupForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Separator className="my-4" />
                      
                      <div className="rounded-md bg-blue-50 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Building className="h-5 w-5 text-blue-400" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Barangay Information</h3>
                          </div>
                        </div>
                      </div>
                      
                      <FormField
                        control={signupForm.control}
                        name="barangayId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barangay</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your barangay" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[200px]">
                                {barangays.map(barangay => (
                                  <SelectItem key={barangay.id} value={barangay.id}>
                                    {`${barangay.name}, ${barangay.municipality}, ${barangay.province}`}
                                  </SelectItem>
                                ))}
                                {(selectedRole === "admin" || selectedRole === "staff") && (
                                  <SelectItem value="new-barangay">Register New Barangay</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {isNewBarangay && (selectedRole === "admin" || selectedRole === "staff") && (
                        <>
                          <FormField
                            control={signupForm.control}
                            name="barangayname"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Barangay Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                      placeholder="Barangay Name" 
                                      className="pl-9" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={signupForm.control}
                              name="municipality"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Municipality/City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Municipality or City" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={signupForm.control}
                              name="province"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Province</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Province" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={signupForm.control}
                              name="region"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Region (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Region" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={signupForm.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Country" 
                                      defaultValue="Philippines"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="rounded-md bg-green-50 p-4 mt-2">
                            <div className="flex">
                              <div className="ml-3">
                                <p className="text-sm text-green-700">
                                  As you're registering a new barangay, your account will be automatically activated as the administrator.
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      
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
                                  type={showPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  className="pl-9"
                                  {...field} 
                                />
                                <button 
                                  type="button"
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {!isNewBarangay && selectedRole !== "admin" && (
                        <div className="rounded-md bg-yellow-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">Account Approval Required</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                  Your account will require approval from a barangay administrator before you can log in.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-center my-4">
                        <HCaptcha
                          ref={captchaRef}
                          sitekey={hcaptchaSiteKey}
                          onVerify={handleCaptchaChange}
                          onExpire={() => setCaptchaToken(null)}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading || !captchaToken}>
                        {isLoading ? "Creating Account..." : "Create Account"}
                      </Button>
                      
                      <p className="text-xs text-center text-gray-500 mt-4">
                        By clicking "Create Account", you agree to our{" "}
                        <a href="#" className="underline text-blue-600">Terms of Service</a> and{" "}
                        <a href="#" className="underline text-blue-600">Privacy Policy</a>.
                      </p>
                    </form>
                  </Form>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
