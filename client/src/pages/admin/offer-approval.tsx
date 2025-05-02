import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SellerOffer, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Eye, Check, X, HelpCircle, Info } from "lucide-react";

export default function OfferApproval() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending Approval");
  const [selectedOffer, setSelectedOffer] = useState<SellerOffer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");

  // Fetch offers that need approval
  const { data: offers, isLoading, isError } = useQuery<SellerOffer[]>({
    queryKey: ["/api/seller-offers", { status: statusFilter }],
  });

  // Fetch user data for offers
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users/pending"],
    enabled: !!offers && offers.length > 0,
  });

  // Filter offers based on search query
  const filteredOffers = React.useMemo(() => {
    if (!offers) return [];
    
    return offers.filter(offer => {
      // Skip status filter since we're already filtering by status in the API call
      
      // Apply search filter (case-insensitive)
      if (!searchQuery) return true;
      
      const searchString = searchQuery.toLowerCase();
      return (
        offer.offerId.toLowerCase().includes(searchString) ||
        offer.offerType.toLowerCase().includes(searchString) ||
        // Search in commodity details if available
        (offer.commodityDetails && 
          JSON.stringify(offer.commodityDetails).toLowerCase().includes(searchString))
      );
    });
  }, [offers, searchQuery]);

  // Get status filter counts (placeholder - in real app this would come from API)
  const getStatusCounts = {
    "Pending Approval": filteredOffers.length || 0,
    "Active": 0,
    "Inactive": 0,
    "All": 0,
  };

  // Get user name by ID
  const getUserName = (userId: number): string => {
    if (!users) return "Loading...";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  // Handle offer action (view details)
  const handleViewOffer = (offer: SellerOffer) => {
    setSelectedOffer(offer);
    setInternalNotes(offer.internalNotes || "");
    setDialogOpen(true);
  };

  // Handle approve offer
  const handleApproveOffer = async () => {
    if (!selectedOffer) return;
    
    try {
      // Check if this is a modification request
      const isModificationRequest = selectedOffer.status === "Modification Requested";
      
      const updateData: any = {
        status: "Active",
        internalNotes
      };
      
      // If there's a modification reason, clear it
      if (selectedOffer.modificationReason) {
        updateData.modificationReason = null;
      }
      
      await apiRequest("PATCH", `/api/seller-offers/${selectedOffer.id}`, updateData);
      
      toast({
        title: isModificationRequest ? "Modification Approved" : "Offer Approved",
        description: isModificationRequest 
          ? `Modifications to offer ${selectedOffer.offerId} have been approved.`
          : `Offer ${selectedOffer.offerId} has been approved and is now active.`,
      });
      
      // Refresh offers data
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      
      setDialogOpen(false);
      
      // Redirect to admin dashboard after a short delay to allow the toast to be seen
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve offer. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle reject offer
  const handleRejectOffer = async () => {
    if (!selectedOffer) return;
    
    try {
      // Check if this is a modification request
      const isModificationRequest = selectedOffer.status === "Modification Requested";
      
      const updateData: any = {
        // If this was a modification request, try to restore the original status
        // Otherwise, set to inactive
        status: isModificationRequest 
          ? (selectedOffer as any).originalStatus || "Inactive" 
          : "Inactive",
        internalNotes
      };
      
      // If there's a modification reason, clear it
      if ((selectedOffer as any).modificationReason) {
        updateData.modificationReason = null;
      }
      
      await apiRequest("PATCH", `/api/seller-offers/${selectedOffer.id}`, updateData);
      
      toast({
        title: isModificationRequest ? "Modification Rejected" : "Offer Rejected",
        description: isModificationRequest 
          ? `Modifications to offer ${selectedOffer.offerId} have been rejected.`
          : `Offer ${selectedOffer.offerId} has been rejected.`,
      });
      
      // Refresh offers data
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      
      setDialogOpen(false);
      
      // Redirect to admin dashboard after a short delay to allow the toast to be seen
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject offer. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date relative to current time
  const formatRelativeTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  // Format commodity type with color
  const getCommodityTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      "GOLD": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "BTC": "bg-orange-100 text-orange-800 border-orange-200",
      "USDT": "bg-green-100 text-green-800 border-green-200",
      "PALLET": "bg-blue-100 text-blue-800 border-blue-200", 
      "PETRO": "bg-purple-100 text-purple-800 border-purple-200",
      "SBLCM": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "SBLCP": "bg-pink-100 text-pink-800 border-pink-200"
    };
    
    const colorClass = typeColors[type] || "bg-gray-100 text-gray-800 border-gray-200";
    
    return (
      <Badge variant="outline" className={`${colorClass} hover:${colorClass}`}>
        {type}
      </Badge>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === "Pending Approval") {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
        Pending Approval
      </Badge>;
    }
    
    if (status === "Modification Requested") {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
        Modification Requested
      </Badge>;
    }
    
    if (status === "Active") {
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
        Active
      </Badge>;
    }
    
    if (status === "Inactive") {
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
        Inactive
      </Badge>;
    }
    
    return <Badge variant="outline">{status}</Badge>;
  };

  // Render commodity details based on type
  const renderCommodityDetails = (offer: SellerOffer) => {
    const details = offer.commodityDetails as Record<string, any>;
    if (!details) return <p>No details available</p>;
    
    switch (offer.offerType) {
      case "GOLD":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Gold Type</label>
              <p className="text-sm">{details.goldType || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Purity</label>
              <p className="text-sm">{details.purity || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Quantity</label>
              <p className="text-sm">{details.quantity} {details.quantityUnit}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Location</label>
              <p className="text-sm">{details.location || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Incoterm</label>
              <p className="text-sm">{details.incoterm || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Price Basis</label>
              <p className="text-sm">{details.priceBasis || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Discount/Premium</label>
              <p className="text-sm">{details.discountPremium || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Payment Terms</label>
              <p className="text-sm">{details.paymentTerms || "N/A"}</p>
            </div>
          </div>
        );
      
      case "PETRO":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Product</label>
              <p className="text-sm">{details.product || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Specification</label>
              <p className="text-sm">{details.specification || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Quantity</label>
              <p className="text-sm">{details.quantity} {details.quantityUnit}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Origin</label>
              <p className="text-sm">{details.origin || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Delivery Location</label>
              <p className="text-sm">{details.deliveryLocation || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Price</label>
              <p className="text-sm">{details.price || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Incoterm</label>
              <p className="text-sm">{details.incoterm || "N/A"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Payment Terms</label>
              <p className="text-sm">{details.paymentTerms || "N/A"}</p>
            </div>
          </div>
        );
        
      // Add cases for other offer types as needed
      
      default:
        return (
          <div>
            <h3 className="text-sm font-medium mb-2">Commodity Details:</h3>
            <pre className="text-xs bg-neutral-50 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Back to Dashboard Button */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = "/admin"}
        >
          ← Back to Dashboard
        </Button>
      </div>
      
      {/* Filters & Actions */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex space-x-2 mb-2 sm:mb-0">
          <Button 
            variant={statusFilter === "Pending Approval" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("Pending Approval")}
          >
            Pending <span className="text-neutral-400 ml-1">({getStatusCounts["Pending Approval"]})</span>
          </Button>
          <Button 
            variant={statusFilter === "Modification Requested" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("Modification Requested")}
          >
            Modifications <span className="text-neutral-400 ml-1">({getStatusCounts["Modification Requested"] || 0})</span>
          </Button>
          <Button 
            variant={statusFilter === "Active" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("Active")}
          >
            Active <span className="text-neutral-400 ml-1">({getStatusCounts.Active})</span>
          </Button>
          <Button 
            variant={statusFilter === "Inactive" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("Inactive")}
          >
            Inactive <span className="text-neutral-400 ml-1">({getStatusCounts.Inactive})</span>
          </Button>
          <Button 
            variant={statusFilter === "All" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("All")}
          >
            All <span className="text-neutral-400 ml-1">({getStatusCounts.All})</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search offers..." 
              className="pl-9 pr-3 w-60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4 text-neutral-400" />
          </Button>
        </div>
      </div>
      
      {/* Offers Table */}
      <div className="bg-white shadow-sm rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="styled-table min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Offer ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Seller</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Submitted</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (
                // Loading state with skeleton UI
                Array(3).fill(0).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24 ml-3" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-32 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                    Error loading offer data. Please try again later.
                  </td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                    No offers found matching the current filters.
                  </td>
                </tr>
              ) : (
                // Actual offer data
                filteredOffers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                      {offer.offerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium text-xs">
                          {getUserName(offer.sellerUserId).split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="ml-3 text-sm">{getUserName(offer.sellerUserId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCommodityTypeBadge(offer.offerType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(offer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatRelativeTime(offer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewOffer(offer)}
                          className="text-primary hover:text-primary/80 hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleViewOffer(offer)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleViewOffer(offer)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-neutral-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredOffers?.length || 0}</span> of <span className="font-medium">{filteredOffers?.length || 0}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button variant="outline" size="sm" className="rounded-l-md">
                  <span className="sr-only">Previous</span>
                  <i className="ri-arrow-left-s-line"></i>
                </Button>
                <Button variant="outline" size="sm" className="bg-primary/5 text-primary border-primary/20">
                  1
                </Button>
                <Button variant="outline" size="sm" className="rounded-r-md">
                  <span className="sr-only">Next</span>
                  <i className="ri-arrow-right-s-line"></i>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center font-montserrat">
              <Info className="mr-2 h-5 w-5 text-primary" />
              Offer Review - {selectedOffer?.offerId}
            </DialogTitle>
            <DialogDescription>
              Review and approve/reject the seller offer
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap md:flex-nowrap">
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
                    <h3 className="font-medium text-lg mb-2">Offer Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Offer ID:</span>
                        <span className="text-sm font-medium">{selectedOffer.offerId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Type:</span>
                        <span>{getCommodityTypeBadge(selectedOffer.offerType)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Status:</span>
                        <span>{getStatusBadge(selectedOffer.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Seller:</span>
                        <span className="text-sm">{getUserName(selectedOffer.sellerUserId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Submitted:</span>
                        <span className="text-sm">{new Date(selectedOffer.createdAt).toLocaleString()}</span>
                      </div>
                      {selectedOffer.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-500">Expires:</span>
                          <span className="text-sm">{new Date(selectedOffer.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
                    {/* Show modification reason if present */}
                    {selectedOffer.status === "Modification Requested" && (
                      <div className="mb-4">
                        <h3 className="font-medium text-lg mb-2 text-amber-700">Modification Requested</h3>
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
                          <p className="text-sm text-amber-800">
                            <strong>Reason:</strong> {(selectedOffer as any).modificationReason || "No reason provided"}
                          </p>
                          {(selectedOffer as any).originalStatus && (
                            <p className="text-sm text-amber-800 mt-1">
                              <strong>Original Status:</strong> {(selectedOffer as any).originalStatus}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <h3 className="font-medium text-lg mb-2">Admin Notes</h3>
                    <Textarea 
                      placeholder="Add internal notes about this offer..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="mb-4"
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-2/3">
                  <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
                    <h3 className="font-medium text-lg mb-4">Commodity Details</h3>
                    {renderCommodityDetails(selectedOffer)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="destructive" 
              onClick={handleRejectOffer}
            >
              Reject Offer
            </Button>
            <div>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApproveOffer}
              >
                Approve Offer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
