
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
import { Eye, EyeOff, Mail, User, Lock } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
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
  status: z.enum(["active", "inactive", "pending"]),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  
  // Use environment variable for the hCaptcha site key
  const hcaptchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "a002bff6-3d98-4db2-8406-166e106c1958";

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
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
      status: "pending",
    },
  });

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
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
        options: {
          captchaToken,
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/"); // Navigate to the main page on successful login
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
      captchaRef.current?.resetCaptcha(); // Reset captcha after authentication attempt
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
      // First, create the user in Supabase Auth
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
        // Create a default barangay entry if needed
        let brgyId = null;
        
        const { data: brgyData, error: brgyError } = await supabase
          .from('barangays')
          .insert({
            barangayname: 'Default Barangay',
            municipality: 'Default Municipality',
            province: 'Default Province',
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (!brgyError && brgyData) {
          brgyId = brgyData.id;
        } else {
          console.error('Error creating barangay:', brgyError);
          // Get a default barangay if creation fails
          const { data: defaultBrgy } = await supabase
            .from('barangays')
            .select('id')
            .limit(1)
            .single();
            
          if (defaultBrgy) {
            brgyId = defaultBrgy.id;
          }
        }
        
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
            role: values.role,
            status: values.status,
            created_at: new Date().toISOString()
          });
        
        if (profileError) {
          toast({
            title: "Profile Error",
            description: profileError.message,
            variant: "destructive",
          });
          console.error("Profile creation error:", profileError);
        } else {
          toast({
            title: "Account created",
            description: "Please check your email to verify your account",
          });
          setActiveTab("login");
          signupForm.reset();
        }
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
    <div className="min-h-screen w-full flex lg:flex-row flex-col bg-gradient-to-br from-blue-100 via-white to-blue-50">
      {/* Left side - Brand/Info */}
      <div className="lg:w-1/2 w-full p-6 flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-blue-800 text-white">
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
      <div className="lg:w-1/2 w-full p-6 flex justify-center items-center">
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="you@example.com" 
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
                    
                    <div className="grid grid-cols-2 gap-4">
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
                      
                      <FormField
                        control={signupForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
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
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                    
                    <p className="text-xs text-center text-gray-500 mt-4">
                      By clicking "Create Account", you agree to our{" "}
                      <a href="#" className="underline text-blue-600">Terms of Service</a> and{" "}
                      <a href="#" className="underline text-blue-600">Privacy Policy</a>.
                    </p>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
