
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  
  // Use environment variable for the hCaptcha site key
  // For hCaptcha, you'll need to register at https://www.hcaptcha.com/ to get a site key
  // Use the test key '10000000-ffff-ffff-ffff-000000000001' for development
  const hcaptchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "a002bff6-3d98-4db2-8406-166e106c1958";

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    if (token) {
      console.log("Captcha verified successfully");
      setError(null); // Clear any previous errors
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    if (!captchaToken) {
      setError("Please complete the CAPTCHA challenge.");
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the captcha verification",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken,
          }
        });
        if (error) {
          setError(error.message);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created",
            description: "Please check your email to verify your account",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken,
          }
        });
        if (error) {
          setError(error.message);
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
      }
    } catch (error: any) {
      setError("An unexpected error occurred");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Enter your details to create a new account" 
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex justify-center my-4">
              <HCaptcha
                ref={captchaRef}
                sitekey={hcaptchaSiteKey}
                onVerify={handleCaptchaChange}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
              {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
