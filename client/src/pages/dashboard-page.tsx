import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import StatCard from "@/components/dashboard/stat-card";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import Breadcrumbs from "@/components/common/breadcrumbs";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // If user is admin, show admin dashboard
  if (user?.role === "GECAN_Admin") {
    return <AdminDashboard />;
  }
  
  // For pending verification users
  if (user?.role === "Pending_Verification") {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            items={[
              { label: "Dashboard", href: "/" }
            ]}
            backButton={false}
            className="mb-4"
          />
          
          <div className="mb-8">
            <h1 className="font-montserrat font-bold text-2xl text-neutral-800 mb-2">Account Pending Verification</h1>
            <p className="text-neutral-500">Thank you for your application to join GECAN.</p>
          </div>
          
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="mr-4 text-yellow-600">
                  <i className="ri-time-line text-3xl"></i>
                </div>
                <div>
                  <h2 className="font-montserrat font-semibold text-lg mb-2">Your Application is Being Reviewed</h2>
                  <p className="text-neutral-700 mb-4">
                    Our administrators are currently reviewing your application. This process typically takes 1-3 business days.
                  </p>
                  <div className="bg-white p-4 rounded-md border border-yellow-200 mb-4">
                    <h3 className="font-medium mb-2">Next Steps:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>GECAN administrators will review your initial application</li>
                      <li>You may be contacted for additional information or documentation</li>
                      <li>Upon preliminary approval, you'll be asked to complete full KYC/CDD verification</li>
                      <li>Once fully verified, you'll gain access to all GECAN platform features</li>
                    </ol>
                  </div>
                  <p className="text-sm text-neutral-500">
                    If you need to provide additional information or have any questions, please contact <a href="mailto:verification@gecan.network" className="text-primary hover:underline">verification@gecan.network</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-primary mb-4">
                  <i className="ri-shield-check-line text-3xl"></i>
                </div>
                <h3 className="font-montserrat font-semibold text-lg mb-2">Why Verification Matters</h3>
                <p className="text-sm text-neutral-600">
                  GECAN's strict verification process ensures that all market participants are legitimate, qualified, and trustworthy. This creates a secure ecosystem for high-value transactions.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-primary mb-4">
                  <i className="ri-file-list-3-line text-3xl"></i>
                </div>
                <h3 className="font-montserrat font-semibold text-lg mb-2">Required Documents</h3>
                <p className="text-sm text-neutral-600">
                  Prepare the following for full verification: government-issued ID, proof of address, business registration, bank reference letter, and professional references.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-primary mb-4">
                  <i className="ri-question-line text-3xl"></i>
                </div>
                <h3 className="font-montserrat font-semibold text-lg mb-2">Frequently Asked Questions</h3>
                <ul className="text-sm text-neutral-600 space-y-2">
                  <li><span className="font-medium">How long does verification take?</span> Typically 1-3 business days for initial review.</li>
                  <li><span className="font-medium">Can I update my information?</span> Yes, contact our verification team.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // For vetted members
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Dashboard", href: "/" }
          ]}
          backButton={false}
          className="mb-4"
        />
        
        <div className="mb-8">
          <h1 className="font-montserrat font-bold text-2xl text-neutral-800 mb-1">Dashboard</h1>
          <p className="text-neutral-500">Welcome back, {user?.firstName}. View your activity and market opportunities.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Active Listings" 
            value={user?.memberType?.includes("Seller") ? "2" : "0"} 
            change="No change" 
            icon="ri-exchange-box-line" 
            iconBgColor="bg-green-50" 
            iconColor="text-green-500" 
            isPositive={true}
          />
          
          <StatCard 
            title="Active Enquiries" 
            value={user?.memberType?.includes("Buyer") ? "3" : "0"} 
            change="+1 from last week" 
            icon="ri-search-line" 
            iconBgColor="bg-blue-50" 
            iconColor="text-blue-500" 
            isPositive={true}
          />
          
          <StatCard 
            title="Potential Matches" 
            value="5" 
            change="+2 new matches" 
            icon="ri-link-m" 
            iconBgColor="bg-accent/20" 
            iconColor="text-accent" 
            isPositive={true}
          />
          
          <StatCard 
            title="Verification Level" 
            value={user?.verificationLevel || "L1"} 
            change="Standard verification" 
            icon="ri-shield-check-line" 
            iconBgColor="bg-primary/10" 
            iconColor="text-primary" 
            isPositive={false}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                <TabsTrigger value="matches">Potential Matches</TabsTrigger>
                <TabsTrigger value="opportunities">Market Opportunities</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="animate-fadeIn">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <i className="ri-login-circle-line"></i>
                        </div>
                        <div>
                          <p className="font-medium">Account Login</p>
                          <p className="text-sm text-neutral-500">You logged in to your account</p>
                          <p className="text-xs text-neutral-400 mt-1">Just now</p>
                        </div>
                      </div>
                      
                      {user?.memberType?.includes("Seller") && (
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                            <i className="ri-exchange-box-line"></i>
                          </div>
                          <div>
                            <p className="font-medium">Offer Status Update</p>
                            <p className="text-sm text-neutral-500">Your Gold offer (GOLD-20230527-123456) was viewed by 3 potential buyers</p>
                            <p className="text-xs text-neutral-400 mt-1">2 hours ago</p>
                          </div>
                        </div>
                      )}
                      
                      {user?.memberType?.includes("Buyer") && (
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                            <i className="ri-mail-open-line"></i>
                          </div>
                          <div>
                            <p className="font-medium">New Match Notification</p>
                            <p className="text-sm text-neutral-500">GECAN admin has matched your petroleum enquiry with a potential seller</p>
                            <p className="text-xs text-neutral-400 mt-1">1 day ago</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3">
                          <i className="ri-file-text-line"></i>
                        </div>
                        <div>
                          <p className="font-medium">Document Downloaded</p>
                          <p className="text-sm text-neutral-500">You downloaded the NCNDA template for Gold transactions</p>
                          <p className="text-xs text-neutral-400 mt-1">2 days ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                      <Button variant="outline" size="sm">View All Activity</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="matches" className="animate-fadeIn">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <i className="ri-link-m text-3xl text-primary"></i>
                      </div>
                      <h3 className="font-montserrat font-medium text-lg mb-2">Matches Facilitated by GECAN</h3>
                      <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
                        GECAN administrators review offers and enquiries to identify potential matches while maintaining confidentiality.
                      </p>
                      <Button asChild>
                        <Link to="/marketplace">Go to Marketplace</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="opportunities" className="animate-fadeIn">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <i className="ri-line-chart-line text-3xl text-blue-600"></i>
                      </div>
                      <h3 className="font-montserrat font-medium text-lg mb-2">Market Opportunities</h3>
                      <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
                        Explore current active offers and enquiries that may match your business interests.
                      </p>
                      <Button asChild>
                        <Link to="/marketplace">Explore Marketplace</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h3 className="font-montserrat font-semibold text-lg mb-4">Profile Overview</h3>
                
                <div className="mb-6 flex items-center">
                  <div className="h-14 w-14 bg-primary text-white font-montserrat font-bold text-xl flex items-center justify-center rounded-full mr-4">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-lg">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-neutral-500">{user?.companyName}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-500">Member ID:</span>
                    <span className="text-sm font-medium">{user?.gecanMemberId || "Pending"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-500">Member Type:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {user?.memberType?.map((type, index) => (
                        <span key={index} className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-500">Status:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      {user?.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-500">Account Created:</span>
                    <span className="text-sm">{new Date(user?.createdAt || "").toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-neutral-100">
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {user?.memberType?.includes("Seller") && (
                      <Button variant="outline" size="sm" className="h-auto py-2">
                        <i className="ri-add-line mr-1"></i>
                        New Offer
                      </Button>
                    )}
                    
                    {user?.memberType?.includes("Buyer") && (
                      <Button variant="outline" size="sm" className="h-auto py-2">
                        <i className="ri-add-line mr-1"></i>
                        New Enquiry
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" className="h-auto py-2">
                      <i className="ri-search-line mr-1"></i>
                      Search Market
                    </Button>
                    
                    <Button variant="outline" size="sm" className="h-auto py-2">
                      <i className="ri-file-list-3-line mr-1"></i>
                      Documents
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="font-montserrat font-semibold text-lg mb-4">Market Insights</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Gold Offers</span>
                      <span className="text-xs text-neutral-500">12 active</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full">
                      <div className="h-2 bg-yellow-400 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Petroleum</span>
                      <span className="text-xs text-neutral-500">8 active</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Crypto</span>
                      <span className="text-xs text-neutral-500">15 active</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full">
                      <div className="h-2 bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">SBLCs</span>
                      <span className="text-xs text-neutral-500">5 active</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-neutral-100 text-center">
                  <Button variant="link" size="sm" asChild>
                    <Link to="/marketplace">View Full Market Analysis</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
