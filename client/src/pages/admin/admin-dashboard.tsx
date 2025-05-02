import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/layouts/app-layout";
import StatCard from "@/components/dashboard/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import UserVerification from "./user-verification";
import OfferApproval from "./offer-approval";
import EnquiryReview from "./enquiry-review";
import MatchFacilitation from "./match-facilitation";
import Breadcrumbs from "@/components/common/breadcrumbs";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("userVerification");
  
  // Fetch stats for the dashboard
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    staleTime: 60000, // 1 minute
  });
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update the URL based on the active tab
    switch(value) {
      case "userVerification":
        setLocation("/admin/user-verification");
        break;
      case "offerApproval":
        setLocation("/admin/offer-approval");
        break;
      case "enquiryReview":
        setLocation("/admin/enquiry-review");
        break;
      case "matchFacilitation":
        setLocation("/admin/match-facilitation");
        break;
      default:
        setLocation("/admin");
    }
  };
  
  // Determine the current tab based on location
  const getCurrentTabFromLocation = () => {
    if (location.includes("user-verification")) return "userVerification";
    if (location.includes("offer-approval")) return "offerApproval";
    if (location.includes("enquiry-review")) return "enquiryReview";
    if (location.includes("match-facilitation")) return "matchFacilitation";
    return "userVerification"; // Default
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Admin", href: "/admin" },
            location.includes("user-verification") ? { label: "User Verification" } :
            location.includes("offer-approval") ? { label: "Offer Approval" } :
            location.includes("enquiry-review") ? { label: "Enquiry Review" } :
            location.includes("match-facilitation") ? { label: "Match Facilitation" } :
            { label: "Overview" }
          ]}
          backButton={false}
          className="mb-4"
        />
          
        <div className="mb-8">
          <h1 className="font-montserrat font-bold text-2xl text-neutral-800 mb-1">Admin Dashboard</h1>
          <p className="text-neutral-500">Manage users, offerings, and platform activity</p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Pending Verifications" 
            value={statsLoading ? "-" : stats?.pendingVerifications.toString() || "0"} 
            change="14% from last week" 
            icon="ri-user-follow-line" 
            iconBgColor="bg-red-50" 
            iconColor="text-red-500" 
            isPositive={false}
          />
          
          <StatCard 
            title="Active Offers" 
            value={statsLoading ? "-" : stats?.activeOffers.toString() || "0"} 
            change="8% from last week" 
            icon="ri-exchange-box-line" 
            iconBgColor="bg-green-50" 
            iconColor="text-green-500" 
            isPositive={true}
          />
          
          <StatCard 
            title="Active Enquiries" 
            value={statsLoading ? "-" : stats?.activeEnquiries.toString() || "0"} 
            change="4% from last week" 
            icon="ri-search-line" 
            iconBgColor="bg-blue-50" 
            iconColor="text-blue-500" 
            isPositive={true}
          />
          
          <StatCard 
            title="Recent Matches" 
            value={statsLoading ? "-" : stats?.recentMatches.toString() || "0"} 
            change="15% from last week" 
            icon="ri-link-m" 
            iconBgColor="bg-accent/20" 
            iconColor="text-accent" 
            isPositive={true}
          />
        </div>
        
        {/* Admin Tabs */}
        <div className="mb-6 border-b border-neutral-200">
          <Tabs 
            value={getCurrentTabFromLocation()} 
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="flex mb-0 bg-transparent h-auto">
              <TabsTrigger 
                value="userVerification"
                className="pb-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent data-[state=active]:text-primary data-[state=active]:font-medium text-neutral-400 hover:text-neutral-600"
              >
                User Verification
              </TabsTrigger>
              <TabsTrigger 
                value="offerApproval"
                className="pb-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent data-[state=active]:text-primary data-[state=active]:font-medium text-neutral-400 hover:text-neutral-600"
              >
                Offer Approval
              </TabsTrigger>
              <TabsTrigger 
                value="enquiryReview"
                className="pb-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent data-[state=active]:text-primary data-[state=active]:font-medium text-neutral-400 hover:text-neutral-600"
              >
                Enquiry Review
              </TabsTrigger>
              <TabsTrigger 
                value="matchFacilitation"
                className="pb-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent data-[state=active]:text-primary data-[state=active]:font-medium text-neutral-400 hover:text-neutral-600"
              >
                Match Facilitation
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Content based on location */}
        {location === "/admin" || location === "/admin/user-verification" ? (
          <UserVerification />
        ) : location === "/admin/offer-approval" ? (
          <OfferApproval />
        ) : location === "/admin/enquiry-review" ? (
          <EnquiryReview />
        ) : location === "/admin/match-facilitation" ? (
          <MatchFacilitation />
        ) : (
          <UserVerification />
        )}
      </div>
    </AppLayout>
  );
}
