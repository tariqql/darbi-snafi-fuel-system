import { db } from "./db";
import { eq, desc, like, or, asc, and, gte, lte } from "drizzle-orm";
import {
  users, wallets, vehicles, invoices, payments, journeys, journeyStops,
  fuelStations, fuelRequests, tankMeasurements, aiPredictions, snafiApprovals,
  partners, stationEmployees, fuelInventory, notifications, kycDocuments, userSessions,
  invoiceItems, vehicleCatalog, merchants,
  sandboxConfig, transactionLimits, moneyFlowLogs, limitBreaches,
  type User, type InsertUser,
  type Wallet, type InsertWallet,
  type Vehicle, type InsertVehicle,
  type Invoice, type InsertInvoice,
  type Payment, type InsertPayment,
  type Journey, type InsertJourney,
  type JourneyStop, type InsertJourneyStop,
  type FuelStation, type InsertFuelStation,
  type FuelRequest, type InsertFuelRequest,
  type TankMeasurement, type InsertTankMeasurement,
  type AiPrediction, type InsertAiPrediction,
  type SnafiApproval, type InsertSnafiApproval,
  type Partner, type InsertPartner,
  type Notification, type InsertNotification,
  type VehicleCatalog, type InsertVehicleCatalog,
  type Merchant, type InsertMerchant,
  type SandboxConfig, type InsertSandboxConfig,
  type TransactionLimit, type InsertTransactionLimit,
  type MoneyFlowLog, type InsertMoneyFlowLog,
  type LimitBreach, type InsertLimitBreach,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallets
  getWallet(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: string, amount: number): Promise<Wallet | undefined>;
  
  // Vehicles
  getVehicles(userId: string): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  
  // Invoices
  getInvoices(userId?: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined>;
  
  // Credit limits
  getUserCreditLimit(userId: string): Promise<number>;
  getUserTotalDebt(userId: string): Promise<number>;
  
  // Payments
  getPayments(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Journeys
  getJourneys(userId?: string): Promise<Journey[]>;
  getJourney(id: string): Promise<Journey | undefined>;
  createJourney(journey: InsertJourney): Promise<Journey>;
  deleteJourney(id: string): Promise<void>;
  
  // Fuel Stations
  getFuelStations(): Promise<FuelStation[]>;
  getFuelStation(id: string): Promise<FuelStation | undefined>;
  createFuelStation(station: InsertFuelStation): Promise<FuelStation>;
  
  // Fuel Requests
  getFuelRequests(userId?: string): Promise<FuelRequest[]>;
  getFuelRequest(id: string): Promise<FuelRequest | undefined>;
  getFuelRequestByQR(qrCode: string): Promise<FuelRequest | undefined>;
  createFuelRequest(request: InsertFuelRequest): Promise<FuelRequest>;
  updateFuelRequest(id: string, updates: Partial<FuelRequest>): Promise<FuelRequest | undefined>;
  
  // Tank Measurements
  getTankMeasurements(vehicleId?: string): Promise<TankMeasurement[]>;
  createTankMeasurement(measurement: InsertTankMeasurement): Promise<TankMeasurement>;
  
  // AI Predictions
  getAiPredictions(vehicleId?: string): Promise<AiPrediction[]>;
  createAiPrediction(prediction: InsertAiPrediction): Promise<AiPrediction>;
  
  // Snafi Approvals
  getSnafiApprovals(userId?: string): Promise<SnafiApproval[]>;
  createSnafiApproval(approval: InsertSnafiApproval): Promise<SnafiApproval>;
  
  // Partners
  getPartners(): Promise<Partner[]>;
  getPartner(id: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  
  // Vehicle Catalog
  getVehicleCatalog(): Promise<VehicleCatalog[]>;
  getVehicleCatalogMakes(): Promise<string[]>;
  getVehicleCatalogModels(make: string): Promise<string[]>;
  getVehicleCatalogYears(make: string, model: string): Promise<number[]>;
  getVehicleCatalogBySpec(make: string, model: string, year: number): Promise<VehicleCatalog | undefined>;
  searchVehicleCatalog(query: string): Promise<VehicleCatalog[]>;
  
  // Merchants
  getMerchant(id: string): Promise<Merchant | undefined>;
  getMerchantByCommercialReg(commercialReg: string): Promise<Merchant | undefined>;
  getMerchants(): Promise<Merchant[]>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant | undefined>;

  // Sandbox Config
  getSandboxConfig(): Promise<SandboxConfig | undefined>;
  createSandboxConfig(config: InsertSandboxConfig): Promise<SandboxConfig>;
  updateSandboxConfig(id: string, updates: Partial<SandboxConfig>): Promise<SandboxConfig | undefined>;

  // Transaction Limits
  getTransactionLimit(userId: string): Promise<TransactionLimit | undefined>;
  createTransactionLimit(limit: InsertTransactionLimit): Promise<TransactionLimit>;
  updateTransactionLimit(userId: string, updates: Partial<TransactionLimit>): Promise<TransactionLimit | undefined>;

  // Money Flow Logs
  getMoneyFlowLogs(filters?: { environment?: string; userId?: string; startDate?: Date; endDate?: Date }): Promise<MoneyFlowLog[]>;
  createMoneyFlowLog(log: InsertMoneyFlowLog): Promise<MoneyFlowLog>;

  // Limit Breaches
  getLimitBreaches(filters?: { userId?: string; environment?: string }): Promise<LimitBreach[]>;
  createLimitBreach(breach: InsertLimitBreach): Promise<LimitBreach>;

  // Monitoring Stats
  getMonitoringStats(environment?: string): Promise<{
    totalTransactions: number;
    totalAmount: number;
    activeUsers: number;
    flaggedTransactions: number;
    limitBreachCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Wallets
  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async updateWalletBalance(userId: string, amount: number): Promise<Wallet | undefined> {
    const wallet = await this.getWallet(userId);
    if (!wallet) return undefined;
    const [updated] = await db.update(wallets)
      .set({ balance: (wallet.balance || 0) + amount })
      .where(eq(wallets.userId, userId))
      .returning();
    return updated;
  }

  // Vehicles
  async getVehicles(userId: string): Promise<Vehicle[]> {
    return db.select().from(vehicles).where(eq(vehicles.userId, userId));
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  // Invoices
  async getInvoices(userId?: string): Promise<Invoice[]> {
    if (userId) {
      return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
    }
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const invoiceNumber = `INV-${Date.now()}`;
    const [newInvoice] = await db.insert(invoices).values({ ...invoice, invoiceNumber }).returning();
    return newInvoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const [updated] = await db.update(invoices).set(updates).where(eq(invoices.id, id)).returning();
    return updated;
  }

  // Credit limits - حساب حد الائتمان والديون
  async getUserCreditLimit(userId: string): Promise<number> {
    // الحد الافتراضي للائتمان هو 2000 ريال
    // في الإنتاج، سيتم جلب هذا من بيانات التحقق (سمة/GOSI)
    const user = await this.getUser(userId);
    if (!user) return 2000; // الحد الافتراضي
    
    // يمكن تحسين هذا لاحقاً بناءً على تقييم العميل
    return 5000; // الحد الأقصى الافتراضي
  }

  async getUserTotalDebt(userId: string): Promise<number> {
    // حساب إجمالي الديون المستحقة (الفواتير النشطة غير المسددة)
    const userInvoices = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.status, "active")
      ));
    
    return userInvoices.reduce((total, inv) => {
      return total + (inv.totalAmount - (inv.paidAmount || 0));
    }, 0);
  }

  // Payments
  async getPayments(invoiceId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const transactionRef = `TXN-${Date.now()}`;
    const [newPayment] = await db.insert(payments).values({ ...payment, transactionRef }).returning();
    return newPayment;
  }

  // Journeys
  async getJourneys(userId?: string): Promise<Journey[]> {
    if (userId) {
      return db.select().from(journeys).where(eq(journeys.userId, userId)).orderBy(desc(journeys.createdAt));
    }
    return db.select().from(journeys).orderBy(desc(journeys.createdAt));
  }

  async getJourney(id: string): Promise<Journey | undefined> {
    const [journey] = await db.select().from(journeys).where(eq(journeys.id, id));
    return journey;
  }

  async createJourney(journey: InsertJourney): Promise<Journey> {
    const [newJourney] = await db.insert(journeys).values(journey).returning();
    return newJourney;
  }

  async deleteJourney(id: string): Promise<void> {
    await db.delete(journeys).where(eq(journeys.id, id));
  }

  // Fuel Stations
  async getFuelStations(): Promise<FuelStation[]> {
    return db.select().from(fuelStations);
  }

  async getFuelStation(id: string): Promise<FuelStation | undefined> {
    const [station] = await db.select().from(fuelStations).where(eq(fuelStations.id, id));
    return station;
  }

  async createFuelStation(station: InsertFuelStation): Promise<FuelStation> {
    const [newStation] = await db.insert(fuelStations).values(station).returning();
    return newStation;
  }

  // Fuel Requests
  async getFuelRequests(userId?: string): Promise<FuelRequest[]> {
    if (userId) {
      return db.select().from(fuelRequests).where(eq(fuelRequests.userId, userId)).orderBy(desc(fuelRequests.createdAt));
    }
    return db.select().from(fuelRequests).orderBy(desc(fuelRequests.createdAt));
  }

  async getFuelRequest(id: string): Promise<FuelRequest | undefined> {
    const [request] = await db.select().from(fuelRequests).where(eq(fuelRequests.id, id));
    return request;
  }

  async getFuelRequestByQR(qrCode: string): Promise<FuelRequest | undefined> {
    const [request] = await db.select().from(fuelRequests).where(eq(fuelRequests.qrCode, qrCode));
    return request;
  }

  async createFuelRequest(request: InsertFuelRequest): Promise<FuelRequest> {
    const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const [newRequest] = await db.insert(fuelRequests).values({ ...request, qrCode, expiresAt }).returning();
    return newRequest;
  }

  async updateFuelRequest(id: string, updates: Partial<FuelRequest>): Promise<FuelRequest | undefined> {
    const [updated] = await db.update(fuelRequests).set(updates).where(eq(fuelRequests.id, id)).returning();
    return updated;
  }

  // Tank Measurements
  async getTankMeasurements(vehicleId?: string): Promise<TankMeasurement[]> {
    if (vehicleId) {
      return db.select().from(tankMeasurements).where(eq(tankMeasurements.vehicleId, vehicleId)).orderBy(desc(tankMeasurements.measuredAt));
    }
    return db.select().from(tankMeasurements).orderBy(desc(tankMeasurements.measuredAt));
  }

  async createTankMeasurement(measurement: InsertTankMeasurement): Promise<TankMeasurement> {
    const [newMeasurement] = await db.insert(tankMeasurements).values(measurement).returning();
    return newMeasurement;
  }

  // AI Predictions
  async getAiPredictions(vehicleId?: string): Promise<AiPrediction[]> {
    if (vehicleId) {
      return db.select().from(aiPredictions).where(eq(aiPredictions.vehicleId, vehicleId)).orderBy(desc(aiPredictions.createdAt));
    }
    return db.select().from(aiPredictions).orderBy(desc(aiPredictions.createdAt));
  }

  async createAiPrediction(prediction: InsertAiPrediction): Promise<AiPrediction> {
    const [newPrediction] = await db.insert(aiPredictions).values(prediction).returning();
    return newPrediction;
  }

  // Snafi Approvals
  async getSnafiApprovals(userId?: string): Promise<SnafiApproval[]> {
    if (userId) {
      return db.select().from(snafiApprovals).where(eq(snafiApprovals.userId, userId)).orderBy(desc(snafiApprovals.decidedAt));
    }
    return db.select().from(snafiApprovals).orderBy(desc(snafiApprovals.decidedAt));
  }

  async createSnafiApproval(approval: InsertSnafiApproval): Promise<SnafiApproval> {
    const [newApproval] = await db.insert(snafiApprovals).values(approval).returning();
    return newApproval;
  }

  // Partners
  async getPartners(): Promise<Partner[]> {
    return db.select().from(partners);
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner;
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [newPartner] = await db.insert(partners).values(partner).returning();
    return newPartner;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.sentAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  // Vehicle Catalog
  async getVehicleCatalog(): Promise<VehicleCatalog[]> {
    return db.select().from(vehicleCatalog)
      .where(eq(vehicleCatalog.isActive, true))
      .orderBy(asc(vehicleCatalog.popularity));
  }

  async getVehicleCatalogMakes(): Promise<string[]> {
    const results = await db.selectDistinct({ 
      make: vehicleCatalog.make, 
      makeAr: vehicleCatalog.makeAr,
      popularity: vehicleCatalog.popularity 
    })
      .from(vehicleCatalog)
      .where(eq(vehicleCatalog.isActive, true))
      .orderBy(asc(vehicleCatalog.popularity));
    
    // Remove duplicates while preserving order
    const seen = new Set<string>();
    return results
      .filter(r => {
        if (seen.has(r.makeAr)) return false;
        seen.add(r.makeAr);
        return true;
      })
      .map(r => r.makeAr);
  }

  async getVehicleCatalogModels(make: string): Promise<string[]> {
    const results = await db.selectDistinct({ 
      model: vehicleCatalog.model, 
      modelAr: vehicleCatalog.modelAr,
      popularity: vehicleCatalog.popularity 
    })
      .from(vehicleCatalog)
      .where(and(
        eq(vehicleCatalog.isActive, true),
        or(eq(vehicleCatalog.make, make), eq(vehicleCatalog.makeAr, make))
      ))
      .orderBy(asc(vehicleCatalog.popularity));
    
    // Remove duplicates while preserving order
    const seen = new Set<string>();
    return results
      .filter(r => {
        if (seen.has(r.modelAr)) return false;
        seen.add(r.modelAr);
        return true;
      })
      .map(r => r.modelAr);
  }

  async getVehicleCatalogYears(make: string, model: string): Promise<number[]> {
    const [result] = await db.select({ yearFrom: vehicleCatalog.yearFrom, yearTo: vehicleCatalog.yearTo })
      .from(vehicleCatalog)
      .where(and(
        eq(vehicleCatalog.isActive, true),
        or(eq(vehicleCatalog.make, make), eq(vehicleCatalog.makeAr, make)),
        or(eq(vehicleCatalog.model, model), eq(vehicleCatalog.modelAr, model))
      ));
    
    if (!result) return [];
    const years: number[] = [];
    for (let year = result.yearTo; year >= result.yearFrom; year--) {
      years.push(year);
    }
    return years;
  }

  async getVehicleCatalogBySpec(make: string, model: string, year: number): Promise<VehicleCatalog | undefined> {
    const [result] = await db.select().from(vehicleCatalog)
      .where(and(
        eq(vehicleCatalog.isActive, true),
        or(eq(vehicleCatalog.make, make), eq(vehicleCatalog.makeAr, make)),
        or(eq(vehicleCatalog.model, model), eq(vehicleCatalog.modelAr, model)),
        lte(vehicleCatalog.yearFrom, year),
        gte(vehicleCatalog.yearTo, year)
      ));
    return result;
  }

  async searchVehicleCatalog(query: string): Promise<VehicleCatalog[]> {
    return db.select().from(vehicleCatalog)
      .where(and(
        eq(vehicleCatalog.isActive, true),
        or(
          like(vehicleCatalog.make, `%${query}%`),
          like(vehicleCatalog.makeAr, `%${query}%`),
          like(vehicleCatalog.model, `%${query}%`),
          like(vehicleCatalog.modelAr, `%${query}%`)
        )
      ))
      .orderBy(asc(vehicleCatalog.popularity))
      .limit(20);
  }

  // Merchants
  async getMerchant(id: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant;
  }

  async getMerchantByCommercialReg(commercialReg: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.commercialReg, commercialReg));
    return merchant;
  }

  async getMerchants(): Promise<Merchant[]> {
    return db.select().from(merchants).orderBy(desc(merchants.createdAt));
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const [newMerchant] = await db.insert(merchants).values(merchant).returning();
    return newMerchant;
  }

  async updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant | undefined> {
    const [updated] = await db.update(merchants).set(updates).where(eq(merchants.id, id)).returning();
    return updated;
  }

  // Sandbox Config
  async getSandboxConfig(): Promise<SandboxConfig | undefined> {
    const [config] = await db.select().from(sandboxConfig).where(eq(sandboxConfig.isActive, true)).limit(1);
    return config;
  }

  async createSandboxConfig(config: InsertSandboxConfig): Promise<SandboxConfig> {
    const [newConfig] = await db.insert(sandboxConfig).values(config).returning();
    return newConfig;
  }

  async updateSandboxConfig(id: string, updates: Partial<SandboxConfig>): Promise<SandboxConfig | undefined> {
    const [updated] = await db.update(sandboxConfig).set(updates).where(eq(sandboxConfig.id, id)).returning();
    return updated;
  }

  // Transaction Limits
  async getTransactionLimit(userId: string): Promise<TransactionLimit | undefined> {
    const [limit] = await db.select().from(transactionLimits).where(eq(transactionLimits.userId, userId));
    return limit;
  }

  async createTransactionLimit(limit: InsertTransactionLimit): Promise<TransactionLimit> {
    const [newLimit] = await db.insert(transactionLimits).values(limit).returning();
    return newLimit;
  }

  async updateTransactionLimit(userId: string, updates: Partial<TransactionLimit>): Promise<TransactionLimit | undefined> {
    const [updated] = await db.update(transactionLimits).set(updates).where(eq(transactionLimits.userId, userId)).returning();
    return updated;
  }

  // Money Flow Logs
  async getMoneyFlowLogs(filters?: { environment?: string; userId?: string; startDate?: Date; endDate?: Date }): Promise<MoneyFlowLog[]> {
    const conditions = [];
    if (filters?.environment) conditions.push(eq(moneyFlowLogs.environment, filters.environment));
    if (filters?.userId) conditions.push(eq(moneyFlowLogs.userId, filters.userId));
    if (filters?.startDate) conditions.push(gte(moneyFlowLogs.createdAt, filters.startDate));
    if (filters?.endDate) conditions.push(lte(moneyFlowLogs.createdAt, filters.endDate));

    if (conditions.length > 0) {
      return db.select().from(moneyFlowLogs).where(and(...conditions)).orderBy(desc(moneyFlowLogs.createdAt)).limit(500);
    }
    return db.select().from(moneyFlowLogs).orderBy(desc(moneyFlowLogs.createdAt)).limit(500);
  }

  async createMoneyFlowLog(log: InsertMoneyFlowLog): Promise<MoneyFlowLog> {
    const [newLog] = await db.insert(moneyFlowLogs).values(log).returning();
    return newLog;
  }

  // Limit Breaches
  async getLimitBreaches(filters?: { userId?: string; environment?: string }): Promise<LimitBreach[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(limitBreaches.userId, filters.userId));
    if (filters?.environment) conditions.push(eq(limitBreaches.environment, filters.environment));

    if (conditions.length > 0) {
      return db.select().from(limitBreaches).where(and(...conditions)).orderBy(desc(limitBreaches.createdAt)).limit(200);
    }
    return db.select().from(limitBreaches).orderBy(desc(limitBreaches.createdAt)).limit(200);
  }

  async createLimitBreach(breach: InsertLimitBreach): Promise<LimitBreach> {
    const [newBreach] = await db.insert(limitBreaches).values(breach).returning();
    return newBreach;
  }

  // Monitoring Stats
  async getMonitoringStats(environment?: string): Promise<{
    totalTransactions: number;
    totalAmount: number;
    activeUsers: number;
    flaggedTransactions: number;
    limitBreachCount: number;
  }> {
    const env = environment || "sandbox";
    const logs = await db.select().from(moneyFlowLogs).where(eq(moneyFlowLogs.environment, env));
    const breaches = await db.select().from(limitBreaches).where(eq(limitBreaches.environment, env));
    const flagged = logs.filter(l => l.flagged);
    const uniqueUsers = new Set(logs.map(l => l.userId).filter(Boolean));
    const totalAmount = logs.reduce((sum, l) => sum + (l.amount || 0), 0);

    return {
      totalTransactions: logs.length,
      totalAmount,
      activeUsers: uniqueUsers.size,
      flaggedTransactions: flagged.length,
      limitBreachCount: breaches.length,
    };
  }
}

export const storage = new DatabaseStorage();
