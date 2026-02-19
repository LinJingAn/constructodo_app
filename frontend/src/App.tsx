import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import Profile from "./pages/Profile";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectChat from "./pages/ProjectChat";
import ChatInbox from "./pages/ChatInbox";
import MyProjects from "./pages/MyProjects";
import AvailableProjects from "./pages/AvailableProjects";
import MyQuotes from "./pages/MyQuotes";
import MyReviews from "./pages/MyReviews";
import TransactionHistory from "./pages/TransactionHistory";
import Balance from "./pages/Balance";
import Materials from "./pages/Materials";
import Settings from "./pages/Settings";
import AuthCallback from "./pages/AuthCallback";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthError from "./pages/AuthError";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/error" element={<AuthError />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/chat" element={<ProjectChat />} />
          <Route path="/chat" element={<ChatInbox />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/available-projects" element={<AvailableProjects />} />
          <Route path="/my-quotes" element={<MyQuotes />} />
          <Route path="/my-reviews" element={<MyReviews />} />
          <Route path="/transaction-history" element={<TransactionHistory />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/settings" element={<Settings />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;