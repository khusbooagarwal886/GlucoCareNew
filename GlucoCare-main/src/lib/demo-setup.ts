/**
 * Demo Setup - Auto-seeds demo accounts if they don't exist
 * Run once on app initialization
 */

import { seedDemoData } from "./demo-data";

let demoSetupAttempted = false;

export async function initializeDemoAccounts() {
  // Only attempt once per app session
  if (demoSetupAttempted) {
    return;
  }
  
  demoSetupAttempted = true;

  // Check if we're in development or have a demo flag
  const isDemoEnvironment = 
    import.meta.env.DEV || 
    import.meta.env.VITE_ENABLE_DEMO === 'true' ||
    sessionStorage.getItem('glucocare_demo_mode') === 'true';

  if (!isDemoEnvironment) {
    return;
  }

  try {
    // Small delay to ensure Firebase is initialized
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("🚀 Initializing demo accounts...");
    await seedDemoData();
  } catch (error: any) {
    // Don't fail the app if demo setup fails
    if (error.message?.includes("Demo data already seeded")) {
      console.log("✅ Demo accounts already exist");
    } else {
      console.warn("⚠️ Demo setup skipped (demo accounts may need manual setup):", error.message);
    }
  }
}
