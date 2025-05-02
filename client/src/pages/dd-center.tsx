import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/layouts/app-layout";
import Breadcrumbs from "@/components/common/breadcrumbs";
import { 
  ArrowLeft, 
  Upload, 
  ClipboardCheck, 
  Shield, 
  Search, 
  AlertTriangle, 
  Check, 
  X, 
  AlertCircle,
  FileText,
  Clock,
  User,
  PieChart,
  Globe,
  Building,
  Calendar,
  DollarSign,
  CheckCircle2,
  FileCheck,
  CloudUpload,
  ShieldCheck,
  Fingerprint
} from "lucide-react";
// Import from shared schema
import { insertDueDiligenceRecordSchema } from "@shared/schema";
import type { User as UserType } from "@shared/schema";

// Define an extended interface for due diligence records with our needed properties
interface DueDiligenceRecord {
  id: number;
  userId: number;
  status: string;
  verificationStatus?: string;
  kycStatus?: string;
  riskCategory?: string;
  documents: string[];
  notes?: string;
  assignedAdminId?: number;
  approvedAt?: Date;
  rejectedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  companyInfo?: any;
}

// Define our custom insert record interface
interface InsertDueDiligenceRecord {
  userId: number;
  status?: string;
  kycStatus?: string;
  verificationStatus?: string;
  riskCategory?: string;
  documents: string[];
  notes?: string;
  companyInfo?: any;
}

// Define schema for KYC form
const kycFormSchema = z.object({
  companyName: z.string().min(2, "Company name is required").max(100),
  registrationNumber: z.string().min(2, "Registration number is required"),
  taxId: z.string().min(2, "Tax ID is required"),
  country: z.string().min(2, "Country is required"),
  address: z.string().min(5, "Full address is required"),
  website: z.string().url("Must be a valid URL").or(z.string().length(0)),
  incorporationDate: z.string().min(2, "Date of incorporation is required"),
  businessType: z.string().min(2, "Business type is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Must be a valid email address"),
  contactPhone: z.string().min(5, "Contact phone is required"),
  authorizedCapital: z.string().min(1, "Authorized capital is required"),
  tradingHistory: z.string().min(2, "Trading history is required"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
});

export default function DDCenter() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [documentModalOpen, setDocumentModalOpen] = useState(false);

  // Fetch user's DD record if exists
  const { data: ddRecord, isLoading: ddRecordLoading } = useQuery<DueDiligenceRecord>({
    queryKey: ["/api/due-diligence/record"],
    enabled: !!user
  });

  // Fetch all users for admin
  const { data: users, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "GECAN_Admin"
  });

  // KYC Form
  const kycForm = useForm<z.infer<typeof kycFormSchema>>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      companyName: "",
      registrationNumber: "",
      taxId: "",
      country: "",
      address: "",
      website: "",
      incorporationDate: "",
      businessType: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      authorizedCapital: "",
      tradingHistory: "",
      acceptTerms: false
    }
  });

  const onKycSubmit = async (data: z.infer<typeof kycFormSchema>) => {
    try {
      // Create a new DD record
      const ddData: InsertDueDiligenceRecord = {
        userId: user?.id as number,
        kycStatus: "Submitted",
        companyInfo: data,
        verificationStatus: "Pending",
        riskCategory: "Medium", // Default risk category
        documents: [],
        notes: "KYC form submitted, pending review"
      };

      await apiRequest("POST", "/api/due-diligence/submit", ddData);
      
      toast({
        title: "KYC Submitted Successfully",
        description: "Your KYC information has been submitted for review",
      });
      
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/due-diligence/record"] });
    } catch (error: any) {
      toast({
        title: "Error Submitting KYC",
        description: error.message || "Failed to submit KYC form",
        variant: "destructive",
      });
    }
  };

  // Get status badge based on verification status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-transparent flex items-center">
            <Check className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-transparent flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-transparent flex items-center">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "incomplete":
        return (
          <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-transparent flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Incomplete
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-transparent flex items-center">
            {status}
          </Badge>
        );
    }
  };

  // Get risk category badge
  const getRiskBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case "low":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-transparent">
            Low Risk
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-transparent">
            Medium Risk
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-transparent">
            High Risk
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-transparent">
            {category}
          </Badge>
        );
    }
  };

  // Required documents for KYC/AML
  const requiredDocuments = [
    { 
      id: "certificate", 
      name: "Certificate of Incorporation", 
      description: "Official document confirming company registration",
      required: true,
      icon: <Building className="h-6 w-6 text-blue-600" />
    },
    { 
      id: "passport", 
      name: "Passport/ID of Directors", 
      description: "Government-issued ID for all company directors",
      required: true,
      icon: <User className="h-6 w-6 text-amber-600" />
    },
    { 
      id: "business-license", 
      name: "Business License", 
      description: "Valid business operation license",
      required: true,
      icon: <FileCheck className="h-6 w-6 text-green-600" />
    },
    { 
      id: "tax-certificate", 
      name: "Tax Registration Certificate", 
      description: "Proof of tax registration with authorities",
      required: true,
      icon: <CheckCircle2 className="h-6 w-6 text-purple-600" />
    },
    { 
      id: "bank-reference", 
      name: "Bank Reference Letter", 
      description: "Reference letter from your company's bank",
      required: true,
      icon: <DollarSign className="h-6 w-6 text-green-600" />
    },
    { 
      id: "trade-references", 
      name: "Trade References", 
      description: "References from trading partners (optional)",
      required: false,
      icon: <Globe className="h-6 w-6 text-blue-600" />
    }
  ];

  // Render DD overview for users
  const renderUserOverview = () => {
    if (ddRecordLoading) {
      return (
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
              <div className="h-4 bg-neutral-100 rounded w-full"></div>
              <div className="h-4 bg-neutral-100 rounded w-full"></div>
              <div className="h-10 bg-neutral-200 rounded w-1/4 mt-4"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!ddRecord) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Due Diligence</CardTitle>
            <CardDescription>
              To start trading on the GECAN platform, you need to complete the KYC and AML verification process.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <ClipboardCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Step 1: Submit KYC Information</h3>
                  <p className="text-neutral-600 mt-1">
                    Complete the KYC form with your company details and verification information.
                  </p>
                  <Button 
                    className="mt-3" 
                    onClick={() => setActiveSection("kyc")}
                  >
                    Start KYC Process
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-neutral-100 p-3 rounded-full">
                  <Upload className="h-6 w-6 text-neutral-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Step 2: Upload Required Documents</h3>
                  <p className="text-neutral-600 mt-1">
                    Submit all necessary identification and business documents for verification.
                  </p>
                  <Button 
                    className="mt-3" 
                    variant="outline"
                    disabled
                  >
                    Upload Documents
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-neutral-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-neutral-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Step 3: Verification</h3>
                  <p className="text-neutral-600 mt-1">
                    Our team will verify your information and you'll be notified when approved.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // User has already submitted DD record
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <div>
              <CardTitle>Due Diligence Status</CardTitle>
              <CardDescription>
                Current verification status and next steps
              </CardDescription>
            </div>
            {ddRecord.verificationStatus ? getStatusBadge(ddRecord.verificationStatus) : getStatusBadge("Pending")}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="font-medium text-neutral-500 text-sm mb-1">KYC Status</div>
                <div className="flex items-center">
                  {ddRecord.kycStatus ? getStatusBadge(ddRecord.kycStatus) : getStatusBadge("Pending")}
                </div>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="font-medium text-neutral-500 text-sm mb-1">Risk Assessment</div>
                <div>
                  {ddRecord.riskCategory ? getRiskBadge(ddRecord.riskCategory) : getRiskBadge("Medium")}
                </div>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="font-medium text-neutral-500 text-sm mb-1">Documents</div>
                <div>
                  {ddRecord.documents.length} of {requiredDocuments.filter(d => d.required).length} required documents uploaded
                </div>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="font-medium text-neutral-500 text-sm mb-1">Last Updated</div>
                <div>
                  {new Date(ddRecord.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {ddRecord.verificationStatus === "Pending" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Verification in Progress</h4>
                  <p className="text-amber-700 text-sm mt-0.5">
                    Your information is being reviewed by our team. This process typically takes 2-3 business days.
                  </p>
                </div>
              </div>
            )}

            {ddRecord.verificationStatus === "Rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Verification Rejected</h4>
                  <p className="text-red-700 text-sm mt-0.5">
                    {ddRecord.notes || "Your verification was rejected. Please contact customer support for more information."}
                  </p>
                  <Button variant="destructive" className="mt-3">
                    Resubmit Information
                  </Button>
                </div>
              </div>
            )}

            {ddRecord.verificationStatus === "Approved" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Verification Complete</h4>
                  <p className="text-green-700 text-sm mt-0.5">
                    Your account is fully verified. You now have full access to all GECAN platform features.
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3">Required Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredDocuments.map(doc => {
                  const isUploaded = ddRecord.documents.includes(doc.id);
                  return (
                    <Card key={doc.id} className="overflow-hidden">
                      <div className={`p-4 flex items-start space-x-3 ${isUploaded ? 'border-l-4 border-green-500' : doc.required ? 'border-l-4 border-amber-500' : ''}`}>
                        <div className="mt-1">
                          {doc.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {doc.name}
                            {doc.required ? (
                              <span className="text-red-500 ml-1">*</span>
                            ) : (
                              <span className="text-neutral-400 text-xs ml-2">(Optional)</span>
                            )}
                          </h4>
                          <p className="text-neutral-500 text-sm mt-0.5">{doc.description}</p>
                          
                          <div className="mt-2 flex items-center">
                            {isUploaded ? (
                              <>
                                <Check className="h-4 w-4 text-green-500 mr-1.5" />
                                <span className="text-green-600 text-sm">Uploaded</span>
                                <Button variant="ghost" size="sm" className="ml-auto">
                                  Replace
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline">
                                <Upload className="h-3.5 w-3.5 mr-1.5" />
                                Upload
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Admin section for reviewing DD records
  const renderAdminSection = () => {
    if (usersLoading) {
      return (
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
              <div className="h-4 bg-neutral-100 rounded w-full"></div>
              <div className="h-4 bg-neutral-100 rounded w-full"></div>
              <div className="h-10 bg-neutral-200 rounded w-1/4 mt-4"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!users || users.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Due Diligence Administration</CardTitle>
            <CardDescription>No users have submitted KYC information yet</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-neutral-50 p-6 rounded-lg text-center">
              <FileText className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No Submissions Yet</h3>
              <p className="text-neutral-500">
                When users submit their KYC information and documents, they will appear here for review.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Display users with their DD status for admin review
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <div>
              <CardTitle>Due Diligence Administration</CardTitle>
              <CardDescription>
                Review and manage user KYC/AML verifications
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-1.5" />
                Search
              </Button>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b">
                  <th className="text-left font-medium text-neutral-500 text-sm py-3 px-4">User</th>
                  <th className="text-left font-medium text-neutral-500 text-sm py-3 px-4">Company</th>
                  <th className="text-left font-medium text-neutral-500 text-sm py-3 px-4">KYC Status</th>
                  <th className="text-left font-medium text-neutral-500 text-sm py-3 px-4">Risk Level</th>
                  <th className="text-left font-medium text-neutral-500 text-sm py-3 px-4">Submitted</th>
                  <th className="text-left font-medium text-neutral-500 text-sm py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className={`border-b ${index % 2 ? 'bg-neutral-50/50' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-neutral-500 text-xs">{user.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{user.companyName || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(user.id % 3 === 0 ? 'Pending' : user.id % 3 === 1 ? 'Approved' : 'Rejected')}
                    </td>
                    <td className="py-3 px-4">
                      {getRiskBadge(user.id % 3 === 0 ? 'Medium' : user.id % 3 === 1 ? 'Low' : 'High')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-neutral-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Review</Button>
                        <Button size="sm" variant="outline" className="text-green-600">Approve</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <div className="text-sm text-neutral-500">
            Page 1 of 1
          </div>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </CardFooter>
      </Card>
    );
  };

  // KYC Form for users
  const renderKycForm = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Information Form</CardTitle>
          <CardDescription>
            Please provide accurate information about your company for verification purposes.
            All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...kycForm}>
            <form onSubmit={kycForm.handleSubmit(onKycSubmit)} className="space-y-6">
              <div className="bg-neutral-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-primary" />
                  Company Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={kycForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Legal registered name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Company registration number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID/VAT Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Tax identification number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of Registration *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <SelectItem value="ca">Canada</SelectItem>
                            <SelectItem value="au">Australia</SelectItem>
                            <SelectItem value="sg">Singapore</SelectItem>
                            <SelectItem value="ch">Switzerland</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Registered Business Address *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full registered address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.yourcompany.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="incorporationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Incorporation *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="trading">Trading Company</SelectItem>
                            <SelectItem value="broker">Broker/Intermediary</SelectItem>
                            <SelectItem value="refinery">Refinery</SelectItem>
                            <SelectItem value="mining">Mining Company</SelectItem>
                            <SelectItem value="financial">Financial Institution</SelectItem>
                            <SelectItem value="logistics">Logistics Provider</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Primary Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={kycForm.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person's Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="business@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (123) 456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-primary" />
                  Business Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={kycForm.control}
                    name="authorizedCapital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authorized Capital *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. $1,000,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={kycForm.control}
                    name="tradingHistory"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Trading History/Experience *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe your company's experience in commodity trading" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={kycForm.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Accept Terms and Conditions *</FormLabel>
                      <FormDescription>
                        I certify that all information provided is accurate and complete. I understand that providing false information may result in rejection of my application and/or termination of my membership.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveSection("overview")}>
                  Back to Overview
                </Button>
                <Button type="submit">Submit KYC Information</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  // Render the appropriate content based on active section
  const renderContent = () => {
    // Admin section
    if (user?.role === "GECAN_Admin") {
      return renderAdminSection();
    }
    
    // User sections
    switch (activeSection) {
      case "kyc":
        return renderKycForm();
      case "overview":
      default:
        return renderUserOverview();
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 animate-fadeIn">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "DD Center", href: "/dd-center" },
            activeSection === "overview" ? { label: "Overview" } :
            activeSection === "kyc" ? { label: "KYC Information" } :
            activeSection === "documents" ? { label: "Documents" } :
            activeSection === "admin" ? { label: "Administration" } :
            { label: "Verification Status" }
          ]}
          backButton={false}
        />
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-2">
            <div>
              <h1 className="font-montserrat font-bold text-2xl text-neutral-800">Due Diligence Center</h1>
              <p className="text-neutral-500">Complete verification requirements to start trading on GECAN</p>
            </div>
            
            <Button 
              variant="outline"
              size="sm"
              className="font-medium w-fit"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> 
                Back to Dashboard
              </Link>
            </Button>
          </div>
          
          {/* Security Notice */}
          <div className="mt-6 p-4 border border-blue-100 bg-blue-50 rounded-lg flex items-start space-x-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Secure Verification Process</h3>
              <p className="text-blue-700 text-sm mt-0.5">
                All information and documents submitted are encrypted and securely stored. GECAN adheres to strict privacy policies and global data protection regulations.
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="mb-6">
          {renderContent()}
        </div>
        
        {/* Help Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Need Assistance?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <CloudUpload className="h-8 w-8 text-primary mb-3 mt-2" />
                <h3 className="font-medium">Document Requirements</h3>
                <p className="text-neutral-500 text-sm mt-1">
                  View detailed requirements for each document needed for verification.
                </p>
                <Button variant="link" className="mt-2">View Requirements</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Fingerprint className="h-8 w-8 text-primary mb-3 mt-2" />
                <h3 className="font-medium">Verification Process</h3>
                <p className="text-neutral-500 text-sm mt-1">
                  Learn about our verification process, timelines, and what to expect.
                </p>
                <Button variant="link" className="mt-2">Learn More</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <AlertCircle className="h-8 w-8 text-primary mb-3 mt-2" />
                <h3 className="font-medium">Contact Support</h3>
                <p className="text-neutral-500 text-sm mt-1">
                  Need help with your verification? Contact our support team.
                </p>
                <Button variant="link" className="mt-2">Get Help</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}