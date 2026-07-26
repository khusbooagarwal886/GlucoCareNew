import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { initializeDemoAccounts } from "@/lib/demo-setup";

// Initialize demo accounts if in demo mode
initializeDemoAccounts().catch(console.error);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
