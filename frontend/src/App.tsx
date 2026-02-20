import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { PageViewTracker } from "./components/PageViewTracker";
import LoadingSpinner from "./components/LoadingSpinner";

const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Profile = lazy(() => import("./pages/Profile"));
const NewProject = lazy(() => import("./pages/NewProject"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const ProjectChat = lazy(() => import("./pages/ProjectChat"));
const ChatInbox = lazy(() => import("./pages/ChatInbox"));
const MyProjects = lazy(() => import("./pages/MyProjects"));
const AvailableProjects = lazy(() => import("./pages/AvailableProjects"));
const MyQuotes = lazy(() => import("./pages/MyQuotes"));
const MyReviews = lazy(() => import("./pages/MyReviews"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const Balance = lazy(() => import("./pages/Balance"));
const Materials = lazy(() => import("./pages/Materials"));
const Settings = lazy(() => import("./pages/Settings"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AuthError = lazy(() => import("./pages/AuthError"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUserManagement = lazy(() => import("./pages/AdminUserManagement"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <PageViewTracker />
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <LoadingSpinner />
            </div>
          }>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/error" element={<AuthError />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUserManagement /></ProtectedAdminRoute>} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;