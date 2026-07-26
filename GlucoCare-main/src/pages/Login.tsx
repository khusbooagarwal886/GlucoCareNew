import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const DEMO_ACCOUNTS = [
  "demo.patient@glucocare.com",
  "demo.doctor@glucocare.com",
];

const Login = () => {
  const { user, profile, loading: authLoading } = useAuthUser();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    // If user is authenticated AND has a profile with a role, redirect to home
    if (user && profile && profile.role) {
      navigate("/");
    }
    // If user is authenticated but NO profile exists, they need onboarding
    else if (user && !profile && !authLoading) {
      navigate("/role-setup");
    }
  }, [user, profile, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a demo account
      const isDemoAccount = DEMO_ACCOUNTS.includes(result.user.email || "");
      
      if (isDemoAccount) {
        toast.success("Demo account loaded!");
      } else {
        toast.success("Signed in successfully!");
      }
      // Navigation happens automatically via useEffect when profile loads
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return null; // Navigating via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card variant="glass" className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to GlucoCare</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGoogleSignIn} 
            className="w-full" 
            variant="hero"
            disabled={signingIn}
          >
            {signingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              "Sign in with Google"
            )}
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;