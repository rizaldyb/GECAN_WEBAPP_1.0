import { pgTable, text, serial, integer, boolean, date, timestamp, json, uuid, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  companyName: text("company_name").notNull(),
  role: text("role", { enum: ['GECAN_Admin', 'Vetted_Member', 'Pending_Verification', 'Rejected'] }).notNull().default('Pending_Verification'),
  gecanMemberId: text("gecan_member_id").unique(),
  status: text("status", { enum: ['Pending', 'Active', 'Suspended', 'Archived'] }).notNull().default('Pending'),
  verificationLevel: text("verification_level", { enum: ['L0', 'L1', 'L2', 'L3', 'L4'] }),
  memberType: text("member_type", { enum: ['Buyer', 'Seller', 'Broker', 'Intermediary', 'Strategic_Partner', 'Multiple'] }).array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
  profileData: json("profile_data"),
  phone: text("phone"),
  position: text("position"),
  linkedinProfile: text("linkedin_profile"),
});

// Due Diligence Records Table
export const dueDiligenceRecords = pgTable("due_diligence_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status", { enum: ['Pending', 'Info Requested', 'Under Review', 'Approved', 'Rejected', 'Re-Verification Needed'] }).notNull().default('Pending'),
  assignedAdminId: integer("assigned_admin_id").references(() => users.id),
  checklistItems: json("checklist_items"),
  uploadedDocuments: json("uploaded_documents"),
  notes: text("notes"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Seller Offers Table
export const sellerOffers = pgTable("seller_offers", {
  id: serial("id").primaryKey(),
  offerId: text("offer_id").notNull().unique(),
  sellerUserId: integer("seller_user_id").notNull().references(() => users.id),
  offerType: text("offer_type", { enum: ['GOLD', 'BTC', 'USDT', 'PALLET', 'PETRO', 'SBLCM', 'SBLCP'] }).notNull(),
  status: text("status", { enum: ['Pending Approval', 'Active', 'Inactive', 'Expired', 'Archived', 'Matched', 'Transaction Complete', 'High Demand', 'Modification Requested'] }).notNull().default('Pending Approval'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiryDate: date("expiry_date"),
  gecanAdminApproverId: integer("gecan_admin_approver_id").references(() => users.id),
  internalNotes: text("internal_notes"),
  
  // Modification request fields
  modificationReason: text("modification_reason"),
  originalStatus: text("original_status"),
  
  // Common commodity attributes
  commodityDetails: json("commodity_details").notNull(),

  // These would be better defined in a normalized way with separate tables for each commodity type,
  // but for simplicity and as indicated in the requirements, we're using a JSON field to store 
  // all commodity-specific attributes
});

// Buyer Enquiries Table
export const buyerEnquiries = pgTable("buyer_enquiries", {
  id: serial("id").primaryKey(),
  enquiryId: text("enquiry_id").notNull().unique(),
  buyerUserId: integer("buyer_user_id").notNull().references(() => users.id),
  enquiryType: text("enquiry_type", { enum: ['GOLD', 'BTC', 'USDT', 'PALLET', 'PETRO', 'SBLCM', 'SBLCP'] }).notNull(),
  status: text("status", { enum: ['Draft', 'Submitted', 'Pending Review', 'Active', 'Matched', 'Expired', 'Archived'] }).notNull().default('Submitted'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Commodity-specific requirements stored as JSON
  enquiryDetails: json("enquiry_details").notNull(),
});

// Matches Table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").references(() => sellerOffers.id),
  enquiryId: integer("enquiry_id").references(() => buyerEnquiries.id),
  status: text("status", { enum: ['Introduced', 'Negotiating', 'Contracted', 'Completed', 'Cancelled'] }).notNull().default('Introduced'),
  facilitatingAdminId: integer("facilitating_admin_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  notes: text("notes"),
});

// Documents Table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  docType: text("doc_type", { enum: ['NCNDA', 'IMFPA', 'SPA', 'LOI', 'ICPO', 'SCO', 'FCO', 'DOA', 'MOU', 'KYC_Form'] }).notNull(),
  templateName: text("template_name").notNull(),
  templateContent: text("template_content").notNull(),
  version: text("version").notNull(),
  commodityTypeScope: text("commodity_type_scope").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Audit Log Table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  actionType: text("action_type", { enum: ['LOGIN', 'CREATE_OFFER', 'UPDATE_STATUS', 'VIEW_MATCH', 'DOWNLOAD_DOC'] }).notNull(),
  targetEntity: text("target_entity"),
  targetId: text("target_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  details: json("details"),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  gecanMemberId: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertDueDiligenceRecordSchema = createInsertSchema(dueDiligenceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  rejectedAt: true,
});

export const insertSellerOfferSchema = createInsertSchema(sellerOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBuyerEnquirySchema = createInsertSchema(buyerEnquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

// Extended schemas for registration and login
export const userRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
  memberType: z.array(z.enum(['Buyer', 'Seller', 'Broker', 'Intermediary', 'Strategic_Partner', 'Multiple'])).min(1),
  phone: z.string().optional(),
  position: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDueDiligenceRecord = z.infer<typeof insertDueDiligenceRecordSchema>;
export type InsertSellerOffer = z.infer<typeof insertSellerOfferSchema>;
export type InsertBuyerEnquiry = z.infer<typeof insertBuyerEnquirySchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type User = typeof users.$inferSelect;
export type DueDiligenceRecord = typeof dueDiligenceRecords.$inferSelect;
export type SellerOffer = typeof sellerOffers.$inferSelect;
export type BuyerEnquiry = typeof buyerEnquiries.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
