import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Filter, Search, SlidersHorizontal, Tag, Calendar, DollarSign, Map, Truck, ShieldCheck, Users, BarChart3, ArrowLeft, Clock, Award, LayoutGrid, Briefcase, RefreshCw, ArrowRightLeft, CircleDollarSign, Droplets, Bitcoin, Coins, Download, Send, Percent, CreditCard, Timer, Globe, Check, Edit2, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SellerOffer, BuyerEnquiry, InsertSellerOffer, InsertBuyerEnquiry } from "@shared/schema";
import { Link, useLocation } from "wouter";
import AppLayout from "@/layouts/app-layout";
import Breadcrumbs from "@/components/common/breadcrumbs";

export default function Marketplace() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("offers");
  const [newOfferModalOpen, setNewOfferModalOpen] = useState(false);
  const [selectedOfferType, setSelectedOfferType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedOffer, setSelectedOffer] = useState<SellerOffer | null>(null);
  const [offerDetailsDialogOpen, setOfferDetailsDialogOpen] = useState(false);
  const [offerQuestion, setOfferQuestion] = useState("");
  const [sellerInfo, setSellerInfo] = useState<any | null>(null);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [generatePdfLoading, setGeneratePdfLoading] = useState(false);

  // Fetch seller offers
  const { data: sellerOffers, isLoading: offersLoading } = useQuery<SellerOffer[]>({
    queryKey: ["/api/seller-offers"],
  });

  // Fetch buyer enquiries
  const { data: buyerEnquiries, isLoading: enquiriesLoading } = useQuery<BuyerEnquiry[]>({
    queryKey: ["/api/buyer-enquiries"],
  });

  // Filter offers based on search and filters
  const filteredOffers = React.useMemo(() => {
    if (!sellerOffers) return [];
    
    return sellerOffers.filter(offer => {
      // Status filter
      if (statusFilter !== "all" && offer.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== "all" && offer.offerType !== typeFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        return (
          offer.offerId.toLowerCase().includes(searchTerm) ||
          offer.offerType.toLowerCase().includes(searchTerm) ||
          JSON.stringify(offer.commodityDetails).toLowerCase().includes(searchTerm)
        );
      }
      
      return true;
    });
  }, [sellerOffers, searchQuery, typeFilter, statusFilter]);

  // Filtered enquiries
  const filteredEnquiries = React.useMemo(() => {
    if (!buyerEnquiries) return [];
    
    return buyerEnquiries.filter(enquiry => {
      // Status filter - adapt as needed
      if (statusFilter !== "all" && enquiry.status.toLowerCase() !== "active") {
        return false;
      }
      
      // Type filter
      if (typeFilter !== "all" && enquiry.enquiryType !== typeFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        return (
          enquiry.enquiryId.toLowerCase().includes(searchTerm) ||
          enquiry.enquiryType.toLowerCase().includes(searchTerm) ||
          JSON.stringify(enquiry.enquiryDetails).toLowerCase().includes(searchTerm)
        );
      }
      
      return true;
    });
  }, [buyerEnquiries, searchQuery, typeFilter, statusFilter]);

  // Gold offer schema
  const goldOfferSchema = z.object({
    // Seller identification
    sellerId: z.string().optional(),
    offerValidity: z.string().min(1, "Offer validity is required"),
    sellerCompany: z.string().optional(),
    sellerNationality: z.string().optional(),
    sellerTimeZone: z.string().optional(),
    sellerResponseTime: z.string().optional(),
    transactionType: z.string().min(1, "Transaction type is required"),
    
    // Commodity details
    goldType: z.string().min(1, "Gold type is required"),
    purity: z.string().min(1, "Purity is required"),
    quantity: z.string().min(1, "Quantity is required"),
    quantityUnit: z.string().min(1, "Unit is required"),
    location: z.string().min(1, "Location is required"),
    originOfMetal: z.string().optional(),
    hallmark: z.string().optional(),
    
    // Pricing and terms
    priceBasis: z.string().min(1, "Price basis is required"),
    premium: z.string().optional(),
    discountGross: z.string().optional(),
    discountNet: z.string().optional(),
    incoterm: z.string().min(1, "Incoterm is required"),
    paymentMethod: z.string().min(1, "Payment method is required"),
    deliveryTime: z.string().optional(),
    minTransaction: z.string().optional(),
    maxTransaction: z.string().optional(),
    contractDuration: z.string().optional(),
    
    // Compliance and requirements
    kycRequirements: z.string().optional(),
    paymentGuarantee: z.string().optional(),
    performanceBond: z.string().optional(),
    
    // Commission structure
    commissionStructure: z.string().optional(),
    
    // Meeting preferences
    meetingType: z.string().optional(),
    faceToFaceLocation: z.string().optional(),
    
    // Additional details
    additionalDetails: z.string().optional(),
    
    // Transaction procedures and legal framework
    transactionProcedures: z.string().min(1, "Transaction procedures are required"),
    legalFramework: z.string().min(1, "Legal framework is required"),
  });

  // BTC offer schema
  const btcOfferSchema = z.object({
    // Seller identification
    sellerId: z.string().optional(),
    offerValidity: z.string().min(1, "Offer validity is required"),
    sellerCompany: z.string().optional(),
    sellerNationality: z.string().optional(),
    sellerTimeZone: z.string().optional(),
    sellerResponseTime: z.string().optional(),
    transactionType: z.string().min(1, "Transaction type is required"),
    
    // Commodity details
    quantity: z.string().min(1, "Quantity is required"),
    location: z.string().min(1, "Location is required"),
    origin: z.string().optional(),
    tradingPair: z.string().optional(),
    transactionPlatform: z.string().optional(),
    walletRequirements: z.string().optional(),
    
    // Pricing and terms
    priceType: z.string().min(1, "Price type is required"),
    premium: z.string().min(1, "Premium percentage is required"),
    discountGross: z.string().optional(),
    discountNet: z.string().optional(),
    
    // Logistics and transaction details
    incoterms: z.string().optional(),
    paymentMethod: z.string().min(1, "Payment method is required"),
    settlementTime: z.string().min(1, "Settlement time is required"),
    minTransaction: z.string().min(1, "Minimum transaction is required"),
    maxTransaction: z.string().min(1, "Maximum transaction is required"),
    contractDuration: z.string().optional(),
    
    // Compliance and requirements
    kycRequirements: z.string().min(1, "KYC requirements are required"),
    paymentGuarantee: z.string().optional(),
    performanceBond: z.string().optional(),
    
    // Commission structure
    commissionStructure: z.string().optional(),
    
    // Meeting preferences
    meetingType: z.string().optional(),
    faceToFaceLocation: z.string().optional(),
    
    // Additional details
    additionalDetails: z.string().optional(),
    additionalConditions: z.string().optional(),
    
    // Transaction procedures and legal framework
    transactionProcedures: z.string().min(1, "Transaction procedures are required"),
    legalFramework: z.string().min(1, "Legal framework is required"),
  });
  
  // USDT offer schema
  const usdtOfferSchema = z.object({
    // Seller identification
    sellerId: z.string().optional(),
    offerValidity: z.string().min(1, "Offer validity is required"),
    sellerCompany: z.string().optional(),
    sellerNationality: z.string().optional(), 
    sellerTimeZone: z.string().optional(),
    sellerResponseTime: z.string().optional(),
    transactionType: z.string().min(1, "Transaction type is required"),
    
    // Commodity details
    quantity: z.string().min(1, "Quantity is required"),
    network: z.string().min(1, "Network is required"),
    location: z.string().min(1, "Location is required"),
    origin: z.string().optional(),
    tradingPair: z.string().optional(),
    transactionPlatform: z.string().optional(),
    walletRequirements: z.string().optional(),
    
    // Pricing and terms
    priceType: z.string().min(1, "Price type is required"),
    premium: z.string().min(1, "Premium percentage is required"),
    discountGross: z.string().optional(),
    discountNet: z.string().optional(),
    
    // Logistics and transaction details
    incoterms: z.string().optional(),
    paymentMethod: z.string().min(1, "Payment method is required"),
    settlementTime: z.string().min(1, "Settlement time is required"),
    minTransaction: z.string().min(1, "Minimum transaction is required"),
    maxTransaction: z.string().min(1, "Maximum transaction is required"),
    contractDuration: z.string().optional(),
    
    // Compliance and requirements
    kycRequirements: z.string().min(1, "KYC requirements are required"),
    paymentGuarantee: z.string().optional(),
    performanceBond: z.string().optional(),
    
    // Commission structure
    commissionStructure: z.string().optional(),
    
    // Meeting preferences
    meetingType: z.string().optional(),
    faceToFaceLocation: z.string().optional(),
    
    // Additional details
    additionalDetails: z.string().optional(),
    additionalConditions: z.string().optional(),
    
    // Transaction procedures and legal framework
    transactionProcedures: z.string().min(1, "Transaction procedures are required"),
    legalFramework: z.string().min(1, "Legal framework is required"),
  });

  // Petroleum offer schema
  const petroleumOfferSchema = z.object({
    // Commodity details
    product: z.string().min(1, "Product is required"),
    specification: z.string().min(1, "Specification is required"),
    quantity: z.string().min(1, "Quantity is required"),
    quantityUnit: z.string().min(1, "Unit is required"),
    origin: z.string().min(1, "Origin is required"),
    deliveryLocation: z.string().min(1, "Delivery location is required"),
    price: z.string().min(1, "Price is required"),
    incoterm: z.string().min(1, "Incoterm is required"),
    paymentTerms: z.string().min(1, "Payment terms are required"),
    additionalDetails: z.string().optional(),
    
    // Transaction procedures and legal framework
    transactionProcedures: z.string().min(1, "Transaction procedures are required"),
    legalFramework: z.string().min(1, "Legal framework is required"),
  });
  
  // Cash Pallet offer schema
  const cashOfferSchema = z.object({
    // Commodity details
    currency: z.string().min(1, "Currency is required"),
    denomination: z.string().min(1, "Denomination is required"),
    totalFaceValue: z.string().min(1, "Total face value is required"),
    location: z.string().min(1, "Location is required"),
    discountRate: z.string().min(1, "Discount rate is required"),
    netPrice: z.string().min(1, "Net price is required"),
    securityFeatures: z.string().min(1, "Security features are required"),
    origin: z.string().min(1, "Origin is required"),
    authenticityVerification: z.string().min(1, "Authenticity verification is required"),
    additionalDetails: z.string().optional(),
    
    // Transaction procedures and legal framework
    transactionProcedures: z.string().min(1, "Transaction procedures are required"),
    legalFramework: z.string().min(1, "Legal framework is required"),
  });
  
  // SBLC Monetizer offer schema
  const sblcMonetizerOfferSchema = z.object({
    // Service details
    monetizationProgram: z.string().min(1, "Monetization program is required"),
    acceptedIssuers: z.string().min(1, "Accepted issuers are required"),
    minAmount: z.string().min(1, "Minimum amount is required"),
    maxAmount: z.string().min(1, "Maximum amount is required"),
    ltv: z.string().min(1, "LTV percentage is required"),
    discountRate: z.string().min(1, "Discount rate is required"),
    monetizationPeriod: z.string().min(1, "Monetization period is required"),
    paymentTerms: z.string().min(1, "Payment terms are required"),
    fees: z.string().min(1, "Fees are required"),
    requirementsDocumentation: z.string().min(1, "Requirements documentation is required"),
    additionalDetails: z.string().optional(),
    
    // Transaction procedures and legal framework
    transactionProcedures: z.string().min(1, "Transaction procedures are required"),
    legalFramework: z.string().min(1, "Legal framework is required"),
  });
  
  // SBLC Provider offer schema
  const sblcProviderOfferSchema = z.object({
    // Service details
    providerBank: z.string().min(1, "Provider bank is required"),
    bankRating: z.string().min(1, "Bank rating is required"),
    sblcValue: z.string().min(1, "SBLC value is required"),
    issuePrice: z.string().min(1, "Issue price is required"),
    leasePrice: z.string().min(1, "Lease price is required"),
    validation: z.string().min(1, "Validation period is required"),
    issuanceTime: z.string().min(1, "Issuance time is required"),
    eligibility: z.string().min(1, "Eligibility criteria are required"),
    useRestrictions: z.string().min(1, "Use restrictions are required"),
    documentationRequired: z.string().min(1, "Documentation required is required"),
    additionalDetails: z.string().optional(),
    
    // Transaction procedures and legal framework
    transactionProcedures: z.string().min(1, "Transaction procedures are required"),
    legalFramework: z.string().min(1, "Legal framework is required"),
  });

  // Create a form for gold offers
  const goldForm = useForm<z.infer<typeof goldOfferSchema>>({
    resolver: zodResolver(goldOfferSchema),
    defaultValues: {
      // Seller identification
      sellerId: `GECAN-GOLD-S-${Date.now()}`, // Auto-generated seller ID
      offerValidity: "30 days",
      sellerCompany: "",
      sellerNationality: "",
      sellerTimeZone: "",
      sellerResponseTime: "",
      transactionType: "",
      
      // Commodity details
      goldType: "",
      purity: "",
      quantity: "",
      quantityUnit: "kg",
      location: "",
      originOfMetal: "",
      hallmark: "",
      
      // Pricing and terms
      priceBasis: "",
      premium: "",
      discountGross: "",
      discountNet: "",
      incoterm: "",
      paymentMethod: "",
      deliveryTime: "",
      minTransaction: "",
      maxTransaction: "",
      contractDuration: "",
      
      // Compliance and requirements
      kycRequirements: "",
      paymentGuarantee: "",
      performanceBond: "",
      
      // Commission structure
      commissionStructure: "",
      
      // Meeting preferences
      meetingType: "",
      faceToFaceLocation: "",
      
      // Additional details
      additionalDetails: "",
      
      // Transaction procedures and legal framework
      transactionProcedures: "1. Both parties sign the Soft Corporate Offer (SCO).\n2. Buyer issues Letter of Intent (LOI) and provides proof of funds.\n3. Seller verifies buyer's credentials and proof of funds.\n4. Parties negotiate and agree on final terms through GECAN platform.\n5. Buyer conducts due diligence via GECAN verification services.\n6. Both parties sign the final contract and proceed with transaction.\n7. Buyer makes payment according to agreed terms and conditions.\n8. Seller arranges delivery based on the contract specifications.",
      legalFramework: "This Soft Corporate Offer (SCO) is governed by international commercial laws and regulations including but not limited to the United Nations Convention on Contracts for the International Sale of Goods (CISG), where applicable, and supplemented by the laws of the jurisdiction specified in the final agreement.\n\nAll transactions facilitated through the GECAN platform are subject to Know Your Customer (KYC) and Anti-Money Laundering (AML) verification in compliance with international standards and regulations.\n\nThis document serves as an invitation to treat and not a binding offer until formalized through proper contractual agreements between the parties."
    }
  });

  // Create a form for BTC offers
  const btcForm = useForm<z.infer<typeof btcOfferSchema>>({
    resolver: zodResolver(btcOfferSchema),
    defaultValues: {
      // Seller identification
      sellerId: `GECAN-CRPT-BTC-S-${Date.now().toString().slice(-3)}`,
      offerValidity: "14 days from submission date",
      sellerCompany: "",
      sellerNationality: "",
      sellerTimeZone: "",
      sellerResponseTime: "24 hours",
      transactionType: "Remote",
      
      // Commodity details
      quantity: "",
      location: "",
      origin: "",
      tradingPair: "BTC/USDT",
      transactionPlatform: "",
      walletRequirements: "",
      
      // Pricing and terms
      priceType: "",
      premium: "",
      discountGross: "",
      discountNet: "",
      
      // Logistics and transaction details
      incoterms: "",
      paymentMethod: "Bank Transfer", // Default payment method
      settlementTime: "",
      minTransaction: "",
      maxTransaction: "",
      contractDuration: "",
      
      // Compliance and requirements
      kycRequirements: "",
      paymentGuarantee: "",
      performanceBond: "",
      
      // Commission structure
      commissionStructure: "",
      
      // Meeting preferences
      meetingType: "Remote",
      faceToFaceLocation: "",
      
      // Additional details
      additionalDetails: "",
      additionalConditions: "",
      
      // Transaction procedures and legal framework
      transactionProcedures: "1. Both parties sign the Soft Corporate Offer (SCO).\n2. Buyer issues Intent to Purchase and provides proof of funds.\n3. Seller verifies buyer's credentials and compliance documentation.\n4. Parties agree on exchange rate and premium through GECAN escrow service.\n5. Buyer conducts due diligence via GECAN verification services.\n6. Both parties sign the final digital contract via the GECAN platform.\n7. Transaction executed through secure BTC wallet addresses with proper verification.\n8. Settlement confirmation provided to both parties through the platform.",
      legalFramework: "This cryptocurrency transaction is governed by applicable digital asset regulations and compliance requirements in the jurisdictions of both parties.\n\nAll transactions facilitated through the GECAN platform are subject to Know Your Customer (KYC) and Anti-Money Laundering (AML) verification in compliance with international standards.\n\nThis document serves as an invitation to treat and not a binding offer until formalized through proper digital contractual agreements between the parties with appropriate cryptographic signatures."
    }
  });

  // Create a form for USDT offers
  const usdtForm = useForm<z.infer<typeof usdtOfferSchema>>({
    resolver: zodResolver(usdtOfferSchema),
    defaultValues: {
      // Seller identification
      sellerId: `GECAN-CRPT-USDT-S-${Date.now().toString().slice(-3)}`,
      offerValidity: "14 days from submission date",
      sellerCompany: "",
      sellerNationality: "",
      sellerTimeZone: "",
      sellerResponseTime: "24 hours",
      transactionType: "Remote",
      
      // Commodity details
      quantity: "",
      network: "",
      location: "",
      origin: "",
      tradingPair: "USDT/USD",
      transactionPlatform: "",
      walletRequirements: "",
      
      // Pricing and terms
      priceType: "",
      premium: "",
      discountGross: "",
      discountNet: "",
      
      // Logistics and transaction details
      incoterms: "",
      paymentMethod: "Bank Transfer", // Default payment method
      settlementTime: "",
      minTransaction: "",
      maxTransaction: "",
      contractDuration: "",
      
      // Compliance and requirements
      kycRequirements: "",
      paymentGuarantee: "",
      performanceBond: "",
      
      // Commission structure
      commissionStructure: "",
      
      // Meeting preferences
      meetingType: "Remote",
      faceToFaceLocation: "",
      
      // Additional details
      additionalDetails: "",
      additionalConditions: "",
      
      // Transaction procedures and legal framework
      transactionProcedures: "1. Both parties sign the Soft Corporate Offer (SCO).\n2. Buyer issues Intent to Purchase and provides proof of funds.\n3. Seller verifies buyer's credentials and compliance documentation.\n4. Parties agree on exchange rate and premium through GECAN escrow service.\n5. Buyer conducts due diligence via GECAN verification services.\n6. Both parties sign the final digital contract via the GECAN platform.\n7. Transaction executed through secure USDT wallet addresses with proper verification.\n8. Settlement confirmation provided to both parties through the platform.",
      legalFramework: "This stablecoin transaction is governed by applicable digital asset regulations and compliance requirements in the jurisdictions of both parties.\n\nAll transactions facilitated through the GECAN platform are subject to Know Your Customer (KYC) and Anti-Money Laundering (AML) verification in compliance with international standards.\n\nThis document serves as an invitation to treat and not a binding offer until formalized through proper digital contractual agreements between the parties with appropriate cryptographic signatures."
    }
  });

  // Create a form for petroleum offers
  const petroForm = useForm<z.infer<typeof petroleumOfferSchema>>({
    resolver: zodResolver(petroleumOfferSchema),
    defaultValues: {
      product: "",
      specification: "",
      quantity: "",
      quantityUnit: "barrels",
      origin: "",
      deliveryLocation: "",
      price: "",
      incoterm: "",
      paymentTerms: "",
      additionalDetails: "",
      transactionProcedures: "1. Parties exchange Soft Corporate Offer and conduct initial due diligence.\n2. Buyer provides formal Letter of Intent (LOI) and proof of funds.\n3. Seller provides quality certificates and available allocation documentation.\n4. Parties negotiate specific terms through GECAN platform facilitation.\n5. Both parties sign a formal Sales and Purchase Agreement (SPA).\n6. Buyer arranges inspection and verification of product at loading port.\n7. Payment and delivery proceed according to the agreed incoterms.\n8. Final transaction reconciliation and documentation is processed.",
      legalFramework: "This petroleum transaction is governed by applicable international trade laws, including Uniform Customs and Practice for Documentary Credits (UCP600) for payment arrangements and ICC Incoterms 2020 for delivery terms.\n\nAll contracts shall be executed in compliance with regulations of the International Maritime Organization (IMO) and relevant jurisdictional laws governing the trade of petroleum products.\n\nDisputes shall be resolved through arbitration under the rules of the International Chamber of Commerce (ICC) in a mutually agreed jurisdiction, with English as the governing language."
    }
  });
  
  // Create a form for cash pallet offers
  const cashForm = useForm<z.infer<typeof cashOfferSchema>>({
    resolver: zodResolver(cashOfferSchema),
    defaultValues: {
      currency: "",
      denomination: "",
      totalFaceValue: "",
      location: "",
      discountRate: "",
      netPrice: "",
      securityFeatures: "",
      origin: "",
      authenticityVerification: "",
      additionalDetails: "",
      transactionProcedures: "1. Both parties sign the Soft Corporate Offer (SCO).\n2. Buyer issues Letter of Intent (LOI) and provides proof of funds.\n3. Seller provides origin documentation and authenticity verification.\n4. Verification and due diligence conducted through GECAN verification service.\n5. Both parties sign a comprehensive Purchase Agreement.\n6. Secure custody transfer and payment arrangements are established.\n7. Transaction settlement through approved banking channels.\n8. Confirmation of receipt and transaction completion through GECAN platform.",
      legalFramework: "This transaction is governed by applicable international banking regulations, anti-money laundering laws, and counter-terrorism financing regulations in the jurisdictions of both parties.\n\nThe transfer of cash assets shall comply with all currency export/import regulations in the relevant jurisdictions, with proper customs declarations as required.\n\nAll transactions facilitated through the GECAN platform are subject to stringent Know Your Customer (KYC) and Anti-Money Laundering (AML) verification in compliance with international standards and FATF recommendations."
    }
  });
  
  // Create a form for SBLC Monetizer offers
  const sblcMonetizerForm = useForm<z.infer<typeof sblcMonetizerOfferSchema>>({
    resolver: zodResolver(sblcMonetizerOfferSchema),
    defaultValues: {
      monetizationProgram: "",
      acceptedIssuers: "",
      minAmount: "",
      maxAmount: "",
      ltv: "",
      discountRate: "",
      monetizationPeriod: "",
      paymentTerms: "",
      fees: "",
      requirementsDocumentation: "",
      additionalDetails: "",
      transactionProcedures: "1. Client submits SBLC monetization inquiry through GECAN platform.\n2. Monetizer reviews preliminary documentation and sends SCO.\n3. Client provides complete SBLC details and issuing bank information.\n4. Monetizer conducts due diligence on the instrument and issuer.\n5. Both parties execute monetization agreement with specific terms.\n6. SBLC is verified through bank-to-bank communication channels.\n7. Funds are disbursed according to agreed schedule and terms.\n8. Monitoring and compliance reporting throughout the monetization period.",
      legalFramework: "This monetization service is governed by international banking practices including the International Chamber of Commerce (ICC) Uniform Rules for Bank-to-Bank Reimbursements under Documentary Credits and applicable financial regulations in the jurisdictions of both parties.\n\nAll documentation shall comply with international standards for financial instruments, including Swift MT760 protocols where applicable.\n\nDisputes shall be resolved through mediation and arbitration under ICC rules in an agreed neutral jurisdiction, with English as the governing language."
    }
  });
  
  // Create a form for SBLC Provider offers
  const sblcProviderForm = useForm<z.infer<typeof sblcProviderOfferSchema>>({
    resolver: zodResolver(sblcProviderOfferSchema),
    defaultValues: {
      providerBank: "",
      bankRating: "",
      sblcValue: "",
      issuePrice: "",
      leasePrice: "",
      validation: "",
      issuanceTime: "",
      eligibility: "",
      useRestrictions: "",
      documentationRequired: "",
      additionalDetails: "",
      transactionProcedures: "1. Client submits SBLC issuance or lease inquiry through GECAN platform.\n2. Provider sends SCO with detailed terms and conditions.\n3. Client provides required KYC documentation and business purpose details.\n4. Provider conducts comprehensive client verification and risk assessment.\n5. Both parties sign SBLC issuance/lease agreement with specific terms.\n6. Client fulfills fee payment requirements according to agreement terms.\n7. Provider arranges for SBLC issuance through specified banking channels.\n8. SBLC is delivered via Swift MT760 or comparable secure method.",
      legalFramework: "This SBLC provision service is governed by international banking regulations including the Uniform Customs and Practice for Documentary Credits (UCP 600), International Standard Banking Practice (ISBP), and International Standby Practices (ISP98) as applicable.\n\nThe instrument shall comply with all relevant banking regulations in both the issuing and receiving jurisdictions, with proper compliance monitoring throughout its validity period.\n\nDisputes shall be resolved through arbitration under the rules of a mutually agreed international arbitration body, with English as the governing language."
    }
  });

  // Submit handler for gold offer
  const handleGoldOfferSubmit = async (data: z.infer<typeof goldOfferSchema>) => {
    try {
      // If we're editing an existing offer
      if (isEditingOffer && editOfferData) {
        // Update existing offer with new data
        await apiRequest("PATCH", `/api/seller-offers/${editOfferData.id}`, {
          commodityDetails: data
        });
        
        toast({
          title: "Offer Updated",
          description: "The gold offer has been updated successfully",
        });
        
        // Reset edit state
        setIsEditingOffer(false);
        setEditOfferData(null);
      } else {
        // Generate a unique offer ID for new offer
        const offerId = `GO-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
        
        // Create seller offer payload
        const newOffer: InsertSellerOffer = {
          offerId,
          sellerUserId: user?.id as number,
          offerType: "GOLD",
          status: "Pending Approval",
          commodityDetails: data,
        };
        
        // Submit the new offer
        await apiRequest("POST", "/api/seller-offers", newOffer);
        
        toast({
          title: "Offer Created",
          description: "Your gold offer has been submitted for approval",
        });
      }
      
      // Close modal and invalidate queries
      setNewOfferModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      goldForm.reset();
    } catch (error: any) {
      toast({
        title: isEditingOffer ? "Error Updating Offer" : "Error Creating Offer",
        description: error.message || `Failed to ${isEditingOffer ? 'update' : 'create'} offer`,
        variant: "destructive",
      });
    }
  };

  // Submit handler for BTC offer
  const handleBtcOfferSubmit = async (data: z.infer<typeof btcOfferSchema>) => {
    try {
      // If we're editing an existing offer
      if (isEditingOffer && editOfferData) {
        // Update existing offer with new data
        await apiRequest("PATCH", `/api/seller-offers/${editOfferData.id}`, {
          commodityDetails: data
        });
        
        toast({
          title: "Offer Updated",
          description: "The Bitcoin offer has been updated successfully",
        });
        
        // Reset edit state
        setIsEditingOffer(false);
        setEditOfferData(null);
      } else {
        // Generate a unique offer ID for new offer
        const offerId = `BTC-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
        
        // Create seller offer payload
        const newOffer: InsertSellerOffer = {
          offerId,
          sellerUserId: user?.id as number,
          offerType: "BTC",
          status: "Pending Approval",
          commodityDetails: data,
        };
        
        // Submit the new offer
        await apiRequest("POST", "/api/seller-offers", newOffer);
        
        toast({
          title: "Offer Created",
          description: "Your Bitcoin offer has been submitted for approval",
        });
      }
      
      // Close modal and invalidate queries
      setNewOfferModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      btcForm.reset();
    } catch (error: any) {
      toast({
        title: isEditingOffer ? "Error Updating Offer" : "Error Creating Offer",
        description: error.message || `Failed to ${isEditingOffer ? 'update' : 'create'} offer`,
        variant: "destructive",
      });
    }
  };

  // Submit handler for USDT offer
  const handleUsdtOfferSubmit = async (data: z.infer<typeof usdtOfferSchema>) => {
    try {
      // If we're editing an existing offer
      if (isEditingOffer && editOfferData) {
        // Update existing offer with new data
        await apiRequest("PATCH", `/api/seller-offers/${editOfferData.id}`, {
          commodityDetails: data
        });
        
        toast({
          title: "Offer Updated",
          description: "The USDT offer has been updated successfully",
        });
        
        // Reset edit state
        setIsEditingOffer(false);
        setEditOfferData(null);
      } else {
        // Generate a unique offer ID for new offer
        const offerId = `USDT-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
        
        // Create seller offer payload
        const newOffer: InsertSellerOffer = {
          offerId,
          sellerUserId: user?.id as number,
          offerType: "USDT",
          status: "Pending Approval",
          commodityDetails: data,
        };
        
        // Submit the new offer
        await apiRequest("POST", "/api/seller-offers", newOffer);
        
        toast({
          title: "Offer Created",
          description: "Your USDT offer has been submitted for approval",
        });
      }
      
      // Close modal and invalidate queries
      setNewOfferModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      usdtForm.reset();
    } catch (error: any) {
      toast({
        title: isEditingOffer ? "Error Updating Offer" : "Error Creating Offer",
        description: error.message || `Failed to ${isEditingOffer ? 'update' : 'create'} offer`,
        variant: "destructive",
      });
    }
  };

  // Submit handler for petroleum offer
  const handlePetroleumOfferSubmit = async (data: z.infer<typeof petroleumOfferSchema>) => {
    try {
      // If we're editing an existing offer
      if (isEditingOffer && editOfferData) {
        // Update existing offer with new data
        await apiRequest("PATCH", `/api/seller-offers/${editOfferData.id}`, {
          commodityDetails: data
        });
        
        toast({
          title: "Offer Updated",
          description: "The petroleum offer has been updated successfully",
        });
        
        // Reset edit state
        setIsEditingOffer(false);
        setEditOfferData(null);
      } else {
        // Generate a unique offer ID for new offer
        const offerId = `PO-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
        
        // Create seller offer payload
        const newOffer: InsertSellerOffer = {
          offerId,
          sellerUserId: user?.id as number,
          offerType: "PETRO",
          status: "Pending Approval",
          commodityDetails: data,
        };
        
        // Submit the new offer
        await apiRequest("POST", "/api/seller-offers", newOffer);
        
        toast({
          title: "Offer Created",
          description: "Your petroleum offer has been submitted for approval",
        });
      }
      
      // Close modal and invalidate queries
      setNewOfferModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      petroForm.reset();
    } catch (error: any) {
      toast({
        title: isEditingOffer ? "Error Updating Offer" : "Error Creating Offer",
        description: error.message || `Failed to ${isEditingOffer ? 'update' : 'create'} offer`,
        variant: "destructive",
      });
    }
  };
  
  // Submit handler for cash pallet offer
  const handleCashOfferSubmit = async (data: z.infer<typeof cashOfferSchema>) => {
    try {
      // If we're editing an existing offer
      if (isEditingOffer && editOfferData) {
        // Update existing offer with new data
        await apiRequest("PATCH", `/api/seller-offers/${editOfferData.id}`, {
          commodityDetails: data
        });
        
        toast({
          title: "Offer Updated",
          description: "The cash pallet offer has been updated successfully",
        });
        
        // Reset edit state
        setIsEditingOffer(false);
        setEditOfferData(null);
      } else {
        // Generate a unique offer ID for new offer
        const offerId = `CASH-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
        
        // Create seller offer payload
        const newOffer: InsertSellerOffer = {
          offerId,
          sellerUserId: user?.id as number,
          offerType: "PALLET",
          status: "Pending Approval",
          commodityDetails: data,
        };
        
        // Submit the new offer
        await apiRequest("POST", "/api/seller-offers", newOffer);
        
        toast({
          title: "Offer Created",
          description: "Your cash pallet offer has been submitted for approval",
        });
      }
      
      // Close modal and invalidate queries
      setNewOfferModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      cashForm.reset();
    } catch (error: any) {
      toast({
        title: isEditingOffer ? "Error Updating Offer" : "Error Creating Offer",
        description: error.message || `Failed to ${isEditingOffer ? 'update' : 'create'} offer`,
        variant: "destructive",
      });
    }
  };
  
  // Submit handler for SBLC Monetizer offer
  const handleSblcMonetizerOfferSubmit = async (data: z.infer<typeof sblcMonetizerOfferSchema>) => {
    try {
      // If we're editing an existing offer
      if (isEditingOffer && editOfferData) {
        // Update existing offer with new data
        await apiRequest("PATCH", `/api/seller-offers/${editOfferData.id}`, {
          commodityDetails: data
        });
        
        toast({
          title: "Offer Updated",
          description: "The SBLC monetizer offer has been updated successfully",
        });
        
        // Reset edit state
        setIsEditingOffer(false);
        setEditOfferData(null);
      } else {
        // Generate a unique offer ID for new offer
        const offerId = `SBLCM-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
        
        // Create seller offer payload
        const newOffer: InsertSellerOffer = {
          offerId,
          sellerUserId: user?.id as number,
          offerType: "SBLCM",
          status: "Pending Approval",
          commodityDetails: data,
        };
        
        // Submit the new offer
        await apiRequest("POST", "/api/seller-offers", newOffer);
        
        toast({
          title: "Offer Created",
          description: "Your SBLC monetizer offer has been submitted for approval",
        });
      }
      
      // Close modal and invalidate queries
      setNewOfferModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      sblcMonetizerForm.reset();
    } catch (error: any) {
      toast({
        title: isEditingOffer ? "Error Updating Offer" : "Error Creating Offer",
        description: error.message || `Failed to ${isEditingOffer ? 'update' : 'create'} offer`,
        variant: "destructive",
      });
    }
  };
  
  // Submit handler for SBLC Provider offer
  const handleSblcProviderOfferSubmit = async (data: z.infer<typeof sblcProviderOfferSchema>) => {
    try {
      // If we're editing an existing offer
      if (isEditingOffer && editOfferData) {
        // Update existing offer with new data
        await apiRequest("PATCH", `/api/seller-offers/${editOfferData.id}`, {
          commodityDetails: data
        });
        
        toast({
          title: "Offer Updated",
          description: "The SBLC provider offer has been updated successfully",
        });
        
        // Reset edit state
        setIsEditingOffer(false);
        setEditOfferData(null);
      } else {
        // Generate a unique offer ID for new offer
        const offerId = `SBLCP-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
        
        // Create seller offer payload
        const newOffer: InsertSellerOffer = {
          offerId,
          sellerUserId: user?.id as number,
          offerType: "SBLCP",
          status: "Pending Approval",
          commodityDetails: data,
        };
        
        // Submit the new offer
        await apiRequest("POST", "/api/seller-offers", newOffer);
        
        toast({
          title: "Offer Created",
          description: "Your SBLC provider offer has been submitted for approval",
        });
      }
      
      // Close modal and invalidate queries
      setNewOfferModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
      sblcProviderForm.reset();
    } catch (error: any) {
      toast({
        title: isEditingOffer ? "Error Updating Offer" : "Error Creating Offer",
        description: error.message || `Failed to ${isEditingOffer ? 'update' : 'create'} offer`,
        variant: "destructive",
      });
    }
  };

  // Format date relative to current time
  const formatRelativeTime = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };
  


  // Get commodity type badge
  const getCommodityTypeBadge = (type: string) => {
    const typeColors: Record<string, { bg: string, text: string, icon: React.ReactNode }> = {
      "GOLD": { bg: "bg-yellow-100", text: "text-yellow-800", icon: <Tag className="h-3 w-3 mr-1" /> },
      "BTC": { bg: "bg-orange-100", text: "text-orange-800", icon: <Tag className="h-3 w-3 mr-1" /> },
      "USDT": { bg: "bg-green-100", text: "text-green-800", icon: <Tag className="h-3 w-3 mr-1" /> },
      "PALLET": { bg: "bg-blue-100", text: "text-blue-800", icon: <Tag className="h-3 w-3 mr-1" /> },
      "PETRO": { bg: "bg-purple-100", text: "text-purple-800", icon: <Tag className="h-3 w-3 mr-1" /> },
      "SBLCM": { bg: "bg-indigo-100", text: "text-indigo-800", icon: <Tag className="h-3 w-3 mr-1" /> },
      "SBLCP": { bg: "bg-teal-100", text: "text-teal-800", icon: <Tag className="h-3 w-3 mr-1" /> }
    };
    
    const { bg, text, icon } = typeColors[type] || { bg: "bg-neutral-100", text: "text-neutral-800", icon: <Tag className="h-3 w-3 mr-1" /> };
    
    return (
      <Badge variant="outline" className={`${bg} ${text} border-transparent flex items-center`}>
        {icon}
        {type}
      </Badge>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-transparent flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
            Active
          </Badge>
        );
      case "pending approval":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-transparent flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1.5"></span>
            Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-transparent flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 mr-1.5"></span>
            Expired
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

  // Render gold offer details
  const renderGoldOfferDetails = (details: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Type:</span>
          <span className="ml-1 font-medium">{details.goldType}</span>
        </div>
        <div className="flex items-center">
          <Tag className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Purity:</span>
          <span className="ml-1 font-medium">{details.purity}</span>
        </div>
        <div className="flex items-center">
          <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Quantity:</span>
          <span className="ml-1 font-medium">
            {details.quantity} {details.quantityUnit}
          </span>
        </div>
        <div className="flex items-center">
          <Map className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Location:</span>
          <span className="ml-1 font-medium">{details.location}</span>
        </div>
      </div>
    );
  };

  // Render BTC offer details
  const renderBtcOfferDetails = (details: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <Bitcoin className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Quantity:</span>
          <span className="ml-1 font-medium">{details.quantity} BTC</span>
        </div>
        <div className="flex items-center">
          <Map className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Location:</span>
          <span className="ml-1 font-medium">{details.location}</span>
        </div>
        <div className="flex items-center">
          <DollarSign className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Price Type:</span>
          <span className="ml-1 font-medium">{details.priceType}</span>
        </div>
        <div className="flex items-center">
          <Percent className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Premium:</span>
          <span className="ml-1 font-medium">{details.premium}</span>
        </div>
        <div className="flex items-center">
          <CreditCard className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Min Transaction:</span>
          <span className="ml-1 font-medium">{details.minTransaction} BTC</span>
        </div>
        <div className="flex items-center">
          <Timer className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Settlement Time:</span>
          <span className="ml-1 font-medium">{details.settlementTime}</span>
        </div>
      </div>
    );
  };
  
  // Render USDT offer details
  const renderUsdtOfferDetails = (details: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <CircleDollarSign className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Quantity:</span>
          <span className="ml-1 font-medium">{details.quantity} USDT</span>
        </div>
        <div className="flex items-center">
          <Globe className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Network:</span>
          <span className="ml-1 font-medium">{details.network}</span>
        </div>
        <div className="flex items-center">
          <Map className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Location:</span>
          <span className="ml-1 font-medium">{details.location}</span>
        </div>
        <div className="flex items-center">
          <DollarSign className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Price Type:</span>
          <span className="ml-1 font-medium">{details.priceType}</span>
        </div>
        <div className="flex items-center">
          <Percent className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Premium:</span>
          <span className="ml-1 font-medium">{details.premium}</span>
        </div>
        <div className="flex items-center">
          <Timer className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Settlement Time:</span>
          <span className="ml-1 font-medium">{details.settlementTime}</span>
        </div>
      </div>
    );
  };

  // Render petroleum offer details
  const renderPetroleumOfferDetails = (details: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Product:</span>
          <span className="ml-1 font-medium">{details.product}</span>
        </div>
        <div className="flex items-center">
          <Tag className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Origin:</span>
          <span className="ml-1 font-medium">{details.origin}</span>
        </div>
        <div className="flex items-center">
          <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Quantity:</span>
          <span className="ml-1 font-medium">
            {details.quantity} {details.quantityUnit}
          </span>
        </div>
        <div className="flex items-center">
          <Truck className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Delivery:</span>
          <span className="ml-1 font-medium">{details.deliveryLocation}</span>
        </div>
      </div>
    );
  };

  // Render offer details based on type
  const renderOfferDetails = (offer: SellerOffer) => {
    const details = offer.commodityDetails as Record<string, any>;
    
    switch (offer.offerType) {
      case "GOLD":
        return renderGoldOfferDetails(details);
      case "BTC":
        return renderBtcOfferDetails(details);
      case "USDT":
        return renderUsdtOfferDetails(details);
      case "PETRO":
        return renderPetroleumOfferDetails(details);
      default:
        return (
          <div className="text-sm text-neutral-500">
            <pre className="text-xs overflow-hidden">{JSON.stringify(details, null, 2).substring(0, 100)}...</pre>
          </div>
        );
    }
  };
  
  // Handle clicking View Details button
  const handleViewOfferDetails = async (offer: SellerOffer) => {
    setSelectedOffer(offer);
    setOfferDetailsDialogOpen(true);
    
    // Clear previous seller info
    setSellerInfo(null);
    
    // If admin, fetch seller user information
    if (user?.role === "GECAN_Admin" && offer.sellerUserId) {
      try {
        const response = await fetch(`/api/users/${offer.sellerUserId}`);
        if (response.ok) {
          const sellerData = await response.json();
          setSellerInfo(sellerData);
        }
      } catch (error) {
        console.error("Failed to fetch seller information:", error);
      }
    }
  };
  
  // Handle submitting a question about an offer
  const handleSubmitQuestion = async () => {
    if (!selectedOffer || !offerQuestion.trim()) return;
    
    setSubmittingQuestion(true);
    
    try {
      // Send the enquiry question to the admin email
      await apiRequest("POST", "/api/offer-enquiry", {
        offerId: selectedOffer.id,
        question: offerQuestion,
        userId: user?.id,
        userEmail: user?.email,
        offerRefId: selectedOffer.offerId,
      });
      
      toast({
        title: "Question Submitted",
        description: "Your question about this offer has been sent to the GECAN admin team.",
      });
      
      setOfferQuestion("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingQuestion(false);
    }
  };
  
  // Generate a PDF of the offer
  const handleGeneratePdf = async () => {
    if (!selectedOffer) return;
    
    setGeneratePdfLoading(true);
    
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set document properties
      doc.setProperties({
        title: `Soft Corporate Offer - ${selectedOffer.offerId}`,
        subject: 'GECAN Soft Corporate Offer',
        author: 'GECAN Platform',
        creator: 'GECAN Super WebApp'
      });
      
      // Add GECAN logo
      // For a real implementation, use an actual logo image
      doc.setFontSize(24);
      doc.setTextColor(35, 54, 86); // GECAN blue
      doc.text("GECAN", 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text("Global Energy & Commodities Alliance Network", 105, 27, { align: 'center' });
      
      // Document title
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("SOFT CORPORATE OFFER (SCO)", 105, 40, { align: 'center' });
      
      // Reference number and date
      doc.setFontSize(11);
      doc.text(`Reference: SCO-${selectedOffer.offerId}`, 20, 50);
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, 20, 55);
      
      // Horizontal line
      doc.setDrawColor(35, 54, 86);
      doc.line(20, 60, 190, 60);
      
      // Offer details
      doc.setFontSize(12);
      doc.text("OFFER DETAILS", 20, 70);
      
      doc.setFontSize(10);
      doc.text(`Offer Type: ${selectedOffer.offerType}`, 20, 80);
      
      // Handle different offer types
      const commodityDetails = selectedOffer.commodityDetails;
      let detailsY = 85;
      
      if (selectedOffer.offerType === "GOLD") {
        doc.text(`Gold Type: ${commodityDetails.goldType || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Purity: ${commodityDetails.purity || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Quantity: ${commodityDetails.quantity || "N/A"} ${commodityDetails.quantityUnit || ""}`, 20, detailsY); detailsY += 5;
        doc.text(`Location: ${commodityDetails.location || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Incoterm: ${commodityDetails.incoterm || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Price Basis: ${commodityDetails.priceBasis || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Discount/Premium: ${commodityDetails.discountPremium || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Net Discount: ${commodityDetails.netDiscount || "N/A"}`, 20, detailsY); detailsY += 5;
      } else if (selectedOffer.offerType === "BTC") {
        doc.text(`Quantity: ${commodityDetails.quantity || "N/A"} BTC`, 20, detailsY); detailsY += 5;
        doc.text(`Location: ${commodityDetails.location || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Price Type: ${commodityDetails.priceType || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Premium: ${commodityDetails.premium || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Min Transaction: ${commodityDetails.minTransaction || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Max Transaction: ${commodityDetails.maxTransaction || "N/A"}`, 20, detailsY); detailsY += 5;
      } else if (selectedOffer.offerType === "USDT") {
        doc.text(`Quantity: ${commodityDetails.quantity || "N/A"} USDT`, 20, detailsY); detailsY += 5;
        doc.text(`Network: ${commodityDetails.network || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Location: ${commodityDetails.location || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Price Type: ${commodityDetails.priceType || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Premium: ${commodityDetails.premium || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Min Transaction: ${commodityDetails.minTransaction || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Max Transaction: ${commodityDetails.maxTransaction || "N/A"}`, 20, detailsY); detailsY += 5;
      } else if (selectedOffer.offerType === "PETRO") {
        doc.text(`Product: ${commodityDetails.product || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Specification: ${commodityDetails.specification || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Quantity: ${commodityDetails.quantity || "N/A"} ${commodityDetails.quantityUnit || ""}`, 20, detailsY); detailsY += 5;
        doc.text(`Origin: ${commodityDetails.origin || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Delivery Location: ${commodityDetails.deliveryLocation || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Price: ${commodityDetails.price || "N/A"}`, 20, detailsY); detailsY += 5;
        doc.text(`Incoterm: ${commodityDetails.incoterm || "N/A"}`, 20, detailsY); detailsY += 5;
      } else {
        // Generic display for other offer types
        Object.entries(commodityDetails).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            doc.text(`${key}: ${value}`, 20, detailsY);
            detailsY += 5;
          }
        });
      }
      
      // Transaction Procedures
      detailsY += 5;
      doc.setFontSize(12);
      doc.text("TRANSACTION PROCEDURES", 20, detailsY);
      detailsY += 8;
      
      doc.setFontSize(10);
      const procedures = commodityDetails.transactionProcedures || "No transaction procedures specified.";
      const procedureLines = doc.splitTextToSize(procedures, 170);
      doc.text(procedureLines, 20, detailsY);
      detailsY += procedureLines.length * 5 + 10;
      
      // Legal Framework
      doc.setFontSize(12);
      doc.text("LEGAL FRAMEWORK", 20, detailsY);
      detailsY += 8;
      
      doc.setFontSize(10);
      const legal = commodityDetails.legalFramework || "No legal framework specified.";
      const legalLines = doc.splitTextToSize(legal, 170);
      doc.text(legalLines, 20, detailsY);
      detailsY += legalLines.length * 5 + 15;
      
      // Footer
      doc.setFontSize(8);
      doc.text("This document is confidential and provided by GECAN Platform for authorized recipients only.", 105, 280, { align: 'center' });
      doc.text("For more information, please contact support@gecan.global", 105, 285, { align: 'center' });
      
      // Save the PDF
      doc.save(`SCO-${selectedOffer.offerId}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "The Soft Corporate Offer has been prepared and downloaded.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratePdfLoading(false);
    }
  };

  // Admin operation state variables
  const [isEditingOffer, setIsEditingOffer] = useState(false);
  const [editOfferData, setEditOfferData] = useState<Partial<SellerOffer> | null>(null);
  const [requestModificationDialogOpen, setRequestModificationDialogOpen] = useState(false);
  const [modificationReason, setModificationReason] = useState("");

  // Handle edit offer (admin)
  const handleEditOffer = (offer: SellerOffer) => {
    setEditOfferData(offer);
    setIsEditingOffer(true);
    setOfferDetailsDialogOpen(false);
    // Open edit dialog or switch to edit mode in current dialog
    // For this implementation, we'll reuse the offer type selection and form system
    setSelectedOfferType(offer.offerType);
    setNewOfferModalOpen(true);
    
    // Populate form based on offer type
    if (offer.offerType === "GOLD") {
      goldForm.reset(offer.commodityDetails as any);
    } else if (offer.offerType === "BTC") {
      btcForm.reset(offer.commodityDetails as any);
    } else if (offer.offerType === "USDT") {
      usdtForm.reset(offer.commodityDetails as any);
    } else if (offer.offerType === "PETRO") {
      petroForm.reset(offer.commodityDetails as any);
    } else if (offer.offerType === "PALLET") {
      cashForm.reset(offer.commodityDetails as any);
    } else if (offer.offerType === "SBLCM") {
      sblcMonetizerForm.reset(offer.commodityDetails as any);
    } else if (offer.offerType === "SBLCP") {
      sblcProviderForm.reset(offer.commodityDetails as any);
    }
  };

  // Handle update offer status (admin)
  const handleUpdateOfferStatus = async (offerId: number, newStatus: string) => {
    try {
      // Call the real API endpoint to update the status
      await apiRequest("PATCH", `/api/seller-offers/${offerId}`, {
        status: newStatus
      });
      
      toast({
        title: "Status Updated",
        description: `Offer status updated to ${newStatus}`,
      });
      
      // Close the dialog after updating
      setOfferDetailsDialogOpen(false);
      
      // Refresh the offers list to reflect the changes
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
    } catch (error: any) {
      toast({
        title: "Error Updating Status",
        description: error.message || "Failed to update offer status",
        variant: "destructive",
      });
    }
  };

  // Handle delete offer (admin)
  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm("Are you sure you want to delete this offer? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Call the API endpoint to update the offer status to "Deleted"
      await apiRequest("PATCH", `/api/seller-offers/${offerId}`, {
        status: "Deleted"
      });
      
      toast({
        title: "Offer Deleted",
        description: "The offer has been marked as deleted",
      });
      
      // Close the dialog after deleting
      setOfferDetailsDialogOpen(false);
      
      // Refresh the offers list to reflect the changes
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
    } catch (error: any) {
      toast({
        title: "Error Deleting Offer",
        description: error.message || "Failed to delete offer",
        variant: "destructive",
      });
    }
  };

  // Handle request modification (regular user)
  const handleRequestModification = (offer: SellerOffer) => {
    setRequestModificationDialogOpen(true);
  };

  // Handle submit modification request
  const handleSubmitModificationRequest = async () => {
    if (!selectedOffer || !modificationReason.trim()) return;
    
    try {
      // Update the offer with a pending modification request and store the reason
      await apiRequest("PATCH", `/api/seller-offers/${selectedOffer.id}`, {
        status: "Modification Requested",
        modificationReason: modificationReason,
        // Store original status to restore if rejected
        originalStatus: selectedOffer.status
      });
      
      toast({
        title: "Request Submitted",
        description: "Your modification request has been sent to the GECAN admin team.",
      });
      
      setRequestModificationDialogOpen(false);
      setModificationReason("");
      setOfferDetailsDialogOpen(false);
      
      // Refresh the offers list
      queryClient.invalidateQueries({ queryKey: ["/api/seller-offers"] });
    } catch (error: any) {
      toast({
        title: "Error Submitting Request",
        description: "Failed to submit modification request",
        variant: "destructive",
      });
    }
  };

  // Handle request deletion (regular user)
  const handleRequestDeletion = async (offerId: number) => {
    if (!confirm("Are you sure you want to request deletion of this offer?")) {
      return;
    }
    
    try {
      // In a real application, we would call an API endpoint to submit the request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Request Submitted",
        description: "Your deletion request has been sent to the GECAN admin team.",
      });
      
      // Close the dialog after submitting request
      setOfferDetailsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error Submitting Request",
        description: "Failed to submit deletion request",
        variant: "destructive",
      });
    }
  };

  // Buyer Enquiry form states and handlers
  const [newEnquiryModalOpen, setNewEnquiryModalOpen] = useState(false);
  const [selectedEnquiryType, setSelectedEnquiryType] = useState<string | null>(null);

  // Gold enquiry schema
  const goldEnquirySchema = z.object({
    desiredGoldType: z.string().min(1, "Gold type is required"),
    desiredPurity: z.string().min(1, "Purity is required"),
    quantityRequired: z.string().min(1, "Quantity is required"),
    quantityUnit: z.string().min(1, "Unit is required"),
    preferredLocation: z.string().min(1, "Location is required"),
    desiredIncoterm: z.string().min(1, "Incoterm is required"),
    maxPrice: z.string().optional(),
    paymentTerms: z.string().min(1, "Payment terms are required"),
    additionalRequirements: z.string().optional(),
  });
  
  // Petroleum enquiry schema
  const petroleumEnquirySchema = z.object({
    productRequired: z.string().min(1, "Product is required"),
    specification: z.string().min(1, "Specification is required"),
    quantityRequired: z.string().min(1, "Quantity is required"),
    quantityUnit: z.string().min(1, "Unit is required"),
    deliveryLocation: z.string().min(1, "Delivery location is required"),
    maxPrice: z.string().optional(),
    desiredIncoterm: z.string().min(1, "Incoterm is required"),
    paymentTerms: z.string().min(1, "Payment terms are required"),
    additionalRequirements: z.string().optional(),
  });
  
  // Create a form for gold enquiries
  const goldEnquiryForm = useForm<z.infer<typeof goldEnquirySchema>>({
    resolver: zodResolver(goldEnquirySchema),
    defaultValues: {
      desiredGoldType: "",
      desiredPurity: "",
      quantityRequired: "",
      quantityUnit: "kg",
      preferredLocation: "",
      desiredIncoterm: "",
      maxPrice: "",
      paymentTerms: "",
      additionalRequirements: "",
    }
  });
  
  // Create a form for petroleum enquiries
  const petroEnquiryForm = useForm<z.infer<typeof petroleumEnquirySchema>>({
    resolver: zodResolver(petroleumEnquirySchema),
    defaultValues: {
      productRequired: "",
      specification: "",
      quantityRequired: "",
      quantityUnit: "barrels",
      deliveryLocation: "",
      maxPrice: "",
      desiredIncoterm: "",
      paymentTerms: "",
      additionalRequirements: "",
    }
  });
  
  // Submit handler for gold enquiry
  const handleGoldEnquirySubmit = async (data: z.infer<typeof goldEnquirySchema>) => {
    try {
      // Generate a unique enquiry ID
      const enquiryId = `GE-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
      
      // Create buyer enquiry payload
      const newEnquiry: InsertBuyerEnquiry = {
        enquiryId,
        buyerUserId: user?.id as number,
        enquiryType: "GOLD",
        status: "Submitted",
        enquiryDetails: data,
      };
      
      // Submit the enquiry
      await apiRequest("POST", "/api/buyer-enquiries", newEnquiry);
      
      toast({
        title: "Enquiry Created",
        description: "Your gold enquiry has been submitted",
      });
      
      // Close modal and invalidate queries
      setNewEnquiryModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/buyer-enquiries"] });
      goldEnquiryForm.reset();
    } catch (error: any) {
      toast({
        title: "Error Creating Enquiry",
        description: error.message || "Failed to create enquiry",
        variant: "destructive",
      });
    }
  };

  // Submit handler for petroleum enquiry
  const handlePetroleumEnquirySubmit = async (data: z.infer<typeof petroleumEnquirySchema>) => {
    try {
      // Generate a unique enquiry ID
      const enquiryId = `PE-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
      
      // Create buyer enquiry payload
      const newEnquiry: InsertBuyerEnquiry = {
        enquiryId,
        buyerUserId: user?.id as number,
        enquiryType: "PETRO",
        status: "Submitted",
        enquiryDetails: data,
      };
      
      // Submit the enquiry
      await apiRequest("POST", "/api/buyer-enquiries", newEnquiry);
      
      toast({
        title: "Enquiry Created",
        description: "Your petroleum enquiry has been submitted",
      });
      
      // Close modal and invalidate queries
      setNewEnquiryModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/buyer-enquiries"] });
      petroEnquiryForm.reset();
    } catch (error: any) {
      toast({
        title: "Error Creating Enquiry",
        description: error.message || "Failed to create enquiry",
        variant: "destructive",
      });
    }
  };

  // Render petroleum enquiry details
  const renderPetroleumEnquiryDetails = (details: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Product:</span>
          <span className="ml-1 font-medium">{details.productRequired}</span>
        </div>
        <div className="flex items-center">
          <Tag className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Quantity:</span>
          <span className="ml-1 font-medium">{details.quantityRequired} {details.quantityUnit}</span>
        </div>
        <div className="flex items-center">
          <Truck className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Delivery:</span>
          <span className="ml-1 font-medium">{details.deliveryLocation}</span>
        </div>
        <div className="flex items-center">
          <DollarSign className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Max Price:</span>
          <span className="ml-1 font-medium">{details.maxPrice || "Negotiable"}</span>
        </div>
      </div>
    );
  };

  // Render gold enquiry details
  const renderGoldEnquiryDetails = (details: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Type:</span>
          <span className="ml-1 font-medium">{details.desiredGoldType}</span>
        </div>
        <div className="flex items-center">
          <Tag className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Purity:</span>
          <span className="ml-1 font-medium">{details.desiredPurity}</span>
        </div>
        <div className="flex items-center">
          <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Quantity:</span>
          <span className="ml-1 font-medium">{details.quantityRequired} {details.quantityUnit}</span>
        </div>
        <div className="flex items-center">
          <Map className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
          <span className="text-neutral-500">Location:</span>
          <span className="ml-1 font-medium">{details.preferredLocation}</span>
        </div>
      </div>
    );
  };

  // Render enquiry details based on type
  const renderEnquiryDetails = (enquiry: BuyerEnquiry) => {
    const details = enquiry.enquiryDetails as Record<string, any>;
    
    switch (enquiry.enquiryType) {
      case "GOLD":
        return renderGoldEnquiryDetails(details);
      case "PETRO":
        return renderPetroleumEnquiryDetails(details);
      default:
        return (
          <div className="text-sm text-neutral-500">
            <pre className="text-xs overflow-hidden">{JSON.stringify(details, null, 2).substring(0, 100)}...</pre>
          </div>
        );
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 animate-fadeIn">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Marketplace", href: "/marketplace" },
            activeTab === "offers" ? { label: "Seller Offers" } : { label: "Buyer Enquiries" }
          ]}
          backButton={false}
        />
        
        {/* Marketplace Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-2">
            <div>
              <h1 className="font-montserrat font-bold text-2xl text-neutral-800">GECAN Marketplace</h1>
              <p className="text-neutral-500">Discover premium commodities from vetted global partners</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                size="sm"
                className="font-medium"
                asChild
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> 
                  Back to Dashboard
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="bg-primary hover:bg-primary/90 flex items-center"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create New
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {(user?.role === "GECAN_Admin" || user?.memberType?.includes("Seller")) && (
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedOfferType(null);
                        setNewOfferModalOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>Create Seller Offer</span>
                    </DropdownMenuItem>
                  )}
                  {(user?.role === "GECAN_Admin" || user?.memberType?.includes("Buyer")) && (
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedEnquiryType(null);
                        setNewEnquiryModalOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <span>Create Buyer Enquiry</span>
                    </DropdownMenuItem>
                  )}
                  {user?.role === "GECAN_Admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/match-facilitation" className="cursor-pointer flex items-center">
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          <span>Match Facilitation</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Marketplace Metrics/Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-8">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="flex items-center p-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardDescription className="text-neutral-500">Active Offers</CardDescription>
                  <CardTitle className="text-2xl">{sellerOffers?.filter(o => o.status === "Active").length || 0}</CardTitle>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardContent className="flex items-center p-4">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mr-4">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardDescription className="text-neutral-500">Active Enquiries</CardDescription>
                  <CardTitle className="text-2xl">{buyerEnquiries?.filter(e => e.status === "Active").length || 0}</CardTitle>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
              <CardContent className="flex items-center p-4">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center mr-4">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardDescription className="text-neutral-500">Elite Members</CardDescription>
                  <CardTitle className="text-2xl">24</CardTitle>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <CardContent className="flex items-center p-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardDescription className="text-neutral-500">Recent Matches</CardDescription>
                  <CardTitle className="text-2xl">5</CardTitle>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Marketplace Content */}
        <div className="mb-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <TabsList className="mb-4 sm:mb-0">
                <TabsTrigger value="offers" className="relative">
                  Seller Offers
                  {sellerOffers && sellerOffers.length > 0 && (
                    <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-medium">
                      {sellerOffers.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="enquiries">
                  Buyer Enquiries
                  {buyerEnquiries && buyerEnquiries.length > 0 && (
                    <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-medium">
                      {buyerEnquiries.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <div className="flex sm:flex-row flex-col sm:space-x-2 space-y-2 sm:space-y-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search marketplace..."
                    className="pl-9 w-full sm:w-[200px] md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <span className="flex items-center">
                      <Tag className="mr-2 h-4 w-4 text-neutral-400" />
                      <SelectValue placeholder="Type" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="PETRO">Petroleum</SelectItem>
                    <SelectItem value="BTC">Bitcoin</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="PALLET">Pallet</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <span className="flex items-center">
                      <SlidersHorizontal className="mr-2 h-4 w-4 text-neutral-400" />
                      <SelectValue placeholder="Status" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending approval">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value="offers" className="mt-0">
              {offersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-neutral-100 p-3 text-neutral-500">
                    <Tag className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No offers found</h3>
                  <p className="mt-2 text-sm text-neutral-500 max-w-sm">
                    {searchQuery || typeFilter !== "all" || statusFilter !== "all" 
                      ? "Try adjusting your search or filters to see more results."
                      : "There are no seller offers available yet."}
                  </p>
                  {(user?.role === "GECAN_Admin" || user?.memberType?.includes("Seller")) && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSelectedOfferType(null);
                        setNewOfferModalOpen(true);
                      }}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Create Offer
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOffers.map((offer) => (
                    <Card key={offer.id} className="overflow-hidden transition-all hover:shadow-md border border-neutral-200/80">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm font-medium text-neutral-800">
                              {offer.offerId}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Created {formatRelativeTime(offer.createdAt)}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            {getCommodityTypeBadge(offer.offerType)}
                            {getStatusBadge(offer.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        {renderOfferDetails(offer)}
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between border-t mt-2">
                        <div className="text-xs text-neutral-500">
                          <Clock className="inline-block h-3 w-3 mr-1 relative -top-[1px]" />
                          {offer.status === "Active" ? "Available for transactions" : "Awaiting approval"}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOfferDetails(offer)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="enquiries" className="mt-0">
              {enquiriesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-neutral-100 p-3 text-neutral-500">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No enquiries found</h3>
                  <p className="mt-2 text-sm text-neutral-500 max-w-sm">
                    {searchQuery || typeFilter !== "all" || statusFilter !== "all" 
                      ? "Try adjusting your search or filters to see more results."
                      : "There are no buyer enquiries available yet."}
                  </p>
                  {(user?.role === "GECAN_Admin" || user?.memberType?.includes("Buyer")) && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSelectedEnquiryType(null);
                        setNewEnquiryModalOpen(true);
                      }}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Create Enquiry
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEnquiries.map((enquiry) => (
                    <Card key={enquiry.id} className="overflow-hidden transition-all hover:shadow-md border border-neutral-200/80">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm font-medium text-neutral-800">
                              {enquiry.enquiryId}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Created {formatRelativeTime(enquiry.createdAt)}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            {getCommodityTypeBadge(enquiry.enquiryType)}
                            {getStatusBadge(enquiry.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        {renderEnquiryDetails(enquiry)}
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between border-t mt-2">
                        <div className="text-xs text-neutral-500">
                          <Clock className="inline-block h-3 w-3 mr-1 relative -top-[1px]" />
                          {enquiry.status === "Active" ? "Actively seeking sellers" : "Status: " + enquiry.status}
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

      {/* New Offer Dialog */}
      <Dialog open={newOfferModalOpen} onOpenChange={setNewOfferModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Offer</DialogTitle>
            <DialogDescription>
              Create a new seller offer to be listed on the GECAN marketplace.
            </DialogDescription>
          </DialogHeader>

          {!selectedOfferType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              <Button 
                variant="outline" 
                className="h-auto p-6 flex flex-col items-center justify-center hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-700"
                onClick={() => setSelectedOfferType("GOLD")}
              >
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                  <ShieldCheck className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="font-medium">Gold Sellers</div>
                <p className="text-xs text-neutral-500 mt-1">Physical Gold, Gold Bars, Gold Dust</p>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-6 flex flex-col items-center justify-center hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700"
                onClick={() => setSelectedOfferType("BTC")}
              >
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <Bitcoin className="h-6 w-6 text-orange-600" />
                </div>
                <div className="font-medium">BTC Sellers</div>
                <p className="text-xs text-neutral-500 mt-1">Bitcoin trading, OTC deals</p>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-6 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                onClick={() => setSelectedOfferType("USDT")}
              >
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <Coins className="h-6 w-6 text-green-600" />
                </div>
                <div className="font-medium">USDT Sellers</div>
                <p className="text-xs text-neutral-500 mt-1">Tether stablecoin, USDT trading</p>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-6 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                onClick={() => setSelectedOfferType("PALLET")}
              >
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <CircleDollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="font-medium">Cash Pallet Sellers</div>
                <p className="text-xs text-neutral-500 mt-1">Cash transactions, secure handling</p>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-6 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700"
                onClick={() => setSelectedOfferType("PETRO")}
              >
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <Droplets className="h-6 w-6 text-purple-600" />
                </div>
                <div className="font-medium">Petroleum Sellers</div>
                <p className="text-xs text-neutral-500 mt-1">Crude Oil, Refined Products, BLCO</p>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-6 flex flex-col items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                onClick={() => setSelectedOfferType("SBLCM")}
              >
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="font-medium">SBLC Monetizers</div>
                <p className="text-xs text-neutral-500 mt-1">SBLC monetization services</p>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-6 flex flex-col items-center justify-center hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700"
                onClick={() => setSelectedOfferType("SBLCP")}
              >
                <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center mb-3">
                  <Globe className="h-6 w-6 text-teal-600" />
                </div>
                <div className="font-medium">SBLC Providers</div>
                <p className="text-xs text-neutral-500 mt-1">SBLC issuance services</p>
              </Button>
            </div>
          ) : selectedOfferType === "GOLD" ? (
            <Form {...goldForm}>
              <form onSubmit={goldForm.handleSubmit(handleGoldOfferSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Seller Information Section */}
                  <div className="col-span-2 pt-2 pb-2 border-b mb-2">
                    <h3 className="text-base font-semibold">Seller Information</h3>
                    <p className="text-sm text-muted-foreground">Provide details about the seller to help with verification</p>
                  </div>
                  
                  <FormField
                    control={goldForm.control}
                    name="sellerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller ID</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className="bg-muted" />
                        </FormControl>
                        <FormDescription>Auto-generated unique identifier</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="offerValidity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Validity</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 30 days from submission" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="sellerCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="sellerNationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your nationality" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="sellerTimeZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Zone (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., GMT+1, EST, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="sellerResponseTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Time (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 24 hours, same business day" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transaction type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="In-Person">In-Person Transaction</SelectItem>
                              <SelectItem value="Remote">Remote Transaction</SelectItem>
                              <SelectItem value="Hybrid">Hybrid (Initial meeting, then remote)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Commodity Details Section */}
                  <div className="col-span-2 pt-3 pb-2 border-b mb-2 mt-4">
                    <h3 className="text-base font-semibold">Commodity Details</h3>
                    <p className="text-sm text-muted-foreground">Provide details about the gold being offered</p>
                  </div>
                  
                  <FormField
                    control={goldForm.control}
                    name="goldType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gold Type</FormLabel>
                        <FormControl>
                          {field.value === "Custom" ? (
                            <div className="space-y-2">
                              <div className="flex space-x-2">
                                <Input 
                                  value={field.value === "Custom" ? "" : field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  placeholder="Enter custom gold type"
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => field.onChange("")}
                                  className="whitespace-nowrap"
                                >
                                  <ArrowLeft className="mr-1 h-4 w-4" />
                                  Back to List
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gold type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Gold Dust">Gold Dust</SelectItem>
                                <SelectItem value="Gold Bars">Gold Bars</SelectItem>
                                <SelectItem value="Gold Dore">Gold Dore</SelectItem>
                                <SelectItem value="Gold Nuggets">Gold Nuggets</SelectItem>
                                <SelectItem value="Gold Bullion">Gold Bullion</SelectItem>
                                <SelectItem value="Custom">+ Add Custom Type</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="purity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purity</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select purity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="995">995 (23.9K)</SelectItem>
                              <SelectItem value="990">990 (23.8K)</SelectItem>
                              <SelectItem value="986">986 (23.7K)</SelectItem>
                              <SelectItem value="980">980 (23.5K)</SelectItem>
                              <SelectItem value="916">916 (22K)</SelectItem>
                              <SelectItem value="750">750 (18K)</SelectItem>
                              <SelectItem value="585">585 (14K)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter quantity" type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="quantityUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                              <SelectItem value="g">Grams (g)</SelectItem>
                              <SelectItem value="oz">Troy Ounces (oz t)</SelectItem>
                              <SelectItem value="t">Metric Tons (t)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Country/City of storage" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="originOfMetal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin of Metal (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Country of origin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="hallmark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hallmark/Certification (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., LBMA Good Delivery, PAMP, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Pricing and Terms Section */}
                  <div className="col-span-2 pt-3 pb-2 border-b mb-2 mt-4">
                    <h3 className="text-base font-semibold">Pricing & Terms</h3>
                    <p className="text-sm text-muted-foreground">Specify pricing information and transaction terms</p>
                  </div>
                  
                  <FormField
                    control={goldForm.control}
                    name="incoterm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterm</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select incoterm" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CIF">CIF</SelectItem>
                              <SelectItem value="FOB">FOB</SelectItem>
                              <SelectItem value="EXW">EXW</SelectItem>
                              <SelectItem value="DDP">DDP</SelectItem>
                              <SelectItem value="FCA">FCA</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="priceBasis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Basis</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select price basis" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LBMA">LBMA Gold Price</SelectItem>
                              <SelectItem value="COMEX">COMEX Gold Futures</SelectItem>
                              <SelectItem value="SPOT">Spot Price</SelectItem>
                              <SelectItem value="FIXED">Fixed Price</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="premium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Premium</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. +1%, +$5/oz, etc." />
                        </FormControl>
                        <FormDescription>
                          Premium percentage or fixed amount above the price basis
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="discountGross"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gross Discount</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. -2%, etc." />
                        </FormControl>
                        <FormDescription>
                          Gross percentage discount to price basis
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="discountNet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Discount</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. -1.5%, etc." />
                        </FormControl>
                        <FormDescription>
                          Net discount percentage after fees
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="T/T">T/T (Wire Transfer)</SelectItem>
                              <SelectItem value="L/C">L/C (Letter of Credit)</SelectItem>
                              <SelectItem value="SBLC">SBLC (Standby Letter of Credit)</SelectItem>
                              <SelectItem value="ESCROW">Escrow Service</SelectItem>
                              <SelectItem value="BG">Bank Guarantee</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="deliveryTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Time</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 5-7 business days" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="minTransaction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Transaction</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 1 kg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="maxTransaction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Transaction</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 100 kg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="contractDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Duration</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 12 months" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Compliance Section */}
                  <div className="col-span-2 pt-3 pb-2 border-b mb-2 mt-4">
                    <h3 className="text-base font-semibold">Compliance & Requirements</h3>
                    <p className="text-sm text-muted-foreground">Specify compliance and transaction requirements</p>
                  </div>
                  
                  <FormField
                    control={goldForm.control}
                    name="kycRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KYC Requirements</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Standard KYC" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="paymentGuarantee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Guarantee</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Bank Guarantee, SBLC" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="performanceBond"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Performance Bond</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 2% of contract value" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Commission and Meeting Preferences */}
                  <div className="col-span-2 pt-3 pb-2 border-b mb-2 mt-4">
                    <h3 className="text-base font-semibold">Commission & Meeting Preferences</h3>
                    <p className="text-sm text-muted-foreground">Specify commission structure and meeting preferences</p>
                  </div>
                  
                  <FormField
                    control={goldForm.control}
                    name="commissionStructure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Structure</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 50/50 split between buyer/seller" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="meetingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select meeting type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Virtual">Virtual Meeting Only</SelectItem>
                              <SelectItem value="Face-to-Face">Face-to-Face Required</SelectItem>
                              <SelectItem value="Both">Both Options Available</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="faceToFaceLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Face-to-Face Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., London, Dubai, Singapore" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="additionalDetails"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter any additional specifications or requirements" 
                            className="h-20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Transaction Process Section */}
                  <div className="col-span-2 pt-4 border-t mb-2">
                    <h3 className="text-base font-semibold">Transaction Process & Legal Details</h3>
                    <p className="text-sm text-muted-foreground">Define transaction procedures and legal framework</p>
                  </div>
                  
                  <FormField
                    control={goldForm.control}
                    name="transactionProcedures"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Transaction Procedures</FormLabel>
                        <FormDescription>
                          Outline the step-by-step process for this transaction
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter transaction procedures" 
                            className="h-36 font-mono text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldForm.control}
                    name="legalFramework"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Legal Framework</FormLabel>
                        <FormDescription>
                          Specify the legal terms, governing laws, and compliance requirements
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter legal framework" 
                            className="h-36 font-mono text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedOfferType(null)}>
                    Back
                  </Button>
                  <Button type="submit">Submit Offer</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : selectedOfferType === "BTC" ? (
            <Form {...btcForm}>
              <form onSubmit={btcForm.handleSubmit(handleBtcOfferSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2 pt-2 pb-2 border-b mb-2">
                    <h3 className="text-base font-semibold">Seller Information</h3>
                    <p className="text-sm text-muted-foreground">Provide details about the seller to help with verification</p>
                  </div>

                  <FormField
                    control={btcForm.control}
                    name="sellerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. GECAN-CRPT-BTC-S-X22" readOnly />
                        </FormControl>
                        <FormDescription>Unique identifier for this offer (auto-generated)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="offerValidity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Validity</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 14 days from submission date" />
                        </FormControl>
                        <FormDescription>Duration for which this offer is valid</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="sellerCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company name (optional)" />
                        </FormControl>
                        <FormDescription>Company/entity representing the seller</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="sellerNationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Nationality</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter seller nationality (optional)" />
                        </FormControl>
                        <FormDescription>Country of origin/citizenship for compliance purposes</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="sellerTimeZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Time Zone</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select seller time zone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC-12:00">UTC-12:00</SelectItem>
                              <SelectItem value="UTC-11:00">UTC-11:00</SelectItem>
                              <SelectItem value="UTC-10:00">UTC-10:00</SelectItem>
                              <SelectItem value="UTC-09:00">UTC-09:00</SelectItem>
                              <SelectItem value="UTC-08:00">UTC-08:00 (PST)</SelectItem>
                              <SelectItem value="UTC-07:00">UTC-07:00 (MST)</SelectItem>
                              <SelectItem value="UTC-06:00">UTC-06:00 (CST)</SelectItem>
                              <SelectItem value="UTC-05:00">UTC-05:00 (EST)</SelectItem>
                              <SelectItem value="UTC-04:00">UTC-04:00</SelectItem>
                              <SelectItem value="UTC-03:00">UTC-03:00</SelectItem>
                              <SelectItem value="UTC-02:00">UTC-02:00</SelectItem>
                              <SelectItem value="UTC-01:00">UTC-01:00</SelectItem>
                              <SelectItem value="UTC+00:00">UTC+00:00 (GMT)</SelectItem>
                              <SelectItem value="UTC+01:00">UTC+01:00 (CET)</SelectItem>
                              <SelectItem value="UTC+02:00">UTC+02:00 (EET)</SelectItem>
                              <SelectItem value="UTC+03:00">UTC+03:00 (MSK)</SelectItem>
                              <SelectItem value="UTC+04:00">UTC+04:00</SelectItem>
                              <SelectItem value="UTC+05:00">UTC+05:00</SelectItem>
                              <SelectItem value="UTC+05:30">UTC+05:30 (IST)</SelectItem>
                              <SelectItem value="UTC+06:00">UTC+06:00</SelectItem>
                              <SelectItem value="UTC+07:00">UTC+07:00</SelectItem>
                              <SelectItem value="UTC+08:00">UTC+08:00 (CST/SGT/HKT)</SelectItem>
                              <SelectItem value="UTC+09:00">UTC+09:00 (JST)</SelectItem>
                              <SelectItem value="UTC+10:00">UTC+10:00</SelectItem>
                              <SelectItem value="UTC+11:00">UTC+11:00</SelectItem>
                              <SelectItem value="UTC+12:00">UTC+12:00</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>For scheduling calls and meetings</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="sellerResponseTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Time</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expected response time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                              <SelectItem value="4 hours">4 hours</SelectItem>
                              <SelectItem value="6 hours">6 hours</SelectItem>
                              <SelectItem value="12 hours">12 hours</SelectItem>
                              <SelectItem value="24 hours">24 hours</SelectItem>
                              <SelectItem value="48 hours">48 hours</SelectItem>
                              <SelectItem value="Custom">Other (specify in additional details)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>Expected timeframe for responding to inquiries</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transaction type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Remote">Remote (Online/Digital)</SelectItem>
                              <SelectItem value="Face-to-Face">Face-to-Face Meeting</SelectItem>
                              <SelectItem value="Hybrid">Hybrid (Both Remote and F2F Options)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>How the transaction will be conducted</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="col-span-2 pt-4 border-t border-b pb-2 mb-2">
                    <h3 className="text-base font-semibold">Commodity Details</h3>
                    <p className="text-sm text-muted-foreground">Provide the specific details about the Bitcoin being offered</p>
                  </div>
                  
                  <FormField
                    control={btcForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity (BTC)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location/Jurisdiction</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Singapore" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Seller's Binance Account" />
                        </FormControl>
                        <FormDescription>Source of the BTC (exchange, private wallet, etc.)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="tradingPair"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trading Pair</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select trading pair" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                              <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                              <SelectItem value="BTC/EUR">BTC/EUR</SelectItem>
                              <SelectItem value="BTC/GBP">BTC/GBP</SelectItem>
                              <SelectItem value="Custom">Other (specify in additional details)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>Preferred currency pair for this transaction</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="transactionPlatform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Platform</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transaction platform" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Binance">Binance</SelectItem>
                              <SelectItem value="Coinbase">Coinbase</SelectItem>
                              <SelectItem value="Kraken">Kraken</SelectItem>
                              <SelectItem value="OTC">OTC (Over-the-counter)</SelectItem>
                              <SelectItem value="Direct Wallet">Direct Wallet Transfer</SelectItem>
                              <SelectItem value="Custom">Other (specify in additional details)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>Platform where the transaction will be executed</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="walletRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="e.g. Buyer must provide verified Binance account with Binance Pay ID" 
                            className="h-20"
                          />
                        </FormControl>
                        <FormDescription>Specific wallet or platform requirements for transaction</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="col-span-2 pt-4 border-t border-b pb-2 mb-2">
                    <h3 className="text-base font-semibold">Pricing & Terms</h3>
                    <p className="text-sm text-muted-foreground">Provide pricing details and discount information</p>
                  </div>
                  
                  <FormField
                    control={btcForm.control}
                    name="priceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select price type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Spot">Spot Price</SelectItem>
                              <SelectItem value="Fixed">Fixed Price</SelectItem>
                              <SelectItem value="Index">Index Based</SelectItem>
                              <SelectItem value="OTC">OTC Rate</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="premium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Premium Percentage</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. +2%, -1%" />
                        </FormControl>
                        <FormDescription>Market premium or discount on reference price</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="discountGross"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (Gross)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 6%" />
                        </FormControl>
                        <FormDescription>Gross discount available before commission</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="discountNet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (Net)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 3%" />
                        </FormControl>
                        <FormDescription>Net discount after all fees and commissions</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="incoterms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterms</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. BTC-USDT SWAP | BINANCE PAY ID ONLY | REMOTE" />
                        </FormControl>
                        <FormDescription>Transaction terms in standard format</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          {field.value === "Custom" ? (
                            <div className="space-y-2">
                              <div className="flex space-x-2">
                                <Input 
                                  value={field.value === "Custom" ? "" : field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  placeholder="Enter payment method (e.g., USDT, Fiat, etc.)"
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => field.onChange("")}
                                  className="whitespace-nowrap"
                                >
                                  <ArrowLeft className="mr-1 h-4 w-4" />
                                  Back to List
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="ESCROW">ESCROW Service</SelectItem>
                                <SelectItem value="SBLC">SBLC</SelectItem>
                                <SelectItem value="L/C">Letter of Credit</SelectItem>
                                <SelectItem value="T/T">Wire Transfer</SelectItem>
                                <SelectItem value="USDT">USDT</SelectItem>
                                <SelectItem value="BTC">BTC</SelectItem>
                                <SelectItem value="Custom">+ Other Payment Method</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </FormControl>
                        <FormDescription>
                          Choose from common payment methods or specify your own
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="settlementTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Settlement Time</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select settlement time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Same-day">Same-day</SelectItem>
                              <SelectItem value="T+1">T+1</SelectItem>
                              <SelectItem value="T+2">T+2</SelectItem>
                              <SelectItem value="T+3">T+3</SelectItem>
                              <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="minTransaction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Transaction (BTC)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="maxTransaction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Transaction (BTC)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="contractDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Duration</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Per tranche / 30 days" />
                        </FormControl>
                        <FormDescription>Duration of the contract period</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="col-span-2 pt-4 border-t border-b pb-2 mb-2">
                    <h3 className="text-base font-semibold">Compliance & Requirements</h3>
                    <p className="text-sm text-muted-foreground">Specify compliance requirements and guarantees</p>
                  </div>
                  
                  <FormField
                    control={btcForm.control}
                    name="kycRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KYC Requirements</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select KYC requirements" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard">Standard KYC</SelectItem>
                              <SelectItem value="Enhanced">Enhanced KYC</SelectItem>
                              <SelectItem value="Institutional">Institutional KYC</SelectItem>
                              <SelectItem value="Full Compliance">Full Compliance Package</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>Level of identity verification required</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="paymentGuarantee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Guarantee</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Platform transaction mechanisms" />
                        </FormControl>
                        <FormDescription>Mechanism to guarantee payment</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="performanceBond"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Performance Bond</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select performance bond type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="N/A">Not Applicable</SelectItem>
                              <SelectItem value="Required">Required</SelectItem>
                              <SelectItem value="Optional">Optional</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>Performance guarantee requirement (if any)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="col-span-2 pt-4 border-t border-b pb-2 mb-2">
                    <h3 className="text-base font-semibold">Commission & Meeting Preferences</h3>
                    <p className="text-sm text-muted-foreground">Provide details about commissions and meeting arrangements</p>
                  </div>
                  
                  <FormField
                    control={btcForm.control}
                    name="commissionStructure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Structure</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="e.g. Total 3% (1% Seller Side, 1% Buyer Side, 1% GECAN)" 
                            className="h-20"
                          />
                        </FormControl>
                        <FormDescription>Commission percentages and distribution</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="meetingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select meeting type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Remote">Remote Only</SelectItem>
                              <SelectItem value="F2F Required">Face-to-Face Required</SelectItem>
                              <SelectItem value="F2F Optional">Face-to-Face Optional</SelectItem>
                              <SelectItem value="Virtual with POA">Virtual with Power of Attorney</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>How parties will meet to execute transaction</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="faceToFaceLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>F2F Location (if applicable)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Hong Kong, Singapore, Dubai" />
                        </FormControl>
                        <FormDescription>Location for face-to-face meetings if required</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="col-span-2 pt-4 border-t border-b pb-2 mb-2">
                    <h3 className="text-base font-semibold">Additional Information</h3>
                    <p className="text-sm text-muted-foreground">Provide any other important details about this offer</p>
                  </div>
                  
                  <FormField
                    control={btcForm.control}
                    name="additionalDetails"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional requirements or specifications..."
                            className="h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="additionalConditions"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Transaction Conditions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g. BINANCE PAY ID MANDATORY, BUYER PAYS USDT FIRST, NO PRE-TESTS, etc."
                            className="h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Important non-negotiable conditions for this transaction</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="transactionProcedures"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Transaction Procedures</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={btcForm.control}
                    name="legalFramework"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Legal Framework</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedOfferType(null)}>
                    Back
                  </Button>
                  <Button type="submit">Submit Offer</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : selectedOfferType === "USDT" ? (
            <Form {...usdtForm}>
              <form onSubmit={usdtForm.handleSubmit(handleUsdtOfferSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2 pt-2 pb-2 border-b mb-2">
                    <h3 className="text-base font-semibold">Seller Information</h3>
                    <p className="text-sm text-muted-foreground">Provide details about the seller to help with verification</p>
                  </div>

                  <FormField
                    control={usdtForm.control}
                    name="sellerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. GECAN-CRPT-USDT-S-X22" readOnly />
                        </FormControl>
                        <FormDescription>Unique identifier for this offer (auto-generated)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="offerValidity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Validity</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 14 days from submission date" />
                        </FormControl>
                        <FormDescription>Duration for which this offer is valid</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="sellerCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company name (optional)" />
                        </FormControl>
                        <FormDescription>Company/entity representing the seller</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="sellerNationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Nationality</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter seller nationality (optional)" />
                        </FormControl>
                        <FormDescription>Country of origin/citizenship for compliance purposes</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="sellerTimeZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Time Zone</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select seller time zone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC-12:00">UTC-12:00</SelectItem>
                              <SelectItem value="UTC-11:00">UTC-11:00</SelectItem>
                              <SelectItem value="UTC-10:00">UTC-10:00</SelectItem>
                              <SelectItem value="UTC-09:00">UTC-09:00</SelectItem>
                              <SelectItem value="UTC-08:00">UTC-08:00 (PST)</SelectItem>
                              <SelectItem value="UTC-07:00">UTC-07:00 (MST)</SelectItem>
                              <SelectItem value="UTC-06:00">UTC-06:00 (CST)</SelectItem>
                              <SelectItem value="UTC-05:00">UTC-05:00 (EST)</SelectItem>
                              <SelectItem value="UTC-04:00">UTC-04:00</SelectItem>
                              <SelectItem value="UTC-03:00">UTC-03:00</SelectItem>
                              <SelectItem value="UTC-02:00">UTC-02:00</SelectItem>
                              <SelectItem value="UTC-01:00">UTC-01:00</SelectItem>
                              <SelectItem value="UTC+00:00">UTC+00:00 (GMT)</SelectItem>
                              <SelectItem value="UTC+01:00">UTC+01:00 (CET)</SelectItem>
                              <SelectItem value="UTC+02:00">UTC+02:00 (EET)</SelectItem>
                              <SelectItem value="UTC+03:00">UTC+03:00 (MSK)</SelectItem>
                              <SelectItem value="UTC+04:00">UTC+04:00</SelectItem>
                              <SelectItem value="UTC+05:00">UTC+05:00</SelectItem>
                              <SelectItem value="UTC+05:30">UTC+05:30 (IST)</SelectItem>
                              <SelectItem value="UTC+06:00">UTC+06:00</SelectItem>
                              <SelectItem value="UTC+07:00">UTC+07:00</SelectItem>
                              <SelectItem value="UTC+08:00">UTC+08:00 (CST/SGT/HKT)</SelectItem>
                              <SelectItem value="UTC+09:00">UTC+09:00 (JST)</SelectItem>
                              <SelectItem value="UTC+10:00">UTC+10:00</SelectItem>
                              <SelectItem value="UTC+11:00">UTC+11:00</SelectItem>
                              <SelectItem value="UTC+12:00">UTC+12:00</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>For scheduling calls and meetings</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="sellerResponseTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Time</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expected response time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                              <SelectItem value="4 hours">4 hours</SelectItem>
                              <SelectItem value="6 hours">6 hours</SelectItem>
                              <SelectItem value="12 hours">12 hours</SelectItem>
                              <SelectItem value="24 hours">24 hours</SelectItem>
                              <SelectItem value="48 hours">48 hours</SelectItem>
                              <SelectItem value="Custom">Other (specify in additional details)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>Expected timeframe for responding to inquiries</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transaction type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Remote">Remote (Online/Digital)</SelectItem>
                              <SelectItem value="Face-to-Face">Face-to-Face Meeting</SelectItem>
                              <SelectItem value="Hybrid">Hybrid (Both Remote and F2F Options)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>How the transaction will be conducted</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="col-span-2 pt-4 border-t border-b pb-2 mb-2">
                    <h3 className="text-base font-semibold">Commodity Details</h3>
                    <p className="text-sm text-muted-foreground">Provide the specific details about the USDT being offered</p>
                  </div>
                  
                  <FormField
                    control={usdtForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity (USDT)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 1,000,000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="network"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ethereum">Ethereum</SelectItem>
                              <SelectItem value="Tron">Tron</SelectItem>
                              <SelectItem value="Solana">Solana</SelectItem>
                              <SelectItem value="Binance Smart Chain">Binance Smart Chain</SelectItem>
                              <SelectItem value="Polygon">Polygon</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location/Jurisdiction</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Dubai" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="priceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select price type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Spot">Spot Price</SelectItem>
                              <SelectItem value="Fixed">Fixed Price</SelectItem>
                              <SelectItem value="OTC">OTC Rate</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="premium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Premium Percentage</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. +1.5%, -0.5%" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          {field.value === "Custom" ? (
                            <div className="space-y-2">
                              <div className="flex space-x-2">
                                <Input 
                                  value={field.value === "Custom" ? "" : field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  placeholder="Enter payment method (e.g., BTC, Fiat, etc.)"
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => field.onChange("")}
                                  className="whitespace-nowrap"
                                >
                                  <ArrowLeft className="mr-1 h-4 w-4" />
                                  Back to List
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="ESCROW">ESCROW Service</SelectItem>
                                <SelectItem value="SBLC">SBLC</SelectItem>
                                <SelectItem value="L/C">Letter of Credit</SelectItem>
                                <SelectItem value="T/T">Wire Transfer</SelectItem>
                                <SelectItem value="BTC">BTC</SelectItem>
                                <SelectItem value="ETH">ETH</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Custom">+ Other Payment Method</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </FormControl>
                        <FormDescription>
                          Choose from common payment methods or specify your own
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="settlementTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Settlement Time</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select settlement time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Same-day">Same-day</SelectItem>
                              <SelectItem value="T+1">T+1</SelectItem>
                              <SelectItem value="T+2">T+2</SelectItem>
                              <SelectItem value="T+3">T+3</SelectItem>
                              <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="minTransaction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Transaction (USDT)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 50,000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="maxTransaction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Transaction (USDT)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 5,000,000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="kycRequirements"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>KYC Requirements</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select KYC requirements" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard">Standard KYC</SelectItem>
                              <SelectItem value="Enhanced">Enhanced KYC</SelectItem>
                              <SelectItem value="Institutional">Institutional KYC</SelectItem>
                              <SelectItem value="Full Compliance">Full Compliance Package</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="additionalDetails"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional requirements or specifications..."
                            className="h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="transactionProcedures"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Transaction Procedures</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={usdtForm.control}
                    name="legalFramework"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Legal Framework</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedOfferType(null)}>
                    Back
                  </Button>
                  <Button type="submit">Submit Offer</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : selectedOfferType === "PETRO" ? (
            <Form {...petroForm}>
              <form onSubmit={petroForm.handleSubmit(handlePetroleumOfferSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={petroForm.control}
                    name="product"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Crude Oil">Crude Oil</SelectItem>
                              <SelectItem value="BLCO">BLCO (Bonny Light Crude Oil)</SelectItem>
                              <SelectItem value="Diesel">Diesel</SelectItem>
                              <SelectItem value="Jet A1">Jet A1</SelectItem>
                              <SelectItem value="Gasoline">Gasoline</SelectItem>
                              <SelectItem value="LNG">LNG (Liquefied Natural Gas)</SelectItem>
                              <SelectItem value="LPG">LPG (Liquefied Petroleum Gas)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="specification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specification</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="API Grade, Sulfur content, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter quantity" type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="quantityUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="barrels">Barrels</SelectItem>
                              <SelectItem value="MT">Metric Tons (MT)</SelectItem>
                              <SelectItem value="gallons">Gallons</SelectItem>
                              <SelectItem value="liters">Liters</SelectItem>
                              <SelectItem value="m3">Cubic Meters (m³)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Country of origin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="deliveryLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Port, terminal, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. $XX.XX per barrel/MT" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="incoterm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterm</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select incoterm" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FOB">FOB</SelectItem>
                              <SelectItem value="CIF">CIF</SelectItem>
                              <SelectItem value="DAP">DAP</SelectItem>
                              <SelectItem value="DES">DES</SelectItem>
                              <SelectItem value="EXW">EXW</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="L/C">L/C (Letter of Credit)</SelectItem>
                              <SelectItem value="DLC">DLC (Documentary Letter of Credit)</SelectItem>
                              <SelectItem value="SBLC">SBLC (Standby Letter of Credit)</SelectItem>
                              <SelectItem value="BG">BG (Bank Guarantee)</SelectItem>
                              <SelectItem value="DFP">DFP (Documentary Full Payment)</SelectItem>
                              <SelectItem value="CAD">CAD (Cash Against Documents)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="additionalDetails"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter any additional specifications or requirements" 
                            className="h-20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="col-span-2 pt-4 border-t">
                    <h3 className="text-base font-semibold mb-2">Transaction Process & Legal Details</h3>
                  </div>
                  
                  <FormField
                    control={petroForm.control}
                    name="transactionProcedures"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Transaction Procedures</FormLabel>
                        <FormDescription>
                          Outline the step-by-step process for this transaction
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter transaction procedures" 
                            className="h-36 font-mono text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroForm.control}
                    name="legalFramework"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Legal Framework</FormLabel>
                        <FormDescription>
                          Specify the legal terms, governing laws, and compliance requirements
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter legal framework" 
                            className="h-36 font-mono text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedOfferType(null)}>
                    Back
                  </Button>
                  <Button type="submit">Submit Offer</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : selectedOfferType === "PALLET" ? (
            <Form {...cashForm}>
              <form onSubmit={cashForm.handleSubmit(handleCashOfferSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={cashForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="denomination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Denomination</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select denomination" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="Mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="totalFaceValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Face Value</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter total face value" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter storage location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="discountRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter discount rate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="netPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Price</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter net price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter origin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="securityFeatures"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Security Features</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter security features"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="authenticityVerification"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Authenticity Verification</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter authenticity verification methods"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="transactionProcedures"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Transaction Procedures</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="legalFramework"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Legal Framework</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cashForm.control}
                    name="additionalDetails"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter additional details (optional)"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedOfferType(null)}>
                    Back
                  </Button>
                  <Button type="submit">Submit Cash Pallet Offer</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : selectedOfferType === "SBLCM" ? (
            <Form {...sblcMonetizerForm}>
              <form onSubmit={sblcMonetizerForm.handleSubmit(handleSblcMonetizerOfferSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="monetizationProgram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monetization Program</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter monetization program" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="acceptedIssuers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accepted Issuers</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter accepted issuing banks" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="minAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Amount</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter minimum amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Amount</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter maximum amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="ltv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LTV Percentage</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter LTV percentage" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="discountRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Rate</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter discount rate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="monetizationPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monetization Period</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter period (e.g., 1 year)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter payment terms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="fees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fees</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter fees" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="requirementsDocumentation"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Requirements Documentation</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter documentation requirements"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="transactionProcedures"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Transaction Procedures</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="legalFramework"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Legal Framework</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcMonetizerForm.control}
                    name="additionalDetails"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter additional details (optional)"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedOfferType(null)}>
                    Back
                  </Button>
                  <Button type="submit">Submit SBLC Monetizer Offer</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : selectedOfferType === "SBLCP" ? (
            <Form {...sblcProviderForm}>
              <form onSubmit={sblcProviderForm.handleSubmit(handleSblcProviderOfferSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={sblcProviderForm.control}
                    name="providerBank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider Bank</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter provider bank" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="bankRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Rating</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bank rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AAA">AAA</SelectItem>
                              <SelectItem value="AA+">AA+</SelectItem>
                              <SelectItem value="AA">AA</SelectItem>
                              <SelectItem value="AA-">AA-</SelectItem>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="BBB+">BBB+</SelectItem>
                              <SelectItem value="BBB">BBB</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="sblcValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SBLC Value</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter SBLC value range" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="issuePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Price</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter issue price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="leasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lease Price</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter lease price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="validation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validation Period</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter validation period" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="issuanceTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuance Time</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter issuance time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="eligibility"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Eligibility Criteria</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter eligibility criteria"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="useRestrictions"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Use Restrictions</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter use restrictions"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="documentationRequired"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Documentation Required</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter required documentation"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="transactionProcedures"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Transaction Procedures</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="legalFramework"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Legal Framework</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="font-mono text-xs h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sblcProviderForm.control}
                    name="additionalDetails"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter additional details (optional)"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedOfferType(null)}>
                    Back
                  </Button>
                  <Button type="submit">Submit SBLC Provider Offer</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <div className="py-6 text-center">
              <p className="text-neutral-500">This commodity type is coming soon.</p>
              <Button onClick={() => setSelectedOfferType(null)} className="mt-4" variant="outline">
                Select Different Type
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Buyer Enquiry Creation Dialog */}
      <Dialog open={newEnquiryModalOpen} onOpenChange={setNewEnquiryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Buyer Enquiry</DialogTitle>
            <DialogDescription>
              Specify the details of your commodity requirements. Matching with appropriate offers will be facilitated by GECAN.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEnquiryType === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedEnquiryType("gold")}
              >
                <CardContent className="flex flex-col items-center justify-center text-center p-6">
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                    <CircleDollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg mb-2">Gold</CardTitle>
                  <CardDescription>
                    Create an enquiry for gold bars, bullion, coins, or other gold products
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedEnquiryType("petroleum")}
              >
                <CardContent className="flex flex-col items-center justify-center text-center p-6">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Droplets className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg mb-2">Petroleum</CardTitle>
                  <CardDescription>
                    Create an enquiry for crude oil, refined products, or petroleum derivatives
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:border-primary/50 transition-colors opacity-70">
                <CardContent className="flex flex-col items-center justify-center text-center p-6 relative">
                  <div className="absolute top-2 right-2 bg-neutral-100 text-neutral-500 text-xs px-2 py-1 rounded">
                    Coming Soon
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <Bitcoin className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg mb-2">Bitcoin</CardTitle>
                  <CardDescription>
                    Create an enquiry for OTC Bitcoin transactions
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:border-primary/50 transition-colors opacity-70">
                <CardContent className="flex flex-col items-center justify-center text-center p-6 relative">
                  <div className="absolute top-2 right-2 bg-neutral-100 text-neutral-500 text-xs px-2 py-1 rounded">
                    Coming Soon
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Coins className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg mb-2">USDT</CardTitle>
                  <CardDescription>
                    Create an enquiry for OTC USDT transactions
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ) : selectedEnquiryType === "gold" ? (
            <Form {...goldEnquiryForm}>
              <form onSubmit={goldEnquiryForm.handleSubmit(handleGoldEnquirySubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={goldEnquiryForm.control}
                    name="desiredGoldType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gold Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gold type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Gold Bars">Gold Bars</SelectItem>
                              <SelectItem value="Gold Coins">Gold Coins</SelectItem>
                              <SelectItem value="Gold Dust">Gold Dust</SelectItem>
                              <SelectItem value="Gold Doré">Gold Doré</SelectItem>
                              <SelectItem value="Scrap Gold">Scrap Gold</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldEnquiryForm.control}
                    name="desiredPurity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Purity</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select purity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="999.9 (24K)">999.9 (24K)</SelectItem>
                              <SelectItem value="999 (24K)">999 (24K)</SelectItem>
                              <SelectItem value="995 (23.9K)">995 (23.9K)</SelectItem>
                              <SelectItem value="990 (23.8K)">990 (23.8K)</SelectItem>
                              <SelectItem value="916 (22K)">916 (22K)</SelectItem>
                              <SelectItem value="750 (18K)">750 (18K)</SelectItem>
                              <SelectItem value="585 (14K)">585 (14K)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldEnquiryForm.control}
                    name="quantityRequired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity Required</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="e.g., 100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldEnquiryForm.control}
                    name="quantityUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                              <SelectItem value="g">Grams (g)</SelectItem>
                              <SelectItem value="oz">Troy Ounces (oz)</SelectItem>
                              <SelectItem value="lb">Pounds (lb)</SelectItem>
                              <SelectItem value="t">Metric Tons (t)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldEnquiryForm.control}
                    name="preferredLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Delivery Location</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="e.g., Zurich, Switzerland" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldEnquiryForm.control}
                    name="desiredIncoterm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterm</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select incoterm" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                              <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                              <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                              <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                              <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldEnquiryForm.control}
                    name="maxPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Expectation</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="e.g., Spot + 2% or Fixed $1900/oz" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldEnquiryForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="100% Upfront">100% Upfront</SelectItem>
                              <SelectItem value="LC at Sight">LC at Sight</SelectItem>
                              <SelectItem value="LC 30 Days">LC 30 Days</SelectItem>
                              <SelectItem value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</SelectItem>
                              <SelectItem value="30% Advance, 70% on Delivery">30% Advance, 70% on Delivery</SelectItem>
                              <SelectItem value="SBLC Backed">SBLC Backed</SelectItem>
                              <SelectItem value="BG Backed">BG Backed</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={goldEnquiryForm.control}
                    name="additionalRequirements"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter any additional specifications or requirements" 
                            className="h-20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedEnquiryType(null)}>
                    Back
                  </Button>
                  <Button type="submit">Submit Enquiry</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : selectedEnquiryType === "petroleum" ? (
            <Form {...petroEnquiryForm}>
              <form onSubmit={petroEnquiryForm.handleSubmit(handlePetroleumEnquirySubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={petroEnquiryForm.control}
                    name="productRequired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Crude Oil">Crude Oil</SelectItem>
                              <SelectItem value="Gasoline">Gasoline</SelectItem>
                              <SelectItem value="Diesel">Diesel</SelectItem>
                              <SelectItem value="Jet Fuel">Jet Fuel</SelectItem>
                              <SelectItem value="Fuel Oil">Fuel Oil</SelectItem>
                              <SelectItem value="LPG">LPG</SelectItem>
                              <SelectItem value="Natural Gas">Natural Gas</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroEnquiryForm.control}
                    name="specification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specification Required</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="e.g., ULSD 10ppm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroEnquiryForm.control}
                    name="quantityRequired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity Required</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="e.g., 100,000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroEnquiryForm.control}
                    name="quantityUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="barrels">Barrels</SelectItem>
                              <SelectItem value="mt">Metric Tons (MT)</SelectItem>
                              <SelectItem value="m3">Cubic Meters (m³)</SelectItem>
                              <SelectItem value="gallons">Gallons</SelectItem>
                              <SelectItem value="mmBtu">MMBtu</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* This field is not defined in the schema so we'll hide it for now */}
                  
                  <FormField
                    control={petroEnquiryForm.control}
                    name="deliveryLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Location</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="e.g., Rotterdam Port" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroEnquiryForm.control}
                    name="maxPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Expectation</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="e.g., Brent - $2/bbl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroEnquiryForm.control}
                    name="desiredIncoterm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterm</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select incoterm" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                              <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                              <SelectItem value="DES">DES - Delivered Ex Ship</SelectItem>
                              <SelectItem value="DAP">DAP - Delivered at Place</SelectItem>
                              <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                              <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroEnquiryForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LC at Sight">LC at Sight</SelectItem>
                              <SelectItem value="LC 30 Days">LC 30 Days</SelectItem>
                              <SelectItem value="LC 60 Days">LC 60 Days</SelectItem>
                              <SelectItem value="LC 90 Days">LC 90 Days</SelectItem>
                              <SelectItem value="BG Backed">BG Backed</SelectItem>
                              <SelectItem value="SBLC Backed">SBLC Backed</SelectItem>
                              <SelectItem value="DLC">DLC (Documentary Letter of Credit)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={petroEnquiryForm.control}
                    name="additionalRequirements"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter any additional specifications or requirements" 
                            className="h-20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedEnquiryType(null)}>
                    Back
                  </Button>
                  <Button type="submit">Submit Enquiry</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <div className="py-6 text-center">
              <p className="text-neutral-500">This commodity type is coming soon.</p>
              <Button onClick={() => setSelectedEnquiryType(null)} className="mt-4" variant="outline">
                Select Different Type
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Offer Details Dialog */}
      <Dialog open={offerDetailsDialogOpen} onOpenChange={setOfferDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOffer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-xl font-bold">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded mr-2">
                    {selectedOffer.offerId}
                  </span>
                  Soft Corporate Offer
                </DialogTitle>
                <DialogDescription>
                  {getCommodityTypeBadge(selectedOffer.offerType)}
                  <span className="ml-2 text-neutral-500">
                    Created on {new Date(selectedOffer.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Main Offer Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-4">
                    {/* Commodity Details */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <h3 className="text-base font-semibold mb-3 flex items-center">
                        <Tag className="h-4 w-4 mr-1.5 text-primary" />
                        Commodity Details
                      </h3>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        {Object.entries(selectedOffer.commodityDetails as Record<string, any>)
                          .filter(([key]) => !['transactionProcedures', 'legalFramework'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-xs font-medium text-neutral-500 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              <span className="text-sm font-medium">
                                {Array.isArray(value) ? value.join(', ') : 
                                 typeof value === 'object' ? JSON.stringify(value) : 
                                 value || 'N/A'}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    {/* Transaction Procedures */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <h3 className="text-base font-semibold mb-3 flex items-center">
                        <RefreshCw className="h-4 w-4 mr-1.5 text-primary" />
                        Transaction Procedures
                      </h3>
                      <div className="text-sm whitespace-pre-wrap">
                        {(selectedOffer.commodityDetails as any).transactionProcedures || 
                          <ol className="list-decimal pl-5 space-y-2 text-sm">
                            <li>Both parties sign the Soft Corporate Offer (SCO).</li>
                            <li>Buyer issues Letter of Intent (LOI) and provides proof of funds.</li>
                            <li>Seller verifies buyer's credentials and proof of funds.</li>
                            <li>Parties negotiate and agree on final terms through GECAN platform.</li>
                            <li>Buyer conducts due diligence via GECAN verification services.</li>
                            <li>Both parties sign the final contract and proceed with transaction.</li>
                            <li>Buyer makes payment according to agreed terms and conditions.</li>
                            <li>Seller arranges delivery based on the contract specifications.</li>
                          </ol>
                        }
                      </div>
                    </div>
                    
                    {/* Legal Framework */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <h3 className="text-base font-semibold mb-3 flex items-center">
                        <ShieldCheck className="h-4 w-4 mr-1.5 text-primary" />
                        Legal Framework
                      </h3>
                      <div className="text-sm space-y-3 whitespace-pre-wrap">
                        {(selectedOffer.commodityDetails as any).legalFramework ? 
                          (selectedOffer.commodityDetails as any).legalFramework.split('\n\n').map((paragraph: string, index: number) => (
                            <p key={index}>{paragraph}</p>
                          ))
                          : 
                          <>
                            <p>
                              This Soft Corporate Offer (SCO) is governed by international commercial laws and regulations 
                              including but not limited to the United Nations Convention on Contracts for the International 
                              Sale of Goods (CISG), where applicable, and supplemented by the laws of the jurisdiction 
                              specified in the final agreement.
                            </p>
                            <p>
                              All transactions facilitated through the GECAN platform are subject to Know Your Customer (KYC) 
                              and Anti-Money Laundering (AML) verification in compliance with international standards 
                              and regulations.
                            </p>
                            <p>
                              This document serves as an invitation to treat and not a binding offer until 
                              formalized through proper contractual agreements between the parties.
                            </p>
                          </>
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Offer Summary */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 shadow-sm">
                      <h3 className="text-base font-semibold mb-3 flex items-center">
                        <Award className="h-4 w-4 mr-1.5 text-primary" />
                        Offer Summary
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Status:</span>
                          <span>{getStatusBadge(selectedOffer.status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Commodity:</span>
                          <span>{selectedOffer.offerType}</span>
                        </div>
                        {selectedOffer.expiryDate && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Valid Until:</span>
                            <span>{new Date(selectedOffer.expiryDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Admin-only info */}
                      {user?.role === "GECAN_Admin" && (
                        <div className="mt-4 pt-4 border-t border-primary/20">
                          <h4 className="text-sm font-medium mb-2">Seller Information</h4>
                          <div className="space-y-2 text-sm">
                            {sellerInfo ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">Seller Name:</span>
                                  <span>{sellerInfo.firstName} {sellerInfo.lastName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">Company:</span>
                                  <span>{sellerInfo.companyName || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">Email:</span>
                                  <span>{sellerInfo.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">Phone:</span>
                                  <span>{sellerInfo.phone || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">Member ID:</span>
                                  <span>{sellerInfo.gecanMemberId || "Pending"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">Status:</span>
                                  <span>{sellerInfo.status}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center py-2">
                                <div className="animate-spin mr-2 h-4 w-4 text-primary">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                                <span>Loading seller information...</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Seller ID:</span>
                              <span>{selectedOffer.sellerUserId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Created:</span>
                              <span>{new Date(selectedOffer.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* PDF Export & Inquiry */}
                    <div className="space-y-3">
                      <Button 
                        variant="default"
                        className="w-full"
                        onClick={handleGeneratePdf}
                        disabled={generatePdfLoading}
                      >
                        {generatePdfLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download SCO as PDF
                          </>
                        )}
                      </Button>
                      
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="text-sm font-medium mb-2">Have questions about this offer?</h3>
                        <Textarea
                          placeholder="Enter your questions or clarifications..."
                          className="mb-3 min-h-[100px]"
                          value={offerQuestion}
                          onChange={(e) => setOfferQuestion(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleSubmitQuestion}
                          disabled={!offerQuestion.trim() || submittingQuestion}
                        >
                          {submittingQuestion ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Submit Inquiry
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Disclaimer and Footer */}
                <div className="bg-neutral-50 p-4 rounded-lg text-xs border mt-4">
                  <p className="text-neutral-500 italic">
                    DISCLAIMER: This Soft Corporate Offer (SCO) is intended solely for informational purposes and does not constitute a binding offer.
                    All transactions are subject to final contractual agreements between the parties, due diligence, and GECAN platform terms and conditions.
                    GECAN acts as a facilitator and does not guarantee the completion of any transaction or the quality of commodities offered.
                  </p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-200">
                    <span className="font-bold text-primary">GECAN</span>
                    <span className="text-neutral-500">Global Energy & Commodities Alliance Network</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between">
                <div>
                  {/* Admin or offer creator controls */}
                  {(user?.role === "GECAN_Admin" || user?.id === selectedOffer.sellerUserId) && (
                    <div className="flex gap-2">
                      {user?.role === "GECAN_Admin" ? (
                        <>
                          {/* If status is pending, show prominent approval button */}
                          {selectedOffer.status === "Pending Approval" && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleUpdateOfferStatus(selectedOffer.id, "Active")}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Approve Offer
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditOffer(selectedOffer)}
                            className="border-amber-500 text-amber-600 hover:bg-amber-50"
                          >
                            <Edit2 className="mr-1 h-4 w-4" />
                            Edit Offer
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteOffer(selectedOffer.id)}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete Offer
                          </Button>
                          
                          <Select 
                            defaultValue={selectedOffer.status}
                            onValueChange={(value) => handleUpdateOfferStatus(selectedOffer.id, value)}
                          >
                            <SelectTrigger className="w-36 h-9 text-xs">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="Expired">Expired</SelectItem>
                              <SelectItem value="Archived">Archived</SelectItem>
                              <SelectItem value="Matched">Matched</SelectItem>
                              <SelectItem value="Transaction Complete">Transaction Complete</SelectItem>
                              <SelectItem value="High Demand">High Demand</SelectItem>
                              <SelectItem value="Modification Requested">Modification Requested</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRequestModification(selectedOffer)}
                            className="border-amber-500 text-amber-600 hover:bg-amber-50"
                          >
                            Request Modification
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRequestDeletion(selectedOffer.id)}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            Request Deletion
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={() => setOfferDetailsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modification Request Dialog */}
      <Dialog open={requestModificationDialogOpen} onOpenChange={setRequestModificationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Offer Modification</DialogTitle>
            <DialogDescription>
              Explain the changes you need to make to your offer. An admin will review your request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Offer ID</div>
              <div className="text-sm text-muted-foreground">{selectedOffer?.offerId}</div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Current Status</div>
              <div>{selectedOffer && getStatusBadge(selectedOffer.status)}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">Reason for Modification</div>
              <Textarea 
                value={modificationReason}
                onChange={(e) => setModificationReason(e.target.value)}
                placeholder="Please explain what needs to be changed and why..."
                className="w-full min-h-[120px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestModificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitModificationRequest}
              disabled={!modificationReason.trim()}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AppLayout>
  );
}