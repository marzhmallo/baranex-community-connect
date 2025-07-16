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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme/ThemeProvider";
const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Please enter your email or username"),
  password: z.string().min(6, "Password must be at least 6 characters long")
});
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
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

const otpVerificationSchema = z.object({
  otp: z.string().min(6, "Please enter the 6-digit code").max(6, "Please enter the 6-digit code")
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Please confirm your password")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
type OtpVerificationFormValues = z.infer<typeof otpVerificationSchema>;
const Auth = () => {
  const {
    theme
  } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "forgot-password" | "reset-password">("login");
  const [resetMode, setResetMode] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
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
  const navigate = useNavigate();
  const hcaptchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "a002bff6-3d98-4db2-8406-166e106c1958";

  // Fetch available barangays
  useEffect(() => {
    const fetchBarangays = async () => {
      const {
        data,
        error
      } = await supabase.from('barangays').select('id, barangayname, municipality, province').order('province').order('municipality').order('barangayname');
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

  // Add useEffect to filter barangays based on search
  useEffect(() => {
    if (barangaySearch.trim() === "") {
      setFilteredBarangays([]);
      setShowBarangaySuggestions(false);
      return;
    }
    const filtered = barangays.filter(barangay => barangay.name.toLowerCase().includes(barangaySearch.toLowerCase()) || barangay.municipality.toLowerCase().includes(barangaySearch.toLowerCase()) || barangay.province.toLowerCase().includes(barangaySearch.toLowerCase()));
    setFilteredBarangays(filtered.slice(0, 10)); // Limit to 10 suggestions
    setShowBarangaySuggestions(true);
  }, [barangaySearch, barangays]);
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: ""
    }
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
      gender: undefined,
      purok: "",
      bday: "",
      role: "user",
      barangayId: "",
      barangayname: "",
      municipality: "",
      province: "",
      region: "",
      country: "Philippines"
    }
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const otpForm = useForm<OtpVerificationFormValues>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: ""
    }
  });
  
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
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
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    try {
      console.log("Attempting login with:", values.emailOrUsername);

      // First check if it's an email or username
      const isEmail = values.emailOrUsername.includes('@');
      let email = values.emailOrUsername;

      // If it's not an email, look up the email from username in profiles table
      if (!isEmail) {
        console.log("Looking up email for username:", values.emailOrUsername);
        const {
          data: profileData
        } = await supabase.from('profiles').select('email').eq('username', values.emailOrUsername).maybeSingle();
        if (profileData?.email) {
          email = profileData.email;
        } else {
          toast({
            title: "User Not Found",
            description: "No user found with that username",
            variant: "destructive"
          });
          setIsLoading(false);
          captchaRef.current?.resetCaptcha();
          setCaptchaToken(null);
          return;
        }
      }
      const {
        data: {
          user,
          session
        },
        error
      } = await supabase.auth.signInWithPassword({
        email: email,
        password: values.password,
        options: {
          captchaToken
        }
      });
      if (error) {
        console.error("Login error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else if (user) {
        console.log("Login successful, user authenticated");
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
        // AuthProvider will handle the redirect based on user role
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
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
        const {
          data: existingBarangay,
          error: brgyCheckError
        } = await supabase.from('barangays').select('id').ilike('barangayname', values.barangayname?.trim() || '').eq('municipality', values.municipality?.trim() || '').eq('province', values.province?.trim() || '').single();
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
        const {
          data: brgyData,
          error: brgyError
        } = await supabase.from('barangays').insert({
          barangayname: values.barangayname?.trim() || '',
          municipality: values.municipality?.trim() || '',
          province: values.province?.trim() || '',
          region: values.region?.trim() || '',
          country: values.country || 'Philippines',
          created_at: new Date().toISOString(),
          is_custom: false
        }).select('id').single();
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
          // If admin/staff is creating a new barangay, they become superior admin
          if (values.role === "admin" || values.role === "staff") {
            isSuperiorAdmin = true;
          }
        }
      } else {
        brgyId = values.barangayId || null;
        // If admin/staff is joining existing barangay, they remain regular admin/staff
        isSuperiorAdmin = false;
      }
      const userStatus = (values.role === "admin" || values.role === "staff") && values.barangayId === "new-barangay" ? "active" : "pending";

      // Create user auth account
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          captchaToken,
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
        // Insert into profiles table for all user types
        const {
          error: profileError
        } = await supabase.from('profiles').insert({
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
          const successMessage = userStatus === "active" ? "Account created successfully! You can now log in." : "Account created and pending approval from the barangay administrator.";
          toast({
            title: "Account created",
            description: successMessage
          });
          setActiveTab("login");
          signupForm.reset();
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
    setBarangaySearch("Register New Barangay");
    setShowBarangaySuggestions(false);
  };
  const handleBarangaySearchChange = (value: string) => {
    setBarangaySearch(value);
    if (value === "") {
      signupForm.setValue("barangayId", "");
    }
  };


  const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
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
      // First check if the email exists in the system
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', values.email)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, other errors should be handled
        toast({
          title: "Error",
          description: "Unable to verify email. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
        return;
      }
      
      if (!existingUser) {
        toast({
          title: "Email Not Found",
          description: "No account found with this email address.",
          variant: "destructive"
        });
        setIsLoading(false);
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
        return;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/update-password`,
        captchaToken
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Check your email for password reset instructions.",
          variant: "default"
        });
        setOtpEmail(values.email);
        setShowOtpInput(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  const handleOtpVerification = async (values: OtpVerificationFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: values.otp,
        type: 'email'
      });
      
      if (error) {
        toast({
          title: "Invalid Code",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Code Verified",
          description: "Redirecting to password update page...",
          variant: "default"
        });
        navigate('/update-password');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      console.error("OTP verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated. Please log in with your new password.",
          variant: "default"
        });
        
        // Sign out the user after password reset to clear recovery session
        await supabase.auth.signOut();
        
        setResetMode(false);
        setActiveTab("login");
        resetPasswordForm.reset();
        // Clear the URL hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return <div className={`w-full min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100'}`}>
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left side - Brand/Info */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className={`absolute -top-4 -left-4 w-72 h-72 rounded-full opacity-60 animate-pulse ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-blue-300/30'}`}></div>
            <div className={`absolute -bottom-8 -right-8 w-48 h-48 rounded-full opacity-40 animate-pulse delay-1000 ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-indigo-300/30'}`}></div>
            
            <div className={`relative backdrop-blur-sm rounded-3xl p-8 shadow-2xl ${theme === 'dark' ? 'bg-slate-800/80 border border-slate-700/50' : 'bg-white/90 border border-blue-200/50'}`}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
                  <Building className="text-white text-2xl" />
                </div>
                <h1 className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Baranex</h1>
                <p className={`font-semibold ${theme === 'dark' ? 'text-indigo-400' : 'text-blue-600'}`}>Barangay Next-Gen Management</p>
              </div>
              
              <div className="space-y-6">
                <div className={`flex items-center gap-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'}`}>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Community Focused</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Empowering barangays with modern tools</p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200'}`}>
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <Lock className="text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Secure & Reliable</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Your data protected with advanced security</p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-r from-green-500/10 to-indigo-500/10 border border-green-500/20' : 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200'}`}>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8V12L14 14M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Efficient Management</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Streamline operations with smart solutions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className={`backdrop-blur-sm rounded-3xl shadow-2xl p-8 ${theme === 'dark' ? 'bg-slate-800/90 border border-slate-700/50' : 'bg-white/95 border border-blue-200/50'}`}>
            {/* Mobile header */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
                <Building className="text-white text-2xl" />
              </div>
              <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Baranex</h1>
              <p className={`font-semibold ${theme === 'dark' ? 'text-indigo-400' : 'text-blue-600'}`}>Next-Gen Barangay Management</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as "login" | "signup" | "forgot-password" | "reset-password")} className="w-full">
              
              
              {/* Header text */}
              <div className="text-center mb-6">
                <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {activeTab === "login" ? "Welcome Back!" : 
                   activeTab === "signup" ? "Create an Account" :
                   activeTab === "forgot-password" ? "Reset Password" :
                   "Set New Password"}
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {activeTab === "login" ? "Sign in to your dashboard" : 
                   activeTab === "signup" ? "Join Baranex to manage your community" :
                   activeTab === "forgot-password" ? "Enter your email to receive a password reset link" :
                   "Enter your new password"}
                </p>
              </div>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField control={loginForm.control} name="emailOrUsername" render={({
                    field
                  }) => <FormItem>
                          <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Email Address or Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                              <Input placeholder="Enter your email or username" className={`w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  
                  <FormField control={loginForm.control} name="password" render={({
                    field
                  }) => <FormItem>
                          <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                              <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" className={`w-full pl-11 pr-12 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                              <button type="button" className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className={`w-4 h-4 rounded focus:ring-blue-500 ${theme === 'dark' ? 'text-indigo-600 border-gray-500 bg-slate-700' : 'text-blue-600 border-gray-300 bg-white'}`} />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Remember me</span>
                    </label>
                    <button type="button" onClick={() => setActiveTab("forgot-password")} className={`font-medium transition-colors duration-200 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-500'}`}>Forgot password?</button>
                  </div>
                  
                  <div className="flex justify-center my-4">
                    <HCaptcha ref={captchaRef} sitekey={hcaptchaSiteKey} onVerify={handleCaptchaChange} onExpire={() => setCaptchaToken(null)} />
                  </div>
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl" disabled={isLoading || !captchaToken}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
              </TabsContent>

              <TabsContent value="signup">
                <ScrollArea className="h-[400px] pr-4">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={signupForm.control} name="firstname" render={({
                        field
                      }) => <FormItem>
                              <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Francis Jay" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                          
                        <FormField control={signupForm.control} name="lastname" render={({
                        field
                      }) => <FormItem>
                              <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Pon" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                      </div>
                        
                      <FormField control={signupForm.control} name="middlename" render={({
                      field
                    }) => <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Middle Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Jaugin" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                        
                      <FormField control={signupForm.control} name="username" render={({
                      field
                    }) => <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                                <Input placeholder="lordjay01" className={`w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                        
                      <FormField control={signupForm.control} name="email" render={({
                      field
                    }) => <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                                <Input placeholder="francisjaypon@gmail.com" className={`w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                        
                      <FormField control={signupForm.control} name="phone" render={({
                      field
                    }) => <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+63 912 345 6789" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={signupForm.control} name="gender" render={({
                        field
                      }) => <FormItem>
                              <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Gender</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500'}`}>
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
                            </FormItem>} />

                        <FormField control={signupForm.control} name="purok" render={({
                        field
                      }) => <FormItem>
                              <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Purok</FormLabel>
                              <FormControl>
                                <Input placeholder="Purok 1" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                      </div>

                      <FormField control={signupForm.control} name="bday" render={({
                      field
                    }) => <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500'}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                        
                      <FormField control={signupForm.control} name="role" render={({
                      field
                    }) => <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500'}`}>
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
                          </FormItem>} />
                        
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
                        
                      <FormField control={signupForm.control} name="barangayId" render={({
                      field
                    }) => <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Barangay</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <div className="relative">
                                  <MapPin className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                                  <Input placeholder="Search for your barangay..." value={barangaySearch} onChange={e => handleBarangaySearchChange(e.target.value)} onFocus={() => {
                              if (barangaySearch && filteredBarangays.length > 0) {
                                setShowBarangaySuggestions(true);
                              }
                            }} className={`w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} />
                                </div>
                                
                                {showBarangaySuggestions && <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                  {filteredBarangays.length > 0 && <>
                                      {filteredBarangays.map(barangay => <button key={barangay.id} type="button" onClick={() => handleBarangaySelect(barangay)} className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0">
                                          <div className="font-medium">{barangay.name}</div>
                                          <div className="text-sm text-gray-500">
                                            {barangay.municipality}, {barangay.province}
                                          </div>
                                        </button>)}
                                      {(selectedRole === "admin" || selectedRole === "staff") && <>
                                          <div className="border-t border-gray-200 my-1"></div>
                                          <button type="button" onClick={handleNewBarangaySelect} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 font-medium">
                                            + Register New Barangay
                                          </button>
                                        </>}
                                    </>}
                                  
                                  {filteredBarangays.length === 0 && barangaySearch.trim() !== "" && <div className="px-4 py-2 text-gray-500">
                                      {selectedRole === "admin" || selectedRole === "staff" ? <button type="button" onClick={handleNewBarangaySelect} className="w-full text-left text-blue-600 font-medium hover:bg-blue-50 py-2 px-2 rounded">
                                          + Register New Barangay
                                        </button> : "No barangays found. Contact an admin to register your barangay."}
                                    </div>}
                                </div>}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                        
                      {/* Click outside to close suggestions */}
                      {showBarangaySuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowBarangaySuggestions(false)} />}
                        
                      {isNewBarangay && (selectedRole === "admin" || selectedRole === "staff") && <>
                          <FormField control={signupForm.control} name="barangayname" render={({
                        field
                      }) => <FormItem>
                                <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Barangay Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Building className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <Input placeholder="Poblacion" className={`w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>} />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={signupForm.control} name="municipality" render={({
                          field
                        }) => <FormItem>
                                  <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Municipality/City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Sindangan" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>} />
                            
                            <FormField control={signupForm.control} name="province" render={({
                          field
                        }) => <FormItem>
                                  <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Province</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Zamboanga Del Norte" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={signupForm.control} name="region" render={({
                          field
                        }) => <FormItem>
                                  <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Region (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="IX" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>} />
                            
                            <FormField control={signupForm.control} name="country" render={({
                          field
                        }) => <FormItem>
                                  <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Country</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Philippines" defaultValue="Philippines" className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>} />
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
                        </>}
                        
                      <FormField control={signupForm.control} name="password" render={({
                      field
                    }) => <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                                <Input type={showPassword ? "text" : "password"} placeholder="Create a secure password" className={`w-full pl-11 pr-12 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} {...field} />
                                <button type="button" className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      {!isNewBarangay && selectedRole !== "admin" && <div className="rounded-md bg-yellow-50 p-4">
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
                      </div>}
                      
                      <div className="flex justify-center my-4">
                        <HCaptcha ref={captchaRef} sitekey={hcaptchaSiteKey} onVerify={handleCaptchaChange} onExpire={() => setCaptchaToken(null)} />
                      </div>
                      
                      <Button type="submit" className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl" disabled={isLoading || !captchaToken}>
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

              <TabsContent value="forgot-password">
                {!showOtpInput ? (
                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                      <FormField 
                        control={forgotPasswordForm.control} 
                        name="email" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                                <Input 
                                  placeholder="Enter your email address" 
                                  className={`w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      
                      <div className="flex justify-center my-4">
                        <HCaptcha ref={captchaRef} sitekey={hcaptchaSiteKey} onVerify={handleCaptchaChange} onExpire={() => setCaptchaToken(null)} />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl" 
                        disabled={isLoading || !captchaToken}
                      >
                        {isLoading ? "Sending Code..." : "Send Verification Code"}
                      </Button>
                      
                      <div className="text-center">
                        <button 
                          type="button" 
                          onClick={() => setActiveTab("login")} 
                          className={`text-sm font-medium transition-colors duration-200 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-500'}`}
                        >
                          Back to Login
                        </button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(handleOtpVerification)} className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                          Enter Verification Code
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                          We sent a 6-digit code to {otpEmail}
                        </p>
                      </div>

                      <FormField 
                        control={otpForm.control} 
                        name="otp" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={`block text-sm font-medium mb-2 text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                              Verification Code
                            </FormLabel>
                            <FormControl>
                              <div className="flex justify-center">
                                <InputOTP maxLength={6} {...field}>
                                  <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                  </InputOTPGroup>
                                </InputOTP>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Verifying..." : "Verify Code"}
                      </Button>
                      
                      <div className="text-center space-y-2">
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowOtpInput(false);
                            setOtpEmail("");
                            otpForm.reset();
                          }}
                          className={`text-sm font-medium transition-colors duration-200 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-500'}`}
                        >
                          Try Different Email
                        </button>
                      </div>
                    </form>
                  </Form>
                )}
              </TabsContent>

              <TabsContent value="reset-password">
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                    <FormField 
                      control={resetPasswordForm.control} 
                      name="password" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                            New Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter your new password" 
                                className={`w-full pl-11 pr-12 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} 
                                {...field} 
                              />
                              <button 
                                type="button" 
                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`} 
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} 
                    />
                    
                    <FormField 
                      control={resetPasswordForm.control} 
                      name="confirmPassword" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                            Confirm New Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Confirm your new password" 
                                className={`w-full pl-11 pr-12 py-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50 text-white focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400' : 'border-blue-200 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500'}`} 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} 
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating Password..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            
            <div className={`mt-6 pt-6 ${theme === 'dark' ? 'border-t border-slate-700' : 'border-t border-blue-200'}`}>
              <div className="text-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {activeTab === "login" ? <>
                      New to Baranex?{" "}
                      <button onClick={() => setActiveTab("signup")} className={`font-medium hover:underline transition-all duration-200 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-500'}`}>
                        Sign up
                      </button>
                    </> : activeTab === "signup" ? <>
                      Already have an account?{" "}
                      <button onClick={() => setActiveTab("login")} className={`font-medium hover:underline transition-all duration-200 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-500'}`}>
                        Sign in
                      </button>
                    </> : activeTab === "forgot-password" ? <>
                      Remember your password?{" "}
                      <button onClick={() => setActiveTab("login")} className={`font-medium hover:underline transition-all duration-200 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-500'}`}>
                        Sign in
                      </button>
                    </> : null}
                </p>
              </div>
            </div>
            
            <div className={`mt-6 flex items-center justify-center gap-4 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="flex items-center gap-1">
                <Lock className={`h-4 w-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
                SSL Secured
              </span>
              <span className="flex items-center gap-1">
                <svg className={`h-4 w-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-blue-500'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Gov Certified
              </span>
            </div>
          </div>
          
          <div className={`mt-6 text-center text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>© 2025 Baranex. Empowering Filipino Communities.</p>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;