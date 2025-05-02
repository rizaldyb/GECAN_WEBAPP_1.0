import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import UserVerification from "@/pages/admin/user-verification";
import OfferApproval from "@/pages/admin/offer-approval";
import EnquiryReview from "@/pages/admin/enquiry-review";
import MatchFacilitation from "@/pages/admin/match-facilitation";
import Marketplace from "@/pages/marketplace";
import Toolkits from "@/pages/toolkits";
import DDCenter from "@/pages/dd-center";
import { useAuth } from "./hooks/use-auth";

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Main routes - require authentication */}
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/marketplace" component={Marketplace} />
      <ProtectedRoute path="/toolkits" component={Toolkits} />
      <ProtectedRoute path="/dd-center" component={DDCenter} />
      
      {/* Admin routes - only accessible by admins */}
      {user?.role === "GECAN_Admin" && (
        <>
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          <ProtectedRoute path="/admin/user-verification" component={UserVerification} />
          <ProtectedRoute path="/admin/offer-approval" component={OfferApproval} />
          <ProtectedRoute path="/admin/enquiry-review" component={EnquiryReview} />
          <ProtectedRoute path="/admin/match-facilitation" component={MatchFacilitation} />
        </>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
