import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { format } from "date-fns";
import { User, SellerOffer, BuyerEnquiry } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  await setupAuth(app);

  // Middleware to ensure user is authenticated
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to ensure user is admin
  const ensureAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && (req.user as User).role === "GECAN_Admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden - Admin access required" });
  };

  // Middleware to ensure user is vetted
  const ensureVetted = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && ((req.user as User).role === "Vetted_Member" || (req.user as User).role === "GECAN_Admin")) {
      return next();
    }
    res.status(403).json({ message: "Forbidden - Vetted member access required" });
  };

  // Generate a unique ID for offers and enquiries
  const generateUniqueId = (prefix: string, type: string) => {
    const date = format(new Date(), "yyyyMMdd-HHmmss");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}-${date}-${random}`;
  };

  // User routes
  app.get("/api/users/pending", ensureAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getUsersByRole("Pending_Verification");
      res.json(pendingUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  
  app.get("/api/users", ensureAdmin, async (req, res) => {
    try {
      // Get all users (for admin only)
      const users = await storage.getUsersByRole("");
      
      // Remove password from each user
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only admins can view other users' details
      if (user.id !== (req.user as User).id && (req.user as User).role !== "GECAN_Admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", ensureAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Create audit log for the update
      await storage.createAuditLog({
        userId: (req.user as User).id,
        actionType: "UPDATE_STATUS",
        targetEntity: "users",
        targetId: userId.toString(),
        details: { changes: req.body }
      });
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Due Diligence routes
  app.get("/api/due-diligence/:userId", ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Ensure only the user or an admin can access the record
      if (userId !== (req.user as User).id && (req.user as User).role !== "GECAN_Admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const record = await storage.getDueDiligenceRecordByUserId(userId);
      
      if (!record) {
        return res.status(404).json({ message: "Due diligence record not found" });
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch due diligence record" });
    }
  });

  app.patch("/api/due-diligence/:id", ensureAdmin, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const record = await storage.getDueDiligenceRecord(recordId);
      
      if (!record) {
        return res.status(404).json({ message: "Due diligence record not found" });
      }
      
      const updatedRecord = await storage.updateDueDiligenceRecord(recordId, req.body);
      
      if (!updatedRecord) {
        return res.status(500).json({ message: "Failed to update due diligence record" });
      }
      
      // If the status changed to "Approved", update the user's role to "Vetted_Member"
      if (req.body.status === "Approved") {
        const user = await storage.getUser(updatedRecord.userId);
        if (user && user.role === "Pending_Verification") {
          // Generate GECAN member ID
          const gecanMemberId = `GECAN-U-${Math.floor(100000 + Math.random() * 900000)}`;
          
          await storage.updateUser(user.id, {
            role: "Vetted_Member",
            status: "Active",
            gecanMemberId
          });
        }
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: (req.user as User).id,
        actionType: "UPDATE_STATUS",
        targetEntity: "dueDiligenceRecords",
        targetId: recordId.toString(),
        details: { changes: req.body }
      });
      
      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to update due diligence record" });
    }
  });

  // Seller Offer routes
  app.post("/api/seller-offers", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Admin can create offers regardless of member type
      if (user.role !== "GECAN_Admin" && !(user.memberType?.includes("Seller") || false)) {
        return res.status(403).json({ message: "Only sellers and admins can create offers" });
      }
      
      // Generate a unique offer ID
      const offerId = generateUniqueId("OFFER", req.body.offerType);
      
      // Auto-approve offers if created by an admin
      const initialStatus = user.role === "GECAN_Admin" ? "Active" : "Pending Approval";
      
      const offer = await storage.createSellerOffer({
        ...req.body,
        offerId,
        sellerUserId: user.id,
        status: initialStatus
      });
      
      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        actionType: "CREATE_OFFER",
        targetEntity: "sellerOffers",
        targetId: offer.id.toString(),
        details: { offerId, offerType: req.body.offerType }
      });
      
      res.status(201).json(offer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create seller offer" });
    }
  });

  app.get("/api/seller-offers", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      let offers: SellerOffer[] = [];
      
      // Admin can see all offers, others can only see their own or active ones
      if (user.role === "GECAN_Admin") {
        const statusFilter = req.query.status as string;
        if (statusFilter) {
          offers = await storage.getSellerOffersByStatus(statusFilter);
        } else {
          // Get all offers
          offers = await storage.getSellerOffersByStatus([
            "Pending Approval",
            "Active",
            "Inactive",
            "Expired",
            "Archived",
            "Matched",
            "Transaction Complete",
            "High Demand"
          ]);
        }
      } else if (user.memberType?.includes("Seller")) {
        // Sellers see their own offers
        offers = await storage.getSellerOffersBySellerId(user.id);
      } else {
        // Others only see active offers
        offers = await storage.getSellerOffersByStatus("Active");
      }
      
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seller offers" });
    }
  });

  app.get("/api/seller-offers/:id", ensureAuthenticated, async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const offer = await storage.getSellerOffer(offerId);
      
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      // Check permission: admin, offer owner, or if it's an active offer
      const user = req.user as User;
      if (
        user.role !== "GECAN_Admin" &&
        offer.sellerUserId !== user.id &&
        offer.status !== "Active"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(offer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seller offer" });
    }
  });

  app.patch("/api/seller-offers/:id", ensureAuthenticated, async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const offer = await storage.getSellerOffer(offerId);
      
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      const user = req.user as User;
      
      // Check permissions:
      // 1. Admin can do anything
      // 2. Seller can only modify their own offers but can't approve them
      if (user.role === "GECAN_Admin") {
        // Admin can do anything
        // If admin is approving the offer, update the admin ID
        if (req.body.status === "Active") {
          req.body.gecanAdminApproverId = user.id;
        }
      } else if (offer.sellerUserId === user.id) {
        // Seller can update their own offer but can't approve it
        if (req.body.status === "Active") {
          return res.status(403).json({ message: "Forbidden - Only admins can approve offers" });
        }
      } else {
        // Not admin and not the seller
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedOffer = await storage.updateSellerOffer(offerId, req.body);
      
      if (!updatedOffer) {
        return res.status(500).json({ message: "Failed to update offer" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        actionType: "UPDATE_STATUS",
        targetEntity: "sellerOffers",
        targetId: offerId.toString(),
        details: { changes: req.body }
      });
      
      res.json(updatedOffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update seller offer" });
    }
  });

  // Buyer Enquiry routes
  app.post("/api/buyer-enquiries", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Admin can create buyer enquiries regardless of member type
      if (user.role !== "GECAN_Admin" && !(user.memberType?.includes("Buyer") || false)) {
        return res.status(403).json({ message: "Only buyers and admins can create enquiries" });
      }
      
      // Generate a unique enquiry ID
      const enquiryId = generateUniqueId("ENQ", req.body.enquiryType);
      
      const enquiry = await storage.createBuyerEnquiry({
        ...req.body,
        enquiryId,
        buyerUserId: user.id,
        status: "Submitted"
      });
      
      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        actionType: "CREATE_OFFER", // Reusing same action type for both offers and enquiries
        targetEntity: "buyerEnquiries",
        targetId: enquiry.id.toString(),
        details: { enquiryId, enquiryType: req.body.enquiryType }
      });
      
      res.status(201).json(enquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create buyer enquiry" });
    }
  });

  app.get("/api/buyer-enquiries", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      let enquiries: BuyerEnquiry[] = [];
      
      // Admin can see all enquiries, others can only see their own or active ones
      if (user.role === "GECAN_Admin") {
        const statusFilter = req.query.status as string;
        if (statusFilter) {
          enquiries = await storage.getBuyerEnquiriesByStatus(statusFilter);
        } else {
          // Get all enquiries
          enquiries = await storage.getBuyerEnquiriesByStatus([
            "Draft",
            "Submitted",
            "Pending Review",
            "Active",
            "Matched",
            "Expired",
            "Archived"
          ]);
        }
      } else if (user.memberType?.includes("Buyer")) {
        // Buyers see their own enquiries
        enquiries = await storage.getBuyerEnquiriesByBuyerId(user.id);
      } else {
        // Others only see active enquiries
        enquiries = await storage.getBuyerEnquiriesByStatus("Active");
      }
      
      res.json(enquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch buyer enquiries" });
    }
  });

  app.get("/api/buyer-enquiries/:id", ensureAuthenticated, async (req, res) => {
    try {
      const enquiryId = parseInt(req.params.id);
      const enquiry = await storage.getBuyerEnquiry(enquiryId);
      
      if (!enquiry) {
        return res.status(404).json({ message: "Enquiry not found" });
      }
      
      // Check permission: admin, enquiry owner, or if it's an active enquiry
      const user = req.user as User;
      if (
        user.role !== "GECAN_Admin" &&
        enquiry.buyerUserId !== user.id &&
        enquiry.status !== "Active"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(enquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch buyer enquiry" });
    }
  });

  app.patch("/api/buyer-enquiries/:id", ensureAuthenticated, async (req, res) => {
    try {
      const enquiryId = parseInt(req.params.id);
      const enquiry = await storage.getBuyerEnquiry(enquiryId);
      
      if (!enquiry) {
        return res.status(404).json({ message: "Enquiry not found" });
      }
      
      const user = req.user as User;
      
      // Check permissions:
      // 1. Admin can do anything
      // 2. Buyer can only modify their own enquiries but can't approve them
      if (user.role === "GECAN_Admin") {
        // Admin can do anything 
      } else if (enquiry.buyerUserId === user.id) {
        // Buyer can update their own enquiry but can't approve it
        if (req.body.status === "Active") {
          return res.status(403).json({ message: "Forbidden - Only admins can approve enquiries" });
        }
      } else {
        // Not admin and not the buyer
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedEnquiry = await storage.updateBuyerEnquiry(enquiryId, req.body);
      
      if (!updatedEnquiry) {
        return res.status(500).json({ message: "Failed to update enquiry" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        actionType: "UPDATE_STATUS",
        targetEntity: "buyerEnquiries",
        targetId: enquiryId.toString(),
        details: { changes: req.body }
      });
      
      res.json(updatedEnquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update buyer enquiry" });
    }
  });

  // Match routes
  app.post("/api/matches", ensureAdmin, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Create a new match
      const match = await storage.createMatch({
        ...req.body,
        facilitatingAdminId: user.id,
        status: "Introduced"
      });
      
      // Update the status of the offer and enquiry
      if (match.offerId) {
        await storage.updateSellerOffer(match.offerId, { status: "Matched" });
      }
      
      if (match.enquiryId) {
        await storage.updateBuyerEnquiry(match.enquiryId, { status: "Matched" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        actionType: "VIEW_MATCH",
        targetEntity: "matches",
        targetId: match.id.toString(),
        details: { action: "create", offerId: match.offerId, enquiryId: match.enquiryId }
      });
      
      res.status(201).json(match);
    } catch (error) {
      res.status(500).json({ message: "Failed to create match" });
    }
  });

  app.get("/api/matches", ensureAdmin, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Admins can see matches they facilitated
      const matches = await storage.getMatchesByAdminId(user.id);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Document routes
  app.get("/api/documents", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Only vetted members and admins can access documents
      if (user.role !== "GECAN_Admin" && user.role !== "Vetted_Member") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      let documents;
      
      if (req.query.type) {
        documents = await storage.getDocumentsByType(req.query.type as string);
      } else if (req.query.commodityType) {
        documents = await storage.getDocumentsByCommodityType(req.query.commodityType as string);
      } else {
        // Get documents for all types
        documents = await Promise.all([
          storage.getDocumentsByType("NCNDA"),
          storage.getDocumentsByType("IMFPA"),
          storage.getDocumentsByType("SPA"),
          storage.getDocumentsByType("LOI"),
          storage.getDocumentsByType("ICPO"),
          storage.getDocumentsByType("SCO"),
          storage.getDocumentsByType("FCO"),
          storage.getDocumentsByType("DOA"),
          storage.getDocumentsByType("MOU"),
          storage.getDocumentsByType("KYC_Form")
        ]).then(results => results.flat());
      }
      
      // Create audit log for document access
      await storage.createAuditLog({
        userId: user.id,
        actionType: "DOWNLOAD_DOC",
        targetEntity: "documents",
        targetId: "multiple",
        details: { 
          query: req.query,
          count: documents.length
        }
      });
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Only vetted members and admins can access documents
      if (user.role !== "GECAN_Admin" && user.role !== "Vetted_Member") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Create audit log for document access
      await storage.createAuditLog({
        userId: user.id,
        actionType: "DOWNLOAD_DOC",
        targetEntity: "documents",
        targetId: documentId.toString(),
        details: { 
          docType: document.docType,
          templateName: document.templateName
        }
      });
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Stats for dashboard
  app.get("/api/stats", ensureAuthenticated, async (req, res) => {
    try {
      const pendingVerifications = (await storage.getUsersByRole("Pending_Verification")).length;
      const activeOffers = (await storage.getSellerOffersByStatus("Active")).length;
      const activeEnquiries = (await storage.getBuyerEnquiriesByStatus("Active")).length;
      
      // For recent matches, we'd need to query based on recent dates
      // This is a simplified approach
      const recentMatches = (await storage.getRecentAuditLogs(100))
        .filter(log => log.actionType === "VIEW_MATCH")
        .length;
      
      res.json({
        pendingVerifications,
        activeOffers,
        activeEnquiries,
        recentMatches
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
