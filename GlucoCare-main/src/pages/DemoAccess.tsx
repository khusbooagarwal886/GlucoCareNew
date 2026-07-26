import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { setUserProfile, createPatientProfile, createDoctorProfile, generatePatientId, linkPatientToDoctor } from "@/lib/roles";

// Demo account credentials
const DEMO_CREDENTIALS = {
  patient: {
    email: "demo.patient@glucocare.com",
    password: "DemoPatient@123",
    name: "Ramesh Kumar",
    role: "Patient",
    description: "View glucose readings, vital signs, and health insights",
    firebaseRole: "patient" as const,
  },
  doctor: {
    email: "demo.doctor@glucocare.com",
    password: "DemoDoctor@123",
    name: "Dr. Priya Sharma",
    role: "Doctor",
    description: "View and manage patient data",
    firebaseRole: "doctor" as const,
  }
};

// Demo doctor ID
const DEMO_DOCTOR_ID = "DOC001";

export default function DemoAccess() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | null>(null);

  const handleDemoLogin = async (role: "patient" | "doctor") => {
    setLoading(true);
    setSelectedRole(role);

    try {
      const credentials = DEMO_CREDENTIALS[role];
      const result = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const user = result.user;

      // Ensure demo profile is complete in Firestore
      if (role === "patient") {
        // Create or ensure patient profile
        const patientId = generatePatientId();
        try {
          await createPatientProfile({
            uid: user.uid,
            patientId,
            firstName: "Ramesh",
            lastName: "Kumar",
            dob: "1960-01-15",
            phone: "9876543210",
            email: user.email || "",
          });
        } catch (err) {
          console.log("Patient profile already exists or error:", err);
        }

        // Create demo doctor profile if it doesn't exist
        try {
          await createDoctorProfile({
            uid: "demo-doctor-uid-001",
            doctorId: DEMO_DOCTOR_ID,
            firstName: "Priya",
            lastName: "Sharma",
            specialization: "Endocrinology",
            licenseNumber: "LIC001",
            email: DEMO_CREDENTIALS.doctor.email,
            phone: "9876543211",
          });
        } catch (err) {
          console.log("Doctor profile already exists or error:", err);
        }

        // Link patient to doctor
        try {
          await linkPatientToDoctor(patientId, "demo-doctor-uid-001");
        } catch (err) {
          console.log("Link already exists or error:", err);
        }

        // Set user profile with onboarded flag
        await setUserProfile(user.uid, {
          email: user.email || "",
          firstName: "Ramesh",
          lastName: "Kumar",
          dob: "1960-01-15",
          phone: "9876543210",
          displayName: user.displayName || credentials.name,
          photoURL: user.photoURL || undefined,
          role: "patient",
          onboarded: true,
          primaryPatientId: patientId,
        });
      } else {
        // Create or ensure doctor profile
        try {
          await createDoctorProfile({
            uid: user.uid,
            doctorId: DEMO_DOCTOR_ID,
            firstName: "Priya",
            lastName: "Sharma",
            specialization: "Endocrinology",
            licenseNumber: "LIC001",
            email: user.email || "",
            phone: "9876543211",
          });
        } catch (err) {
          console.log("Doctor profile creation error:", err);
        }

        // Set user profile with onboarded flag
        await setUserProfile(user.uid, {
          email: user.email || "",
          firstName: "Priya",
          lastName: "Sharma",
          dob: "1965-05-20",
          phone: "9876543211",
          displayName: user.displayName || credentials.name,
          photoURL: user.photoURL || undefined,
          role: "doctor",
          onboarded: true,
        });
      }

      toast.success(`Logged in as ${credentials.role}`);
      navigate("/");
    } catch (error: any) {
      console.error("Demo login error:", error);
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        toast.error(
          "Demo accounts not found. Please run the demo seeding script first. See README.md for instructions."
        );
      } else {
        toast.error(error.message || "Failed to login to demo account");
      }
    } finally {
      setLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold">Try GlucoCare Demo</CardTitle>
            <p className="text-lg text-muted-foreground mt-2">
              Experience the platform with pre-configured demo accounts
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <LogIn className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Click on a demo account below to sign in instantly and explore the full functionality.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Demo Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDemoLogin("patient")}
                className="cursor-pointer"
              >
                <Card className="border-2 border-transparent hover:border-primary/50 transition-all h-full">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary/10 rounded-lg">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">{DEMO_CREDENTIALS.patient.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {DEMO_CREDENTIALS.patient.role}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        {DEMO_CREDENTIALS.patient.description}
                      </p>
                      <div className="space-y-2 pt-2">
                        <div className="text-xs bg-muted p-2 rounded break-all">
                          <span className="font-mono text-muted-foreground">
                            {DEMO_CREDENTIALS.patient.email}
                          </span>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        disabled={loading && selectedRole === "patient"}
                      >
                        {loading && selectedRole === "patient" ? "Signing in..." : "Sign in as Patient"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Doctor Demo Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDemoLogin("doctor")}
                className="cursor-pointer"
              >
                <Card className="border-2 border-transparent hover:border-success/50 transition-all h-full">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-success/10 rounded-lg">
                        <Stethoscope className="w-6 h-6 text-success" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">{DEMO_CREDENTIALS.doctor.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {DEMO_CREDENTIALS.doctor.role}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        {DEMO_CREDENTIALS.doctor.description}
                      </p>
                      <div className="space-y-2 pt-2">
                        <div className="text-xs bg-muted p-2 rounded break-all">
                          <span className="font-mono text-muted-foreground">
                            {DEMO_CREDENTIALS.doctor.email}
                          </span>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-success hover:bg-success/90"
                        disabled={loading && selectedRole === "doctor"}
                      >
                        {loading && selectedRole === "doctor" ? "Signing in..." : "Sign in as Doctor"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Not a recruiter?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold"
                  onClick={() => navigate("/signup")}
                >
                  Create your own account
                </Button>
              </p>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                💡 <strong>Note:</strong> These are demo accounts for recruitment purposes only. All data is sample data.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}