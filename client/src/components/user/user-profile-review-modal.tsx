import React, { useState } from "react";
import { User, DueDiligenceRecord } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface UserProfileReviewModalProps {
  userId: number;
  open: boolean;
  onClose: () => void;
}

export default function UserProfileReviewModal({ userId, open, onClose }: UserProfileReviewModalProps) {
  const { toast } = useToast();
  const [adminNotes, setAdminNotes] = useState("");
  const [verificationLevel, setVerificationLevel] = useState("L1");
  const [checklist, setChecklist] = useState({
    basicInfoComplete: false,
    emailVerified: true,
    businessRegistrationValid: false,
    kycDocumentsVerified: false,
    backgroundCheckComplete: false,
    referencesChecked: false
  });

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: open && !!userId,
  });

  // Fetch due diligence record
  const { data: ddRecord, isLoading: ddLoading } = useQuery<DueDiligenceRecord>({
    queryKey: [`/api/due-diligence/${userId}`],
    enabled: open && !!userId,
  });

  // If the DD record exists, update the checklist and verification level state
  React.useEffect(() => {
    if (ddRecord) {
      if (ddRecord.checklistItems) {
        setChecklist(ddRecord.checklistItems as any);
      }
      if (ddRecord.verificationLevel) {
        setVerificationLevel(ddRecord.verificationLevel);
      }
      if (ddRecord.notes) {
        setAdminNotes(ddRecord.notes);
      }
    }
  }, [ddRecord]);

  // Update due diligence record
  const updateDDMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!ddRecord) return null;
      const res = await apiRequest("PATCH", `/api/due-diligence/${ddRecord.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/due-diligence/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: "Due diligence record updated",
        description: "The user's verification information has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve user
  const approveUserMutation = useMutation({
    mutationFn: async () => {
      // First update DD record
      if (ddRecord) {
        await apiRequest("PATCH", `/api/due-diligence/${ddRecord.id}`, {
          status: 'Approved',
          checklistItems: checklist,
          notes: adminNotes,
          approvedAt: new Date().toISOString()
        });
      }
      
      // Then update user role
      return apiRequest("PATCH", `/api/users/${userId}`, {
        role: 'Vetted_Member',
        status: 'Active',
        verificationLevel
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: "User approved",
        description: "The user has been approved and can now access the platform.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject user
  const rejectUserMutation = useMutation({
    mutationFn: async () => {
      // First update DD record
      if (ddRecord) {
        await apiRequest("PATCH", `/api/due-diligence/${ddRecord.id}`, {
          status: 'Rejected',
          checklistItems: checklist,
          notes: adminNotes,
          rejectedAt: new Date().toISOString()
        });
      }
      
      // Then update user role
      return apiRequest("PATCH", `/api/users/${userId}`, {
        role: 'Rejected',
        status: 'Archived'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: "User rejected",
        description: "The user has been rejected.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Request more info
  const requestInfoMutation = useMutation({
    mutationFn: async () => {
      // Update DD record
      if (ddRecord) {
        await apiRequest("PATCH", `/api/due-diligence/${ddRecord.id}`, {
          status: 'Info Requested',
          checklistItems: checklist,
          notes: adminNotes
        });
      }
      
      return apiRequest("PATCH", `/api/users/${userId}`, {
        status: 'Pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: "Information requested",
        description: "The user will be notified to provide additional information.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to request information",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel button handler
  const handleCancel = () => {
    onClose();
  };

  // Save checklist changes (without changing status)
  const handleSaveChanges = () => {
    updateDDMutation.mutate({
      checklistItems: checklist,
      notes: adminNotes,
      verificationLevel
    });
  };

  const isLoading = userLoading || ddLoading || 
                   approveUserMutation.isPending || 
                   rejectUserMutation.isPending || 
                   requestInfoMutation.isPending ||
                   updateDDMutation.isPending;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-lg">User Verification Review</DialogTitle>
          <DialogDescription>
            Review user details and complete verification process
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column - User overview */}
            <div className="md:w-1/3">
              <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-14 w-14 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium text-xl">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-lg">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-neutral-500 text-sm">{user?.email}</p>
                  </div>
                </div>
                
                <div className="border-t border-neutral-100 pt-3 pb-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neutral-500">Company:</span>
                    <span className="text-sm font-medium">{user?.companyName}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neutral-500">Member Type:</span>
                    <div>
                      {user?.memberType?.map((type, index) => (
                        <span key={index} className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded ml-1">
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neutral-500">Status:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
                      {user?.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neutral-500">Submitted:</span>
                    <span className="text-sm">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Verification Checklist */}
              <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm mt-4">
                <h4 className="font-medium text-neutral-800 mb-3">Verification Checklist</h4>
                
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Checkbox 
                      id="basicInfo" 
                      checked={checklist.basicInfoComplete}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, basicInfoComplete: !!checked }))
                      }
                    />
                    <label htmlFor="basicInfo" className="ml-2 text-sm text-neutral-700">
                      Basic Information Complete
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <Checkbox 
                      id="emailVerified" 
                      checked={checklist.emailVerified}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, emailVerified: !!checked }))
                      }
                    />
                    <label htmlFor="emailVerified" className="ml-2 text-sm text-neutral-700">
                      Email Verified
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <Checkbox 
                      id="businessReg" 
                      checked={checklist.businessRegistrationValid}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, businessRegistrationValid: !!checked }))
                      }
                    />
                    <label htmlFor="businessReg" className="ml-2 text-sm text-neutral-700">
                      Business Registration Valid
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <Checkbox 
                      id="kycDocs" 
                      checked={checklist.kycDocumentsVerified}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, kycDocumentsVerified: !!checked }))
                      }
                    />
                    <label htmlFor="kycDocs" className="ml-2 text-sm text-neutral-700">
                      KYC Documents Verified
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <Checkbox 
                      id="bgCheck" 
                      checked={checklist.backgroundCheckComplete}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, backgroundCheckComplete: !!checked }))
                      }
                    />
                    <label htmlFor="bgCheck" className="ml-2 text-sm text-neutral-700">
                      Background Check Complete
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <Checkbox 
                      id="refsChecked" 
                      checked={checklist.referencesChecked}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, referencesChecked: !!checked }))
                      }
                    />
                    <label htmlFor="refsChecked" className="ml-2 text-sm text-neutral-700">
                      References Checked
                    </label>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Verification Level</label>
                  <Select value={verificationLevel} onValueChange={setVerificationLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select verification level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L0">L0 - Basic (Email Only)</SelectItem>
                      <SelectItem value="L1">L1 - Standard (ID Verified)</SelectItem>
                      <SelectItem value="L2">L2 - Enhanced (Business Validated)</SelectItem>
                      <SelectItem value="L3">L3 - Premium (Full Background)</SelectItem>
                      <SelectItem value="L4">L4 - Elite (Executive Approval)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Right column - User details */}
            <div className="md:w-2/3">
              <Accordion type="single" collapsible defaultValue="personal" className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
                {/* Personal Info Section */}
                <AccordionItem value="personal" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-neutral-50">
                    <span className="font-medium text-neutral-800">Personal Information</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">First Name</label>
                        <p className="text-sm">{user?.firstName}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Last Name</label>
                        <p className="text-sm">{user?.lastName}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Email</label>
                        <p className="text-sm">{user?.email}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Phone</label>
                        <p className="text-sm">{user?.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Position/Title</label>
                        <p className="text-sm">{user?.position || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">LinkedIn Profile</label>
                        {user?.linkedinProfile ? (
                          <a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary-600">
                            {user.linkedinProfile}
                          </a>
                        ) : (
                          <p className="text-sm">Not provided</p>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Company Info Section */}
                <AccordionItem value="company" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-neutral-50">
                    <span className="font-medium text-neutral-800">Company Information</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Company Name</label>
                        <p className="text-sm">{user?.companyName}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Company Type</label>
                        <p className="text-sm">{user?.profileData?.companyType || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Registration Number</label>
                        <p className="text-sm">{user?.profileData?.registrationNumber || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Country</label>
                        <p className="text-sm">{user?.profileData?.country || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Company Website</label>
                        {user?.profileData?.website ? (
                          <a href={user.profileData.website as string} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary-600">
                            {user.profileData.website as string}
                          </a>
                        ) : (
                          <p className="text-sm">Not provided</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Company Size</label>
                        <p className="text-sm">{user?.profileData?.companySize || "Not provided"}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Experience Section */}
                <AccordionItem value="experience" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-neutral-50">
                    <span className="font-medium text-neutral-800">Trading Experience & References</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Years in Trading</label>
                      <p className="text-sm">{user?.profileData?.yearsTrading || "Not provided"}</p>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Key Products Traded</label>
                      <p className="text-sm">{user?.profileData?.keyProducts || "Not provided"}</p>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Trading References</label>
                      <p className="text-sm">{user?.profileData?.references || "Not provided"}</p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Additional Information</label>
                      <p className="text-sm">{user?.profileData?.additionalInfo || "Not provided"}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Documents Section */}
                <AccordionItem value="documents">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-neutral-50">
                    <span className="font-medium text-neutral-800">Uploaded Documents</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                    {ddRecord?.uploadedDocuments && Array.isArray(ddRecord.uploadedDocuments) && ddRecord.uploadedDocuments.length > 0 ? (
                      <ul className="space-y-2">
                        {(ddRecord.uploadedDocuments as any[]).map((doc, index) => (
                          <li key={index} className="flex items-center">
                            <i className="ri-file-text-line text-primary mr-2"></i>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                              {doc.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-neutral-500">No documents have been uploaded yet.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {/* Admin Notes */}
              <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm mt-4">
                <h4 className="font-medium text-neutral-800 mb-3">Admin Notes</h4>
                
                <Textarea 
                  className="w-full h-32 p-3 text-sm" 
                  placeholder="Add private notes about this user..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
                
                {ddRecord?.notes && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-800">Admin Notes</span>
                        <span className="text-xs text-neutral-500">
                          {new Date(ddRecord.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700">{ddRecord.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between items-center mt-4">
          <div>
            <Button 
              variant="destructive" 
              onClick={() => rejectUserMutation.mutate()} 
              disabled={isLoading}
            >
              Reject Application
            </Button>
            <Button 
              variant="outline" 
              onClick={() => requestInfoMutation.mutate()} 
              className="ml-2"
              disabled={isLoading}
            >
              Request More Info
            </Button>
          </div>
          
          <div>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="mr-2"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleSaveChanges}
              className="mr-2"
              disabled={isLoading}
            >
              Save Changes
            </Button>
            <Button 
              onClick={() => approveUserMutation.mutate()} 
              disabled={isLoading}
            >
              Approve User
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
