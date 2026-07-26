/**
 * Demo Data Seeding Script
 * This script creates dummy patient and doctor profiles for demo/recruitment purposes
 * Run this once to seed the demo accounts in Firebase
 */

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { 
  createPatientProfile, 
  createDoctorProfile, 
  setUserProfile,
  linkPatientToDoctor 
} from "./roles";
import { auth, db } from "./firebase";
import { doc, setDoc, collection } from "firebase/firestore";
import type { PatientProfile, DoctorProfile, UserProfile } from "@/types/roles";

// Demo credentials (these are for recruitment demo only)
export const DEMO_ACCOUNTS = {
  patient: {
    email: "demo.patient@glucocare.com",
    password: "DemoPatient@123",
    displayName: "Demo Patient",
  },
  doctor: {
    email: "demo.doctor@glucocare.com",
    password: "DemoDoctor@123",
    displayName: "Demo Doctor",
  },
};

export async function seedDemoData() {
  console.log("🌱 Starting demo data seeding...");

  try {
    // Create demo patient
    console.log("📝 Creating demo patient account...");
    let patientUser;
    try {
      const patientResult = await createUserWithEmailAndPassword(
        auth,
        DEMO_ACCOUNTS.patient.email,
        DEMO_ACCOUNTS.patient.password
      );
      patientUser = patientResult.user;
      console.log("✅ Demo patient user created:", patientUser.uid);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        console.log("⏭️  Demo patient already exists, signing in...");
        const signInResult = await signInWithEmailAndPassword(
          auth,
          DEMO_ACCOUNTS.patient.email,
          DEMO_ACCOUNTS.patient.password
        );
        patientUser = signInResult.user;
      } else {
        throw error;
      }
    }

    // Create demo patient profile
    const patientProfile: PatientProfile = {
      uid: patientUser.uid,
      patientId: "DEMO001",
      firstName: "Ramesh",
      lastName: "Kumar",
      dob: "1956-03-15",
      phone: "9876543210",
      email: DEMO_ACCOUNTS.patient.email,
      createdAt: new Date(),
    };

    await createPatientProfile(patientProfile);
    console.log("✅ Demo patient profile created");

    // Create demo patient user profile
    const patientUserProfile: UserProfile = {
      uid: patientUser.uid,
      email: DEMO_ACCOUNTS.patient.email,
      firstName: "Ramesh",
      lastName: "Kumar",
      dob: "1956-03-15",
      phone: "9876543210",
      displayName: "Ramesh Kumar",
      role: "patient",
      onboarded: true,
      primaryPatientId: "DEMO001",
    };

    await setUserProfile(patientUser.uid, patientUserProfile);
    console.log("✅ Demo patient user profile created");

    // Create demo glucose readings
    console.log("📊 Creating demo glucose readings...");
    const glucoseReadings = generateDemoGlucoseReadings("DEMO001");
    const readingsRef = collection(db, "glucoseReadings");
    for (const reading of glucoseReadings) {
      await setDoc(doc(readingsRef), reading);
    }
    console.log(`✅ Created ${glucoseReadings.length} demo glucose readings`);

    // Create demo vital signs
    console.log("💓 Creating demo vital signs...");
    const vitalReadings = generateDemoVitalReadings("DEMO001");
    const vitalsRef = collection(db, "vitalReadings");
    for (const vital of vitalReadings) {
      await setDoc(doc(vitalsRef), vital);
    }
    console.log(`✅ Created ${vitalReadings.length} demo vital readings`);

    // Create demo alerts
    console.log("🔔 Creating demo alerts...");
    const alerts = generateDemoAlerts("DEMO001");
    const alertsRef = collection(db, "alerts");
    for (const alert of alerts) {
      await setDoc(doc(alertsRef), alert);
    }
    console.log(`✅ Created ${alerts.length} demo alerts`);

    // Create demo health insights
    console.log("💡 Creating demo health insights...");
    const insights = generateDemoHealthInsights("DEMO001");
    const insightsRef = collection(db, "healthInsights");
    for (const insight of insights) {
      await setDoc(doc(insightsRef), insight);
    }
    console.log(`✅ Created ${insights.length} demo health insights`);

    // Sign out patient
    await signOut(auth);

    // Create demo doctor
    console.log("📝 Creating demo doctor account...");
    let doctorUser;
    try {
      const doctorResult = await createUserWithEmailAndPassword(
        auth,
        DEMO_ACCOUNTS.doctor.email,
        DEMO_ACCOUNTS.doctor.password
      );
      doctorUser = doctorResult.user;
      console.log("✅ Demo doctor user created:", doctorUser.uid);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        console.log("⏭️  Demo doctor already exists, signing in...");
        const signInResult = await signInWithEmailAndPassword(
          auth,
          DEMO_ACCOUNTS.doctor.email,
          DEMO_ACCOUNTS.doctor.password
        );
        doctorUser = signInResult.user;
      } else {
        throw error;
      }
    }

    // Create demo doctor profile
    const doctorProfile: DoctorProfile = {
      uid: doctorUser.uid,
      doctorId: "DEMO-DOC-001",
      firstName: "Priya",
      lastName: "Sharma",
      dob: "1975-07-20",
      phone: "9876511111",
      email: DEMO_ACCOUNTS.doctor.email,
      licenseNumber: "MCI-12345",
      createdAt: new Date(),
    };

    await createDoctorProfile(doctorProfile);
    console.log("✅ Demo doctor profile created");

    // Create demo doctor user profile
    const doctorUserProfile: UserProfile = {
      uid: doctorUser.uid,
      email: DEMO_ACCOUNTS.doctor.email,
      firstName: "Priya",
      lastName: "Sharma",
      dob: "1975-07-20",
      phone: "9876511111",
      displayName: "Dr. Priya Sharma",
      role: "doctor",
      onboarded: true,
      doctorId: "DEMO-DOC-001",
    };

    await setUserProfile(doctorUser.uid, doctorUserProfile);
    console.log("✅ Demo doctor user profile created");

    // Link patient to doctor
    await linkPatientToDoctor("DEMO001", doctorUser.uid);
    console.log("✅ Linked demo patient to demo doctor");

    // Sign out doctor
    await signOut(auth);

    console.log("\n✨ Demo data seeding completed successfully!");
    console.log("\n📋 Demo Account Credentials:");
    console.log(`\nPatient Account:`);
    console.log(`  Email: ${DEMO_ACCOUNTS.patient.email}`);
    console.log(`  Password: ${DEMO_ACCOUNTS.patient.password}`);
    console.log(`  Patient ID: DEMO001`);
    console.log(`\nDoctor Account:`);
    console.log(`  Email: ${DEMO_ACCOUNTS.doctor.email}`);
    console.log(`  Password: ${DEMO_ACCOUNTS.doctor.password}`);
    console.log(`  Doctor ID: DEMO-DOC-001`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
}

// Helper functions to generate demo data

function generateDemoGlucoseReadings(patientId: string) {
  const readings = [];
  const now = new Date();

  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Fasting reading (morning)
    readings.push({
      patientId,
      value: Math.floor(100 + Math.random() * 30),
      unit: "mg/dL",
      type: "fasting",
      mealContext: "before-breakfast",
      timestamp: new Date(date.setHours(7, 30, 0)).toISOString(),
      createdAt: new Date(),
    });

    // Post-breakfast
    readings.push({
      patientId,
      value: Math.floor(130 + Math.random() * 50),
      unit: "mg/dL",
      type: "post-meal",
      mealContext: "after-breakfast",
      timestamp: new Date(date.setHours(10, 0, 0)).toISOString(),
      createdAt: new Date(),
    });

    // Post-lunch
    readings.push({
      patientId,
      value: Math.floor(120 + Math.random() * 60),
      unit: "mg/dL",
      type: "post-meal",
      mealContext: "after-lunch",
      timestamp: new Date(date.setHours(14, 30, 0)).toISOString(),
      createdAt: new Date(),
    });

    // Bedtime
    readings.push({
      patientId,
      value: Math.floor(110 + Math.random() * 30),
      unit: "mg/dL",
      type: "bedtime",
      timestamp: new Date(date.setHours(22, 0, 0)).toISOString(),
      createdAt: new Date(),
    });
  }

  return readings;
}

function generateDemoVitalReadings(patientId: string) {
  const now = new Date();
  return [
    {
      patientId,
      type: "blood-pressure",
      value: { systolic: 128, diastolic: 82 },
      unit: "mmHg",
      timestamp: now.toISOString(),
      createdAt: now,
    },
    {
      patientId,
      type: "heart-rate",
      value: 72,
      unit: "bpm",
      timestamp: now.toISOString(),
      createdAt: now,
    },
    {
      patientId,
      type: "weight",
      value: 75,
      unit: "kg",
      timestamp: now.toISOString(),
      createdAt: now,
    },
  ];
}

function generateDemoAlerts(patientId: string) {
  const now = new Date();
  return [
    {
      patientId,
      type: "medication-reminder",
      severity: "info",
      title: "Medication Reminder",
      message: "Time to take your morning medication - Metformin 500mg",
      timestamp: now.toISOString(),
      isRead: false,
      isAcknowledged: false,
      createdAt: now,
    },
    {
      patientId,
      type: "glucose-high",
      severity: "warning",
      title: "Elevated Glucose Level",
      message: "Your post-lunch glucose reading of 175 mg/dL is slightly elevated. Consider a light walk.",
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
      isRead: false,
      isAcknowledged: false,
      createdAt: now,
    },
  ];
}

function generateDemoHealthInsights(patientId: string) {
  const now = new Date();
  return [
    {
      patientId,
      type: "trend",
      category: "glucose",
      title: "Improving Fasting Glucose",
      description:
        "Your fasting glucose levels have improved by 8% over the past month. Keep up the good work!",
      confidence: 0.92,
      actionItems: ["Continue current medication schedule", "Maintain evening walks"],
      timestamp: now.toISOString(),
      createdAt: now,
    },
    {
      patientId,
      type: "recommendation",
      category: "diet",
      title: "Reduce Evening Carbs",
      description:
        "Your post-dinner glucose spikes suggest reducing carbohydrate intake in the evening.",
      actionItems: ["Replace rice with roti", "Add more green vegetables"],
      timestamp: now.toISOString(),
      createdAt: now,
    },
  ];
}
