import { 
  users, 
  dueDiligenceRecords,
  sellerOffers,
  buyerEnquiries,
  matches,
  documents,
  auditLogs,
  type User, 
  type InsertUser,
  type DueDiligenceRecord,
  type InsertDueDiligenceRecord,
  type SellerOffer,
  type InsertSellerOffer,
  type BuyerEnquiry,
  type InsertBuyerEnquiry,
  type Match,
  type InsertMatch,
  type Document,
  type InsertDocument,
  type AuditLog,
  type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, like, desc } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPgSimple(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Due Diligence operations
  getDueDiligenceRecord(id: number): Promise<DueDiligenceRecord | undefined>;
  getDueDiligenceRecordByUserId(userId: number): Promise<DueDiligenceRecord | undefined>;
  createDueDiligenceRecord(record: InsertDueDiligenceRecord): Promise<DueDiligenceRecord>;
  updateDueDiligenceRecord(id: number, updates: Partial<DueDiligenceRecord>): Promise<DueDiligenceRecord | undefined>;

  // Seller Offer operations
  getSellerOffer(id: number): Promise<SellerOffer | undefined>;
  getSellerOfferByOfferId(offerId: string): Promise<SellerOffer | undefined>;
  createSellerOffer(offer: InsertSellerOffer): Promise<SellerOffer>;
  updateSellerOffer(id: number, updates: Partial<SellerOffer>): Promise<SellerOffer | undefined>;
  getSellerOffersBySellerId(sellerId: number): Promise<SellerOffer[]>;
  getSellerOffersByStatus(status: string | string[]): Promise<SellerOffer[]>;
  getSellerOffersByType(offerType: string): Promise<SellerOffer[]>;

  // Buyer Enquiry operations
  getBuyerEnquiry(id: number): Promise<BuyerEnquiry | undefined>;
  getBuyerEnquiryByEnquiryId(enquiryId: string): Promise<BuyerEnquiry | undefined>;
  createBuyerEnquiry(enquiry: InsertBuyerEnquiry): Promise<BuyerEnquiry>;
  updateBuyerEnquiry(id: number, updates: Partial<BuyerEnquiry>): Promise<BuyerEnquiry | undefined>;
  getBuyerEnquiriesByBuyerId(buyerId: number): Promise<BuyerEnquiry[]>;
  getBuyerEnquiriesByStatus(status: string | string[]): Promise<BuyerEnquiry[]>;
  getBuyerEnquiriesByType(enquiryType: string): Promise<BuyerEnquiry[]>;

  // Match operations
  getMatch(id: number): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, updates: Partial<Match>): Promise<Match | undefined>;
  getMatchesByOfferId(offerId: number): Promise<Match[]>;
  getMatchesByEnquiryId(enquiryId: number): Promise<Match[]>;
  getMatchesByAdminId(adminId: number): Promise<Match[]>;

  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  getDocumentsByType(docType: string): Promise<Document[]>;
  getDocumentsByCommodityType(commodityType: string): Promise<Document[]>;

  // Audit Log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByUserId(userId: number): Promise<AuditLog[]>;
  getRecentAuditLogs(limit: number): Promise<AuditLog[]>;

  // Session store for auth
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  // Due Diligence methods
  async getDueDiligenceRecord(id: number): Promise<DueDiligenceRecord | undefined> {
    const [record] = await db.select().from(dueDiligenceRecords).where(eq(dueDiligenceRecords.id, id));
    return record;
  }

  async getDueDiligenceRecordByUserId(userId: number): Promise<DueDiligenceRecord | undefined> {
    const [record] = await db.select().from(dueDiligenceRecords).where(eq(dueDiligenceRecords.userId, userId));
    return record;
  }

  async createDueDiligenceRecord(record: InsertDueDiligenceRecord): Promise<DueDiligenceRecord> {
    const [createdRecord] = await db.insert(dueDiligenceRecords).values(record).returning();
    return createdRecord;
  }

  async updateDueDiligenceRecord(id: number, updates: Partial<DueDiligenceRecord>): Promise<DueDiligenceRecord | undefined> {
    const [updatedRecord] = await db
      .update(dueDiligenceRecords)
      .set(updates)
      .where(eq(dueDiligenceRecords.id, id))
      .returning();
    return updatedRecord;
  }

  // Seller Offer methods
  async getSellerOffer(id: number): Promise<SellerOffer | undefined> {
    const [offer] = await db.select().from(sellerOffers).where(eq(sellerOffers.id, id));
    return offer;
  }

  async getSellerOfferByOfferId(offerId: string): Promise<SellerOffer | undefined> {
    const [offer] = await db.select().from(sellerOffers).where(eq(sellerOffers.offerId, offerId));
    return offer;
  }

  async createSellerOffer(offer: InsertSellerOffer): Promise<SellerOffer> {
    const [createdOffer] = await db.insert(sellerOffers).values(offer).returning();
    return createdOffer;
  }

  async updateSellerOffer(id: number, updates: Partial<SellerOffer>): Promise<SellerOffer | undefined> {
    const [updatedOffer] = await db
      .update(sellerOffers)
      .set(updates)
      .where(eq(sellerOffers.id, id))
      .returning();
    return updatedOffer;
  }

  async getSellerOffersBySellerId(sellerId: number): Promise<SellerOffer[]> {
    return db.select().from(sellerOffers).where(eq(sellerOffers.sellerUserId, sellerId));
  }

  async getSellerOffersByStatus(status: string | string[]): Promise<SellerOffer[]> {
    if (Array.isArray(status)) {
      return db.select().from(sellerOffers).where(inArray(sellerOffers.status, status));
    }
    return db.select().from(sellerOffers).where(eq(sellerOffers.status, status));
  }

  async getSellerOffersByType(offerType: string): Promise<SellerOffer[]> {
    return db.select().from(sellerOffers).where(eq(sellerOffers.offerType, offerType));
  }

  // Buyer Enquiry methods
  async getBuyerEnquiry(id: number): Promise<BuyerEnquiry | undefined> {
    const [enquiry] = await db.select().from(buyerEnquiries).where(eq(buyerEnquiries.id, id));
    return enquiry;
  }

  async getBuyerEnquiryByEnquiryId(enquiryId: string): Promise<BuyerEnquiry | undefined> {
    const [enquiry] = await db.select().from(buyerEnquiries).where(eq(buyerEnquiries.enquiryId, enquiryId));
    return enquiry;
  }

  async createBuyerEnquiry(enquiry: InsertBuyerEnquiry): Promise<BuyerEnquiry> {
    const [createdEnquiry] = await db.insert(buyerEnquiries).values(enquiry).returning();
    return createdEnquiry;
  }

  async updateBuyerEnquiry(id: number, updates: Partial<BuyerEnquiry>): Promise<BuyerEnquiry | undefined> {
    const [updatedEnquiry] = await db
      .update(buyerEnquiries)
      .set(updates)
      .where(eq(buyerEnquiries.id, id))
      .returning();
    return updatedEnquiry;
  }

  async getBuyerEnquiriesByBuyerId(buyerId: number): Promise<BuyerEnquiry[]> {
    return db.select().from(buyerEnquiries).where(eq(buyerEnquiries.buyerUserId, buyerId));
  }

  async getBuyerEnquiriesByStatus(status: string | string[]): Promise<BuyerEnquiry[]> {
    if (Array.isArray(status)) {
      return db.select().from(buyerEnquiries).where(inArray(buyerEnquiries.status, status));
    }
    return db.select().from(buyerEnquiries).where(eq(buyerEnquiries.status, status));
  }

  async getBuyerEnquiriesByType(enquiryType: string): Promise<BuyerEnquiry[]> {
    return db.select().from(buyerEnquiries).where(eq(buyerEnquiries.enquiryType, enquiryType));
  }

  // Match methods
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [createdMatch] = await db.insert(matches).values(match).returning();
    return createdMatch;
  }

  async updateMatch(id: number, updates: Partial<Match>): Promise<Match | undefined> {
    const [updatedMatch] = await db
      .update(matches)
      .set(updates)
      .where(eq(matches.id, id))
      .returning();
    return updatedMatch;
  }

  async getMatchesByOfferId(offerId: number): Promise<Match[]> {
    return db.select().from(matches).where(eq(matches.offerId, offerId));
  }

  async getMatchesByEnquiryId(enquiryId: number): Promise<Match[]> {
    return db.select().from(matches).where(eq(matches.enquiryId, enquiryId));
  }

  async getMatchesByAdminId(adminId: number): Promise<Match[]> {
    return db.select().from(matches).where(eq(matches.facilitatingAdminId, adminId));
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [createdDocument] = await db.insert(documents).values(document).returning();
    return createdDocument;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async getDocumentsByType(docType: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.docType, docType));
  }

  async getDocumentsByCommodityType(commodityType: string): Promise<Document[]> {
    // This is a simplified implementation assuming commodityTypeScope is an array field
    // In a real implementation, you would use a more sophisticated query or a junction table
    return db.select().from(documents).where(like(documents.commodityTypeScope.toString(), `%${commodityType}%`));
  }

  // Audit Log methods
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const [createdLog] = await db.insert(auditLogs).values(auditLog).returning();
    return createdLog;
  }

  async getAuditLogsByUserId(userId: number): Promise<AuditLog[]> {
    return db.select().from(auditLogs).where(eq(auditLogs.userId, userId));
  }

  async getRecentAuditLogs(limit: number): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
  }
}

export const storage = new DatabaseStorage();
