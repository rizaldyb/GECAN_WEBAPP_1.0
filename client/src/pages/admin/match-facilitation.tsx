import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Clock, Filter, RefreshCw, Search, Tag, UserCheck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SellerOffer, BuyerEnquiry, Match, InsertMatch } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Advanced match scoring algorithm
const calculateMatchScore = (offer: SellerOffer, enquiry: BuyerEnquiry): number => {
  let score = 0;
  
  // Check if commodity types match
  if (offer.offerType === enquiry.enquiryType) {
    score += 40; // Base score for matching type
    
    // Additional scoring based on specific criteria
    const offerDetails: any = offer.commodityDetails;
    const enquiryDetails: any = enquiry.enquiryDetails;
    
    // For gold
    if (offer.offerType === 'GOLD') {
      // Match on gold type
      if (offerDetails?.goldType === enquiryDetails?.desiredGoldType) {
        score += 15;
      }
      
      // Match on purity
      if (offerDetails?.purity === enquiryDetails?.desiredPurity) {
        score += 15;
      }
      
      // Match on location
      if (offerDetails?.location === enquiryDetails?.preferredLocation) {
        score += 10;
      }
      
      // Match on incoterm
      if (offerDetails?.incoterm === enquiryDetails?.desiredIncoterm) {
        score += 10;
      }
      
      // Quantity check - approximate match based on units
      if (offerDetails?.quantityUnit === enquiryDetails?.quantityUnit) {
        const offerQty = parseFloat(offerDetails?.quantity || "0");
        const enquiryQty = parseFloat(enquiryDetails?.quantityRequired || "0");
        
        if (offerQty >= enquiryQty) {
          score += 10;
        } else if (offerQty >= enquiryQty * 0.8) {
          // At least 80% of required quantity
          score += 5;
        }
      }
    }
    
    // For petroleum
    if (offer.offerType === 'PETRO') {
      // Match on product
      if (offerDetails?.product === enquiryDetails?.productType) {
        score += 15;
      }
      
      // Match on specification
      if (offerDetails?.specification === enquiryDetails?.specificationRequired) {
        score += 15;
      }
      
      // Match on delivery location
      if (offerDetails?.deliveryLocation === enquiryDetails?.deliveryLocation) {
        score += 10;
      }
      
      // Match on incoterm
      if (offerDetails?.incoterm === enquiryDetails?.desiredIncoterm) {
        score += 10;
      }
      
      // Quantity check
      if (offerDetails?.quantityUnit === enquiryDetails?.quantityUnit) {
        const offerQty = parseFloat(offerDetails?.quantity || "0");
        const enquiryQty = parseFloat(enquiryDetails?.quantityRequired || "0");
        
        if (offerQty >= enquiryQty) {
          score += 10;
        } else if (offerQty >= enquiryQty * 0.8) {
          score += 5;
        }
      }
    }
  }
  
  return score;
};

// Function to get score classification
const getScoreClassification = (score: number): string => {
  if (score >= 80) return "Excellent Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Possible Match";
  return "Low Match";
};

// Function to get score color
const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
};

// Function to get score badge background
const getScoreBadgeBg = (score: number): string => {
  if (score >= 80) return "bg-green-100";
  if (score >= 60) return "bg-emerald-100";
  if (score >= 40) return "bg-amber-100";
  return "bg-red-100";
};

export default function MatchFacilitation() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("potential");
  const [selectedOffer, setSelectedOffer] = useState<SellerOffer | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<BuyerEnquiry | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [commodityFilter, setCommodityFilter] = useState("all");

  // Fetch active offers
  const { data: offers, isLoading: offersLoading } = useQuery<SellerOffer[]>({
    queryKey: ["/api/seller-offers"],
  });

  // Fetch active enquiries
  const { data: enquiries, isLoading: enquiriesLoading } = useQuery<BuyerEnquiry[]>({
    queryKey: ["/api/buyer-enquiries"],
  });

  // Fetch existing matches
  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  // Filter active offers and enquiries
  const activeOffers = offers?.filter(offer => offer.status === "Active") || [];
  const activeEnquiries = enquiries?.filter(enquiry => enquiry.status === "Active") || [];
  
  // Filter by commodity type if needed
  const filteredOffers = commodityFilter === "all" 
    ? activeOffers 
    : activeOffers.filter(offer => offer.offerType === commodityFilter);
  
  const filteredEnquiries = commodityFilter === "all" 
    ? activeEnquiries 
    : activeEnquiries.filter(enquiry => enquiry.enquiryType === commodityFilter);

  // Calculate potential matches
  const potentialMatches = filteredOffers.flatMap(offer => 
    filteredEnquiries.map(enquiry => {
      const score = calculateMatchScore(offer, enquiry);
      return {
        offer,
        enquiry,
        score,
        classification: getScoreClassification(score)
      };
    })
  ).filter(match => match.score >= 40) // Only show matches with at least "Possible Match" classification
   .sort((a, b) => b.score - a.score); // Sort by score descending

  // Handle creating a match
  const handleCreateMatch = async () => {
    if (!selectedOffer || !selectedEnquiry) return;
    
    try {
      const match: InsertMatch = {
        offerId: selectedOffer.id,
        enquiryId: selectedEnquiry.id,
        status: "Introduced",
        facilitatingAdminId: user?.id || 1, // Fallback to admin id 1 if not available
        notes: `Matched by admin. Match score: ${calculateMatchScore(selectedOffer, selectedEnquiry)}%`
      };
      
      await apiRequest("POST", "/api/matches", match);
      
      toast({
        title: "Match Created",
        description: "The buyer and seller have been matched successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/buyer-enquiries"] });
      
      // Close dialog and reset selection
      setMatchDialogOpen(false);
      setSelectedOffer(null);
      setSelectedEnquiry(null);
    } catch (error: any) {
      toast({
        title: "Error Creating Match",
        description: error.message || "Failed to create match",
        variant: "destructive",
      });
    }
  };

  // Get the offer or enquiry details for display
  const getCommodityDetails = (item: SellerOffer | BuyerEnquiry) => {
    const details = 'commodityDetails' in item ? item.commodityDetails : item.enquiryDetails;
    const type = 'offerType' in item ? item.offerType : item.enquiryType;
    
    // We need to cast details to any to avoid the unknown type issues
    const detailsObj = details as any;
    
    if (type === 'GOLD') {
      return {
        type: "Gold",
        specifics: detailsObj?.goldType || detailsObj?.desiredGoldType || 'N/A',
        purity: detailsObj?.purity || detailsObj?.desiredPurity || 'N/A',
        quantity: `${detailsObj?.quantity || detailsObj?.quantityRequired || 'N/A'} ${detailsObj?.quantityUnit || ''}`,
        location: detailsObj?.location || detailsObj?.preferredLocation || 'N/A'
      };
    } else if (type === 'PETRO') {
      return {
        type: "Petroleum",
        specifics: detailsObj?.product || detailsObj?.productType || 'N/A',
        spec: detailsObj?.specification || detailsObj?.specificationRequired || 'N/A',
        quantity: `${detailsObj?.quantity || detailsObj?.quantityRequired || 'N/A'} ${detailsObj?.quantityUnit || ''}`,
        location: detailsObj?.deliveryLocation || 'N/A'
      };
    }
    
    return { type: "Unknown", specifics: "Details not available" };
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Match Facilitation</h2>
          <p className="text-muted-foreground">
            Facilitate matches between buyers and sellers based on their requirements
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={commodityFilter} onValueChange={setCommodityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commodities</SelectItem>
              <SelectItem value="GOLD">Gold</SelectItem>
              <SelectItem value="PETRO">Petroleum</SelectItem>
              <SelectItem value="BTC">Bitcoin</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
            queryClient.invalidateQueries({ queryKey: ["/api/buyer-enquiries"] });
            queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
          }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="potential">
            Potential Matches
          </TabsTrigger>
          <TabsTrigger value="facilitated">
            Facilitated Matches
          </TabsTrigger>
          <TabsTrigger value="offers">
            Active Offers
          </TabsTrigger>
          <TabsTrigger value="enquiries">
            Active Enquiries
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="potential" className="animate-fadeIn">
          <Card>
            <CardHeader>
              <CardTitle>Potential Matches</CardTitle>
              <CardDescription>
                AI-powered matching engine has identified these potential matches based on commodity specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offersLoading || enquiriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : potentialMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-neutral-100 p-3 text-neutral-500">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No potential matches found</h3>
                  <p className="mt-2 text-sm text-neutral-500 max-w-md">
                    There are currently no compatible offers and enquiries in the system or they don't meet the minimum matching criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {potentialMatches.map((match, index) => (
                    <Card key={index} className="overflow-hidden border-l-4" style={{ borderLeftColor: match.score >= 80 ? '#22c55e' : match.score >= 60 ? '#059669' : match.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-md">Match #{index + 1}</h4>
                              <Badge className={`${getScoreBadgeBg(match.score)} ${getScoreColor(match.score)} border-transparent`}>
                                {match.score}% - {match.classification}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                              <div>
                                <span className="text-neutral-500">Seller Offer:</span>{" "}
                                <span className="font-medium">{match.offer.offerId}</span>
                              </div>
                              <div>
                                <span className="text-neutral-500">Buyer Enquiry:</span>{" "}
                                <span className="font-medium">{match.enquiry.enquiryId}</span>
                              </div>
                              
                              <div>
                                <span className="text-neutral-500">Commodity:</span>{" "}
                                <Badge variant="outline" className="font-normal">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {match.offer.offerType}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-neutral-500">Match Created:</span>{" "}
                                <span className="font-medium">{new Date().toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">View Details</Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedOffer(match.offer);
                                setSelectedEnquiry(match.enquiry);
                                setMatchDialogOpen(true);
                              }}
                            >
                              Facilitate Match
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="facilitated" className="animate-fadeIn">
          <Card>
            <CardHeader>
              <CardTitle>Facilitated Matches</CardTitle>
              <CardDescription>
                Matches you have already facilitated between buyers and sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matchesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !matches || matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-neutral-100 p-3 text-neutral-500">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No matches facilitated yet</h3>
                  <p className="mt-2 text-sm text-neutral-500 max-w-md">
                    You haven't facilitated any matches between buyers and sellers yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Match ID</TableHead>
                      <TableHead>Seller Offer</TableHead>
                      <TableHead>Buyer Enquiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">MATCH-{match.id}</TableCell>
                        <TableCell>
                          {offers?.find(o => o.id === match.offerId)?.offerId || `Offer #${match.offerId}`}
                        </TableCell>
                        <TableCell>
                          {enquiries?.find(e => e.id === match.enquiryId)?.enquiryId || `Enquiry #${match.enquiryId}`}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-transparent">
                            {match.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(match.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {/* Since the schema doesn't have matchConfidenceScore, we're using a fixed display for now */}
                          <Badge className="bg-green-100 text-green-600 border-transparent">
                            Matched
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="offers" className="animate-fadeIn">
          <Card>
            <CardHeader>
              <CardTitle>Active Seller Offers</CardTitle>
              <CardDescription>
                Currently active offers from sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-neutral-100 p-3 text-neutral-500">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No active offers found</h3>
                  <p className="mt-2 text-sm text-neutral-500 max-w-md">
                    There are currently no active offers in the system that match your filter criteria.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Seller ID</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOffers.map((offer) => {
                      const details = getCommodityDetails(offer);
                      return (
                        <TableRow key={offer.id}>
                          <TableCell className="font-medium">{offer.offerId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal bg-neutral-50">
                              {offer.offerType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div><span className="text-neutral-500">Type:</span> {details.specifics}</div>
                              {details.purity && <div><span className="text-neutral-500">Purity:</span> {details.purity}</div>}
                              <div><span className="text-neutral-500">Qty:</span> {details.quantity}</div>
                              <div><span className="text-neutral-500">Location:</span> {details.location}</div>
                            </div>
                          </TableCell>
                          <TableCell>User-{offer.sellerUserId}</TableCell>
                          <TableCell>{new Date(offer.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedOffer(offer);
                                setSelectedEnquiry(null);
                              }}
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="enquiries" className="animate-fadeIn">
          <Card>
            <CardHeader>
              <CardTitle>Active Buyer Enquiries</CardTitle>
              <CardDescription>
                Currently active enquiries from buyers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enquiriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-neutral-100 p-3 text-neutral-500">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No active enquiries found</h3>
                  <p className="mt-2 text-sm text-neutral-500 max-w-md">
                    There are currently no active enquiries in the system that match your filter criteria.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enquiry ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Buyer ID</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnquiries.map((enquiry) => {
                      const details = getCommodityDetails(enquiry);
                      return (
                        <TableRow key={enquiry.id}>
                          <TableCell className="font-medium">{enquiry.enquiryId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal bg-neutral-50">
                              {enquiry.enquiryType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div><span className="text-neutral-500">Type:</span> {details.specifics}</div>
                              {details.purity && <div><span className="text-neutral-500">Purity:</span> {details.purity}</div>}
                              <div><span className="text-neutral-500">Qty:</span> {details.quantity}</div>
                              <div><span className="text-neutral-500">Location:</span> {details.location}</div>
                            </div>
                          </TableCell>
                          <TableCell>User-{enquiry.buyerUserId}</TableCell>
                          <TableCell>{new Date(enquiry.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedEnquiry(enquiry);
                                setSelectedOffer(null);
                              }}
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Match Facilitation Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Facilitate Match</DialogTitle>
            <DialogDescription>
              Review details and confirm match facilitation between seller and buyer
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffer && selectedEnquiry && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="bg-neutral-50 pb-3">
                    <CardTitle className="text-md">Seller Offer</CardTitle>
                    <div className="flex items-center text-xs">
                      <Tag className="h-3 w-3 mr-1 text-neutral-500" />
                      <span className="text-neutral-500">{selectedOffer.offerId}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-sm space-y-2">
                      {Object.entries(getCommodityDetails(selectedOffer)).map(([key, value]) => (
                        key !== 'type' && (
                          <div key={key} className="flex justify-between">
                            <span className="text-neutral-500 capitalize">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        )
                      ))}
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Commodity:</span>
                        <Badge variant="outline" className="font-normal bg-neutral-50">
                          {selectedOffer.offerType}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Seller:</span>
                        <span className="font-medium">User-{selectedOffer.sellerUserId}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="bg-neutral-50 pb-3">
                    <CardTitle className="text-md">Buyer Enquiry</CardTitle>
                    <div className="flex items-center text-xs">
                      <Search className="h-3 w-3 mr-1 text-neutral-500" />
                      <span className="text-neutral-500">{selectedEnquiry.enquiryId}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-sm space-y-2">
                      {Object.entries(getCommodityDetails(selectedEnquiry)).map(([key, value]) => (
                        key !== 'type' && (
                          <div key={key} className="flex justify-between">
                            <span className="text-neutral-500 capitalize">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        )
                      ))}
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Commodity:</span>
                        <Badge variant="outline" className="font-normal bg-neutral-50">
                          {selectedEnquiry.enquiryType}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Buyer:</span>
                        <span className="font-medium">User-{selectedEnquiry.buyerUserId}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-neutral-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Match Assessment</h4>
                      <p className="text-sm text-neutral-500">AI-powered match scoring</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                        <span className={`text-xl font-bold ${getScoreColor(calculateMatchScore(selectedOffer, selectedEnquiry))}`}>
                          {calculateMatchScore(selectedOffer, selectedEnquiry)}%
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${getScoreColor(calculateMatchScore(selectedOffer, selectedEnquiry))}`}>
                        {getScoreClassification(calculateMatchScore(selectedOffer, selectedEnquiry))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex items-center space-x-2 rounded-md border p-4">
                <UserCheck className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ready to Facilitate</p>
                  <p className="text-xs text-neutral-500">
                    By facilitating this match, you'll connect the buyer and seller while maintaining GECAN's role as a trusted intermediary.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMatch}
              disabled={!selectedOffer || !selectedEnquiry}
            >
              Facilitate Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}