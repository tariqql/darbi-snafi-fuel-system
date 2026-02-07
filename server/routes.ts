import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { 
  insertInvoiceSchema, insertJourneySchema, 
  insertTankMeasurementSchema, insertAiPredictionSchema,
  insertFuelRequestSchema, insertVehicleSchema,
  merchantRegistrationSchema,
  insertSandboxConfigSchema,
  insertMoneyFlowLogSchema,
} from "@shared/schema";
import { 
  getUncachableGitHubClient, 
  getAuthenticatedUser, 
  listRepositories, 
  createRepository,
  createOrUpdateFile,
  getFileContent
} from "./github";
import * as fs from "fs";
import * as path from "path";
import { 
  nafathService, 
  complianceService, 
  creditService, 
  employmentService, 
  customerRatingService 
} from "./services";
import {
  nafathInitiateSchema,
  nafathSimulateSchema,
  complianceCheckSchema,
  creditReportSchema,
  creditEvaluateSchema,
  employmentVerifySchema,
  customerEvaluateSchema,
  decisionSupportRequestSchema,
  acceptRecommendationSchema,
  recordActualRefuelingSchema,
  updateFuelPriceSchema,
} from "./services/validation";
import { snafiDecisionService } from "./services";
import { adminService } from "./services/admin.service";

// ============ RATE LIMITING (Anti-Brute Force) ============
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max 10 invoice requests per minute per IP

function getRateLimitKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW };
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetIn: entry.resetTime - now };
}

// ============ INPUT SANITIZATION (Anti-XSS/Injection) ============
function sanitizeString(input: string): string {
  if (typeof input !== "string") return input;
  return input
    .replace(/[<>]/g, "") // Remove < and > to prevent XSS
    .replace(/['";]/g, "") // Remove quotes and semicolons to prevent SQL injection
    .replace(/--/g, "") // Remove SQL comment markers
    .replace(/\\/g, "") // Remove backslashes
    .trim()
    .slice(0, 255); // Limit length
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isAlphanumericId(str: string): boolean {
  // Allow alphanumeric, hyphens, and underscores for user IDs
  const idRegex = /^[a-zA-Z0-9_-]{1,100}$/;
  return idRegex.test(str);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============ App Type Detection API (Subdomain Routing) ============
  app.get("/api/app-type", (req, res) => {
    const host = req.headers.host || "";
    
    let appType: "customer" | "merchant" | "admin" = "customer";
    let appName = "تطبيق العملاء";
    let appNameEn = "Customer App";
    
    if (host.startsWith("partners.") || host.startsWith("business.") || host.startsWith("merchant.")) {
      appType = "merchant";
      appName = "بوابة التجار";
      appNameEn = "Merchant Portal";
    } else if (host.startsWith("admin.") || host.startsWith("dashboard.")) {
      appType = "admin";
      appName = "لوحة الموظفين";
      appNameEn = "Admin Dashboard";
    }
    
    res.json({
      appType,
      appName,
      appNameEn,
      host,
      domains: {
        customer: "darbby.co",
        merchant: "partners.darbby.co",
        admin: "admin.darbby.co"
      }
    });
  });

  // ============ Merchant Registration API ============
  app.post("/api/merchants/register", async (req, res) => {
    try {
      const validationResult = merchantRegistrationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return res.status(400).json({ 
          error: "بيانات غير صحيحة",
          message: firstError?.message || "يرجى التحقق من البيانات المدخلة"
        });
      }

      const { companyName, commercialReg, city, contactPhone, contactEmail } = validationResult.data;
      const sanitizedReg = sanitizeString(commercialReg);
      const sanitizedPhone = sanitizeString(contactPhone);
      
      const existingMerchant = await storage.getMerchantByCommercialReg(sanitizedReg);
      
      if (existingMerchant) {
        return res.json({
          isExisting: true,
          status: existingMerchant.status,
          merchantId: existingMerchant.id,
          message: existingMerchant.status === "active" 
            ? "مرحباً بعودتك! حسابك نشط" 
            : "طلبك قيد المراجعة"
        });
      }

      const merchantCode = `MERCH-${Date.now().toString(36).toUpperCase()}`;
      
      const newMerchant = await storage.createMerchant({
        merchantCode,
        companyName: sanitizeString(companyName),
        companyNameAr: sanitizeString(companyName),
        commercialReg: sanitizedReg,
        contactEmail: contactEmail ? sanitizeString(contactEmail) : `${sanitizedPhone}@merchant.darbby.co`,
        contactPhone: sanitizedPhone,
        category: "fuel_station",
        status: "pending",
        isVerified: false,
        commissionRate: 3,
        settlementDays: 1,
        maxTransactionLimit: 5000,
        monthlyLimit: 100000,
        currentMonthVolume: 0,
        totalTransactions: 0,
      });

      res.status(201).json({
        isExisting: false,
        status: "pending",
        merchantId: newMerchant.id,
        merchantCode: newMerchant.merchantCode,
        message: "تم استلام طلبك بنجاح! سيتواصل معك فريقنا خلال 24 ساعة"
      });
    } catch (error) {
      console.error("Merchant registration error:", error);
      res.status(500).json({ 
        error: "حدث خطأ",
        message: "يرجى المحاولة مرة أخرى لاحقاً"
      });
    }
  });

  app.get("/api/merchants/check/:commercialReg", async (req, res) => {
    try {
      const { commercialReg } = req.params;
      const sanitizedReg = sanitizeString(commercialReg);
      
      const merchant = await storage.getMerchantByCommercialReg(sanitizedReg);
      
      if (merchant) {
        res.json({
          exists: true,
          status: merchant.status,
          companyName: merchant.companyName
        });
      } else {
        res.json({ exists: false });
      }
    } catch (error) {
      console.error("Merchant check error:", error);
      res.status(500).json({ error: "حدث خطأ" });
    }
  });
  
  // ============ Invoices API ============
  
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      // ============ RATE LIMITING CHECK ============
      const rateLimitKey = getRateLimitKey(req);
      const rateCheck = checkRateLimit(rateLimitKey);
      
      if (!rateCheck.allowed) {
        return res.status(429).json({ 
          error: "تم تجاوز الحد الأقصى للطلبات. يرجى الانتظار.",
          retryAfter: Math.ceil(rateCheck.resetIn / 1000),
          code: "RATE_LIMIT_EXCEEDED"
        });
      }
      
      // Add rate limit headers
      res.set("X-RateLimit-Remaining", String(rateCheck.remaining));
      res.set("X-RateLimit-Reset", String(Math.ceil(rateCheck.resetIn / 1000)));
      
      const { userId, stationId, liters, installmentMonths, fuelType, decisionSupportId } = req.body;
      
      // ============ INPUT VALIDATION ============
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId مطلوب ويجب أن يكون نصاً" });
      }
      if (!stationId || typeof stationId !== "string") {
        return res.status(400).json({ error: "stationId مطلوب ويجب أن يكون نصاً" });
      }
      if (liters === undefined || liters === null) {
        return res.status(400).json({ error: "liters مطلوب" });
      }
      if (!installmentMonths) {
        return res.status(400).json({ error: "installmentMonths مطلوب" });
      }
      
      // ============ INPUT SANITIZATION ============
      const sanitizedUserId = sanitizeString(userId);
      if (!isAlphanumericId(sanitizedUserId)) {
        return res.status(400).json({ 
          error: "معرّف المستخدم غير صالح (يجب أن يحتوي على أحرف وأرقام فقط)",
          code: "INVALID_USER_ID"
        });
      }
      
      // Validate stationId is a valid UUID
      if (!isValidUUID(stationId)) {
        return res.status(400).json({ 
          error: "معرّف المحطة غير صالح",
          code: "INVALID_STATION_ID"
        });
      }

      // التحقق من صحة الكمية
      const litersNum = typeof liters === "number" ? liters : parseFloat(liters);
      if (isNaN(litersNum) || litersNum <= 0 || litersNum > 200) {
        return res.status(400).json({ error: "كمية الوقود غير صالحة (يجب أن تكون بين 1 و 200 لتر)" });
      }

      // التحقق من عدد الأقساط
      const months = typeof installmentMonths === "number" ? installmentMonths : parseInt(installmentMonths);
      if (![2, 3, 4, 6].includes(months)) {
        return res.status(400).json({ error: "عدد الأقساط غير صالح (2, 3, 4, أو 6)" });
      }

      // التحقق من نوع الوقود
      if (fuelType && !["91", "95", "diesel"].includes(fuelType)) {
        return res.status(400).json({ error: "نوع الوقود غير صالح (91, 95, أو diesel)" });
      }

      // جلب بيانات المحطة للحساب في الخادم
      const station = await storage.getFuelStation(stationId);
      if (!station) {
        return res.status(404).json({ error: "المحطة غير موجودة" });
      }

      // التحقق من أن المحطة نشطة
      if (!station.isActive) {
        return res.status(400).json({ error: "المحطة غير نشطة حالياً" });
      }

      // التحقق من وجود جلسة Decision Support (اختياري للتتبع)
      let verifiedDecisionId: string | null = null;
      if (decisionSupportId && typeof decisionSupportId === "string") {
        // Sanitize and validate decision ID
        const sanitizedDecisionId = sanitizeString(decisionSupportId);
        if (isValidUUID(sanitizedDecisionId) || isAlphanumericId(sanitizedDecisionId)) {
          verifiedDecisionId = sanitizedDecisionId;
        }
      }

      // حساب المبلغ في الخادم (وليس من العميل)
      const pricePerLiter = station.pricePerLiter || 2.33;
      const totalAmount = Math.round(litersNum * pricePerLiter * 100) / 100; // تقريب لمنزلتين
      const monthlyAmount = Math.round((totalAmount / months) * 100) / 100;

      // التحقق من حد الائتمان للمستخدم
      const creditLimit = await storage.getUserCreditLimit(sanitizedUserId);
      const existingDebt = await storage.getUserTotalDebt(sanitizedUserId);
      const availableCredit = creditLimit - existingDebt;

      if (totalAmount > availableCredit) {
        return res.status(400).json({ 
          error: "المبلغ يتجاوز حد الائتمان المتاح",
          availableCredit: Math.round(availableCredit * 100) / 100,
          requestedAmount: totalAmount,
          creditLimit
        });
      }

      const invoice = await storage.createInvoice({
        userId: sanitizedUserId,
        stationId,
        decisionSupportId: verifiedDecisionId,
        fuelType: fuelType || null,
        liters: litersNum,
        totalAmount,
        installmentMonths: months,
        monthlyAmount,
        status: "active",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      
      res.status(201).json({
        ...invoice,
        stationName: station.name,
        pricePerLiter,
      });
    } catch (error: any) {
      console.error("Invoice creation error:", error);
      res.status(400).json({ error: error.message || "فشل إنشاء الفاتورة" });
    }
  });

  app.post("/api/invoices/:id/pay", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const newPaidAmount = (invoice.paidAmount || 0) + invoice.monthlyAmount;
      const status = newPaidAmount >= invoice.totalAmount ? "paid" : "active";

      await storage.createPayment({
        invoiceId: invoice.id,
        amount: invoice.monthlyAmount,
        paymentMethod: "wallet",
        status: "completed",
      });

      const updated = await storage.updateInvoice(req.params.id, {
        paidAmount: newPaidAmount,
        status,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  // ============ Vehicle Catalog API ============
  
  // Get all vehicle makes (brands)
  app.get("/api/vehicles/catalog/makes", async (req, res) => {
    try {
      const makes = await storage.getVehicleCatalogMakes();
      res.json(makes);
    } catch (error: any) {
      console.error("Error fetching vehicle makes:", error);
      res.status(500).json({ error: "Failed to fetch vehicle makes", details: error.message });
    }
  });

  // Get models for a specific make
  app.get("/api/vehicles/catalog/models/:make", async (req, res) => {
    try {
      const models = await storage.getVehicleCatalogModels(req.params.make);
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle models" });
    }
  });

  // Get years for a specific make/model
  app.get("/api/vehicles/catalog/years/:make/:model", async (req, res) => {
    try {
      const years = await storage.getVehicleCatalogYears(req.params.make, req.params.model);
      res.json(years);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle years" });
    }
  });

  // Get vehicle specs by make/model/year
  app.get("/api/vehicles/catalog/spec/:make/:model/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) {
        return res.status(400).json({ error: "Invalid year parameter" });
      }
      const vehicle = await storage.getVehicleCatalogBySpec(req.params.make, req.params.model, year);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found in catalog" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle specs" });
    }
  });

  // Search vehicles
  app.get("/api/vehicles/catalog/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }
      const vehicles = await storage.searchVehicleCatalog(query);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to search vehicles" });
    }
  });

  // Get all catalog vehicles
  app.get("/api/vehicles/catalog", async (req, res) => {
    try {
      const vehicles = await storage.getVehicleCatalog();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle catalog" });
    }
  });

  // ============ Fuel Stations API ============
  
  app.get("/api/stations", async (req, res) => {
    try {
      const stations = await storage.getFuelStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stations" });
    }
  });

  app.get("/api/stations/:id", async (req, res) => {
    try {
      const station = await storage.getFuelStation(req.params.id);
      if (!station) {
        return res.status(404).json({ error: "Station not found" });
      }
      res.json(station);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch station" });
    }
  });

  // ============ Fuel Requests API ============
  
  app.get("/api/fuel-requests", async (req, res) => {
    try {
      const requests = await storage.getFuelRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fuel requests" });
    }
  });

  app.post("/api/fuel-requests", async (req, res) => {
    try {
      const validated = insertFuelRequestSchema.parse(req.body);
      const request = await storage.createFuelRequest(validated);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create fuel request" });
    }
  });

  app.get("/api/fuel-requests/qr/:qr", async (req, res) => {
    try {
      const request = await storage.getFuelRequestByQR(req.params.qr);
      if (!request) {
        return res.status(404).json({ error: "Fuel request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fuel request" });
    }
  });

  app.post("/api/fuel-requests/:id/complete", async (req, res) => {
    try {
      const updated = await storage.updateFuelRequest(req.params.id, {
        status: "completed",
        completedAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete fuel request" });
    }
  });

  // ============ Journeys API ============
  
  app.get("/api/journeys", async (req, res) => {
    try {
      const journeys = await storage.getJourneys();
      res.json(journeys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journeys" });
    }
  });

  app.get("/api/journeys/:id", async (req, res) => {
    try {
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Journey not found" });
      }
      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journey" });
    }
  });

  app.post("/api/journeys", async (req, res) => {
    try {
      const validated = insertJourneySchema.parse(req.body);
      const journey = await storage.createJourney(validated);
      res.status(201).json(journey);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create journey" });
    }
  });

  app.delete("/api/journeys/:id", async (req, res) => {
    try {
      await storage.deleteJourney(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete journey" });
    }
  });

  // ============ Tank Measurements API (Snafi) ============
  
  app.get("/api/tank-measurements", async (req, res) => {
    try {
      const measurements = await storage.getTankMeasurements();
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch measurements" });
    }
  });

  app.post("/api/tank-measurements", async (req, res) => {
    try {
      const validated = insertTankMeasurementSchema.parse(req.body);
      const measurement = await storage.createTankMeasurement(validated);

      // Generate AI prediction
      const prediction = await storage.createAiPrediction({
        vehicleId: measurement.vehicleId,
        measurementId: measurement.id,
        predictedConsumption: 8.5,
        remainingRange: (measurement.fuelLevel / 8.5) * 100,
        recommendations: ["تفقد ضغط الإطارات", "قيادة هادئة توفر الوقود"],
      });

      res.status(201).json({ measurement, prediction });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create measurement" });
    }
  });

  // ============ AI Predictions API ============
  
  app.get("/api/predictions", async (req, res) => {
    try {
      const predictions = await storage.getAiPredictions();
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  // ============ Vehicles API ============
  
  app.get("/api/vehicles", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const vehicles = await storage.getVehicles(userId);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validated = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validated);
      res.status(201).json(vehicle);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create vehicle" });
    }
  });

  // ============ Partners API (Business App) ============
  
  app.get("/api/partners", async (req, res) => {
    try {
      const partners = await storage.getPartners();
      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  // ============ Snafi Approvals API ============
  
  app.get("/api/snafi-approvals", async (req, res) => {
    try {
      const approvals = await storage.getSnafiApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  // ============ GitHub API ============
  
  app.get("/api/github/user", async (req, res) => {
    try {
      const user = await getAuthenticatedUser();
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get GitHub user" });
    }
  });
  
  app.get("/api/github/repos", async (req, res) => {
    try {
      const repos = await listRepositories();
      res.json(repos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to list repositories" });
    }
  });
  
  app.post("/api/github/repos", async (req, res) => {
    try {
      const { name, description, isPrivate } = req.body;
      const repo = await createRepository(name, description, isPrivate);
      res.status(201).json(repo);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create repository" });
    }
  });
  
  app.post("/api/github/push", async (req, res) => {
    try {
      const { owner, repo, filePath, message } = req.body;
      
      const localPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(localPath, 'utf-8');
      
      const existingFile = await getFileContent(owner, repo, filePath);
      const sha = existingFile && 'sha' in existingFile ? existingFile.sha : undefined;
      
      const result = await createOrUpdateFile(
        owner,
        repo,
        filePath,
        content,
        message || `Update ${filePath}`,
        sha as string | undefined
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to push file" });
    }
  });
  
  app.post("/api/github/push-all", async (req, res) => {
    try {
      const { owner, repo, files, message } = req.body;
      const results = [];
      
      for (const filePath of files) {
        const localPath = path.join(process.cwd(), filePath);
        if (!fs.existsSync(localPath)) continue;
        
        const content = fs.readFileSync(localPath, 'utf-8');
        const existingFile = await getFileContent(owner, repo, filePath);
        const sha = existingFile && 'sha' in existingFile ? existingFile.sha : undefined;
        
        const result = await createOrUpdateFile(
          owner,
          repo,
          filePath,
          content,
          message || `Update ${filePath}`,
          sha as string | undefined
        );
        results.push({ filePath, success: true });
      }
      
      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to push files" });
    }
  });

  // ============ Verification & KYC API ============
  // ملاحظة: في بيئة الإنتاج، يجب إضافة middleware للمصادقة والتفويض
  // للتأكد من أن المستخدم مسجل دخوله وله صلاحية الوصول للبيانات

  // بدء التحقق من الهوية عبر نفاذ
  app.post("/api/verification/nafath/initiate", async (req, res) => {
    try {
      const validated = nafathInitiateSchema.parse(req.body);
      const result = await nafathService.initiateVerification(validated.userId, validated.nationalId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to initiate verification" });
    }
  });

  // التحقق من حالة نفاذ
  app.get("/api/verification/nafath/status/:requestId", async (req, res) => {
    try {
      const result = await nafathService.checkVerificationStatus(req.params.requestId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to check status" });
    }
  });

  // محاكاة تأكيد نفاذ (للتطوير فقط)
  app.post("/api/verification/nafath/simulate", async (req, res) => {
    try {
      const validated = nafathSimulateSchema.parse(req.body);
      const result = await nafathService.simulateVerification(validated.requestId, validated.approved);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to simulate verification" });
    }
  });

  // التحقق من العمر
  app.get("/api/verification/age/:userId", async (req, res) => {
    try {
      const result = await nafathService.verifyAge(req.params.userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to verify age" });
    }
  });

  // فحص الامتثال الشامل
  app.post("/api/verification/compliance/check", async (req, res) => {
    try {
      const validated = complianceCheckSchema.parse(req.body);
      const result = await complianceService.performFullCheck(validated.userId, validated.nationalId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to perform compliance check" });
    }
  });

  // الحصول على آخر فحص امتثال
  app.get("/api/verification/compliance/:userId", async (req, res) => {
    try {
      const result = await complianceService.getLastCheck(req.params.userId);
      if (!result) {
        return res.status(404).json({ error: "No compliance check found" });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get compliance check" });
    }
  });

  // جلب التقرير الائتماني
  app.post("/api/verification/credit/report", async (req, res) => {
    try {
      const validated = creditReportSchema.parse(req.body);
      const result = await creditService.getCreditReport(validated.userId, validated.nationalId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to get credit report" });
    }
  });

  // تقييم أهلية التمويل
  app.post("/api/verification/credit/evaluate", async (req, res) => {
    try {
      const validated = creditEvaluateSchema.parse(req.body);
      const result = await creditService.evaluateCreditEligibility(validated.userId, validated.requestedAmount);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to evaluate credit" });
    }
  });

  // التحقق من المتعثرات
  app.get("/api/verification/credit/defaults/:userId", async (req, res) => {
    try {
      const result = await creditService.hasDefaultedLoans(req.params.userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to check defaults" });
    }
  });

  // التحقق من التوظيف
  app.post("/api/verification/employment/verify", async (req, res) => {
    try {
      const validated = employmentVerifySchema.parse(req.body);
      const result = await employmentService.verifyEmployment(validated.userId, validated.nationalId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to verify employment" });
    }
  });

  // حساب أولوية العميل
  app.get("/api/verification/employment/priority/:userId", async (req, res) => {
    try {
      const result = await employmentService.calculatePriority(req.params.userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to calculate priority" });
    }
  });

  // التقييم الشامل للعميل
  app.post("/api/verification/customer/evaluate", async (req, res) => {
    try {
      const validated = customerEvaluateSchema.parse(req.body);
      const result = await customerRatingService.performFullEvaluation(validated.userId, validated.nationalId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to evaluate customer" });
    }
  });

  // الحصول على تقييم العميل
  app.get("/api/verification/customer/rating/:userId", async (req, res) => {
    try {
      const result = await customerRatingService.getRating(req.params.userId);
      if (!result) {
        return res.status(404).json({ error: "No rating found" });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get rating" });
    }
  });

  // فحص سريع للأهلية
  app.get("/api/verification/customer/eligibility/:userId", async (req, res) => {
    try {
      const result = await customerRatingService.quickEligibilityCheck(req.params.userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to check eligibility" });
    }
  });

  // ============ Snafi Decision Support API ============
  // محرك سنافي لدعم قرار الشراء الذكي

  // تهيئة أسعار الوقود الافتراضية
  snafiDecisionService.initializeDefaultPrices().catch(console.error);

  // إنشاء جلسة دعم قرار جديدة
  app.post("/api/snafi/decision", async (req, res) => {
    try {
      const validated = decisionSupportRequestSchema.parse(req.body);
      const result = await snafiDecisionService.createDecisionSession(validated);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "فشل في إنشاء جلسة دعم القرار" });
    }
  });

  // قبول التوصية وربطها بالفاتورة
  app.post("/api/snafi/decision/accept", async (req, res) => {
    try {
      const validated = acceptRecommendationSchema.parse(req.body);
      const result = await snafiDecisionService.acceptRecommendation(
        validated.decisionSupportId, 
        validated.invoiceId
      );
      res.json({ success: result, message: "تم قبول التوصية وربطها بالفاتورة" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "فشل في قبول التوصية" });
    }
  });

  // تسجيل التعبئة الفعلية وحساب دقة التنبؤ
  app.post("/api/snafi/decision/complete", async (req, res) => {
    try {
      const validated = recordActualRefuelingSchema.parse(req.body);
      const result = await snafiDecisionService.recordActualRefueling(
        validated.decisionSupportId,
        validated.actualLiters,
        validated.actualCost,
        validated.userFeedback
      );
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "فشل في تسجيل التعبئة" });
    }
  });

  // الحصول على جلسة دعم قرار محددة
  app.get("/api/snafi/decision/:decisionSupportId", async (req, res) => {
    try {
      const session = await snafiDecisionService.getSession(req.params.decisionSupportId);
      if (!session) {
        return res.status(404).json({ error: "جلسة دعم القرار غير موجودة" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "فشل في جلب الجلسة" });
    }
  });

  // الحصول على جلسات المستخدم
  app.get("/api/snafi/sessions/:userId", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const sessions = await snafiDecisionService.getUserSessions(req.params.userId, limit);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "فشل في جلب الجلسات" });
    }
  });

  // الحصول على إحصائيات دقة النظام للمستخدم
  app.get("/api/snafi/accuracy/:userId", async (req, res) => {
    try {
      const stats = await snafiDecisionService.getAccuracyStats(req.params.userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "فشل في جلب الإحصائيات" });
    }
  });

  // الحصول على سعر الوقود الحالي
  app.get("/api/snafi/fuel-price/:fuelType", async (req, res) => {
    try {
      const price = await snafiDecisionService.getCurrentFuelPrice(req.params.fuelType);
      res.json({ fuelType: req.params.fuelType, pricePerLiter: price });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "فشل في جلب السعر" });
    }
  });

  // تحديث سعر الوقود (للإدارة)
  app.post("/api/snafi/fuel-price", async (req, res) => {
    try {
      const validated = updateFuelPriceSchema.parse(req.body);
      await snafiDecisionService.updateFuelPrice(
        validated.fuelType,
        validated.pricePerLiter,
        validated.source
      );
      res.json({ success: true, message: "تم تحديث سعر الوقود" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "بيانات غير صحيحة", details: error.errors });
      }
      res.status(500).json({ error: error.message || "فشل في تحديث السعر" });
    }
  });

  // ============ Merchant API (BNPL Integration - مثل تمارا/تابي) ============
  // هذا القسم يجعل النظام مطابقاً لأنظمة BNPL مثل تمارا وتابي
  
  const { merchantService } = await import("./services");

  // Middleware للتحقق من API Key
  const authenticateMerchant = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Missing or invalid Authorization header. Use: Bearer sk_xxx" 
      });
    }

    const secretKey = authHeader.substring(7);
    const validation = await merchantService.validateApiKey(secretKey);
    
    if (!validation.valid) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Invalid API key" 
      });
    }

    (req as any).merchant = validation.merchant;
    (req as any).keyType = validation.keyType;
    next();
  };

  // ---- Merchant Registration ----
  
  // تسجيل تاجر جديد
  app.post("/api/merchant/register", async (req, res) => {
    try {
      const { companyName, companyNameAr, commercialReg, taxNumber, website, callbackUrl, contactEmail, contactPhone, category } = req.body;
      
      if (!companyName || !contactEmail) {
        return res.status(400).json({ error: "companyName and contactEmail are required" });
      }

      const result = await merchantService.registerMerchant({
        companyName,
        companyNameAr,
        commercialReg,
        taxNumber,
        website,
        callbackUrl,
        contactEmail,
        contactPhone,
        category,
      });

      res.status(201).json({
        success: true,
        message: "تم تسجيل التاجر بنجاح. سيتم مراجعة الطلب وتفعيل الحساب.",
        data: {
          merchantCode: result.merchant.merchantCode,
          status: result.merchant.status,
          sandboxKeys: result.apiKeys.sandbox,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to register merchant" });
    }
  });

  // تفعيل التاجر (للإدارة)
  app.post("/api/merchant/:merchantId/activate", async (req, res) => {
    try {
      const result = await merchantService.activateMerchant(req.params.merchantId);
      res.json({
        success: true,
        message: "تم تفعيل التاجر",
        data: {
          merchantCode: result.merchant.merchantCode,
          productionKeys: {
            publicKey: result.productionKeys.publicKey,
            secretKey: result.productionKeys.secretKey,
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to activate merchant" });
    }
  });

  // ---- Checkout API (Main BNPL Flow) ----
  
  // إنشاء جلسة دفع جديدة (مثل تمارا/تابي)
  app.post("/api/merchant/checkout", authenticateMerchant, async (req: Request, res: Response) => {
    try {
      const merchant = (req as any).merchant;
      const {
        merchantReference,
        consumer,
        amount,
        items,
        paymentType,
        installmentCount,
        urls
      } = req.body;

      // التحقق من البيانات المطلوبة
      if (!merchantReference || !consumer?.phone || !amount?.total || !urls?.success || !urls?.failure) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["merchantReference", "consumer.phone", "amount.total", "urls.success", "urls.failure"]
        });
      }

      // التحقق من حدود التاجر
      if (amount.total > merchant.maxTransactionLimit) {
        return res.status(400).json({
          error: "Transaction exceeds limit",
          maxAllowed: merchant.maxTransactionLimit
        });
      }

      const session = await merchantService.createCheckoutSession({
        merchantId: merchant.id,
        merchantReference,
        consumerPhone: consumer.phone,
        consumerEmail: consumer.email,
        consumerName: consumer.name,
        consumerNationalId: consumer.nationalId,
        totalAmount: amount.total,
        taxAmount: amount.tax,
        shippingAmount: amount.shipping,
        discountAmount: amount.discount,
        items,
        paymentType: paymentType || "pay_in_installments",
        installmentCount: installmentCount || 4,
        successUrl: urls.success,
        failureUrl: urls.failure,
        cancelUrl: urls.cancel,
        notificationUrl: urls.notification || merchant.callbackUrl,
      });

      res.status(201).json({
        success: true,
        data: {
          sessionToken: session.sessionToken,
          checkoutUrl: session.checkoutUrl,
          expiresAt: session.expiresAt,
          status: session.status,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // الحصول على حالة جلسة الدفع
  app.get("/api/merchant/checkout/:sessionToken", authenticateMerchant, async (req: Request, res: Response) => {
    try {
      const sessionToken = req.params.sessionToken as string;
      const session = await merchantService.getCheckoutSession(sessionToken);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const merchant = (req as any).merchant;
      if (session.merchantId !== merchant.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({
        success: true,
        data: {
          sessionToken: session.sessionToken,
          merchantReference: session.merchantReference,
          status: session.status,
          totalAmount: session.totalAmount,
          paymentType: session.paymentType,
          installmentCount: session.installmentCount,
          consumer: {
            phone: session.consumerPhone,
            email: session.consumerEmail,
            name: session.consumerName,
          },
          invoiceId: session.invoiceId,
          approvedAt: session.approvedAt,
          capturedAt: session.capturedAt,
          createdAt: session.createdAt,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get session" });
    }
  });

  // إلغاء جلسة الدفع
  app.post("/api/merchant/checkout/:sessionToken/cancel", authenticateMerchant, async (req: Request, res: Response) => {
    try {
      const sessionToken = req.params.sessionToken as string;
      const session = await merchantService.getCheckoutSession(sessionToken);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const merchant = (req as any).merchant;
      if (session.merchantId !== merchant.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (session.status !== "pending" && session.status !== "approved") {
        return res.status(400).json({ error: "Cannot cancel session in current status" });
      }

      const updated = await merchantService.declineCheckout(sessionToken, "Cancelled by merchant");
      
      res.json({
        success: true,
        message: "Session cancelled",
        data: { status: updated?.status }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to cancel session" });
    }
  });

  // ---- Merchant Dashboard API ----
  
  // إحصائيات التاجر
  app.get("/api/merchant/stats", authenticateMerchant, async (req: Request, res: Response) => {
    try {
      const merchant = (req as any).merchant;
      const stats = await merchantService.getMerchantStats(merchant.id);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get stats" });
    }
  });

  // ---- Consumer Checkout Flow (للعميل النهائي) ----
  
  // صفحة الدفع للعميل
  app.get("/api/checkout/:sessionToken", async (req, res) => {
    try {
      const session = await merchantService.getCheckoutSession(req.params.sessionToken);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.status === "expired" || (session.expiresAt && new Date(session.expiresAt) < new Date())) {
        return res.status(400).json({ error: "Session expired" });
      }

      res.json({
        sessionToken: session.sessionToken,
        totalAmount: session.totalAmount,
        installmentCount: session.installmentCount,
        monthlyAmount: Math.round((session.totalAmount / (session.installmentCount || 4)) * 100) / 100,
        items: session.items,
        status: session.status,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get checkout" });
    }
  });

  // موافقة العميل على الدفع
  app.post("/api/checkout/:sessionToken/approve", async (req, res) => {
    try {
      const session = await merchantService.getCheckoutSession(req.params.sessionToken);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.status !== "pending") {
        return res.status(400).json({ error: "Session already processed" });
      }

      const { consumerId, creditLimit, riskScore } = req.body;
      
      // الموافقة على الجلسة
      const approved = await merchantService.approveCheckout(
        req.params.sessionToken,
        consumerId || session.consumerPhone,
        creditLimit || session.totalAmount,
        riskScore || 50
      );

      // إنشاء فاتورة داخلية
      const invoice = await storage.createInvoice({
        userId: consumerId || session.consumerPhone,
        totalAmount: session.totalAmount,
        installmentMonths: session.installmentCount || 4,
        monthlyAmount: Math.round((session.totalAmount / (session.installmentCount || 4)) * 100) / 100,
        status: "active",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // التقاط الدفع وربطه بالفاتورة
      await merchantService.capturePayment(req.params.sessionToken, invoice.id);

      res.json({
        success: true,
        message: "Payment approved",
        redirectUrl: session.successUrl,
        invoiceId: invoice.id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to approve checkout" });
    }
  });

  // رفض الدفع
  app.post("/api/checkout/:sessionToken/decline", async (req, res) => {
    try {
      const { reason } = req.body;
      const session = await merchantService.declineCheckout(req.params.sessionToken, reason || "Declined by consumer");

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({
        success: true,
        message: "Payment declined",
        redirectUrl: session.failureUrl,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to decline checkout" });
    }
  });

  // ============ Admin Management System API ============
  
  // Dashboard Stats
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Users Management
  app.get("/api/admin/users", async (req, res) => {
    try {
      const admins = await adminService.getAdminUsers();
      res.json({ success: true, data: admins });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      const admin = await adminService.createAdminUser(req.body);
      res.json({ success: true, data: admin });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    try {
      const updated = await adminService.updateAdminUser(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await adminService.authenticateAdmin(
        email, 
        password,
        req.ip,
        req.headers["user-agent"]
      );

      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ success: true, data: admin });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Merchants Management
  app.get("/api/admin/merchants", async (req, res) => {
    try {
      const merchants = await adminService.getAllMerchants();
      res.json({ success: true, data: merchants });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/merchants/:id/status", async (req, res) => {
    try {
      const { status, adminId } = req.body;
      const updated = await adminService.updateMerchantStatus(req.params.id, status, adminId || "system");
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customers Management
  app.get("/api/admin/customers", async (req, res) => {
    try {
      const customers = await adminService.getAllUsers();
      res.json({ success: true, data: customers });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/customers/:id/status", async (req, res) => {
    try {
      const { status, adminId } = req.body;
      const updated = await adminService.updateUserStatus(req.params.id, status, adminId || "system");
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/customers/:id/credit-limit", async (req, res) => {
    try {
      const { creditLimit, adminId } = req.body;
      const updated = await adminService.updateUserCreditLimit(req.params.id, creditLimit, adminId || "system");
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Invoices Management
  app.get("/api/admin/invoices", async (req, res) => {
    try {
      const invoices = await adminService.getAllInvoices();
      res.json({ success: true, data: invoices });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workflow Requests
  app.get("/api/admin/workflows", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const workflows = await adminService.getWorkflowRequests(status);
      res.json({ success: true, data: workflows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/workflows", async (req, res) => {
    try {
      const workflow = await adminService.createWorkflowRequest(req.body);
      res.json({ success: true, data: workflow });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/workflows/:id/review", async (req, res) => {
    try {
      const { reviewerId, status, reviewNote } = req.body;
      const updated = await adminService.reviewWorkflowRequest(
        req.params.id,
        reviewerId || "system",
        status,
        reviewNote
      );
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Audit Logs
  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      const logs = await adminService.getAuditLogs({ limit: 100 });
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // System Settings
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await adminService.getSystemSettings();
      res.json({ success: true, data: settings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/settings/:key", async (req, res) => {
    try {
      const { value, adminId } = req.body;
      const updated = await adminService.updateSystemSetting(req.params.key, value, adminId || "system");
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Branches
  app.get("/api/admin/branches", async (req, res) => {
    try {
      const branches = await adminService.getBranches();
      res.json({ success: true, data: branches });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/branches", async (req, res) => {
    try {
      const branch = await adminService.createBranch(req.body);
      res.json({ success: true, data: branch });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ SAMA SANDBOX & MONITORING API ============

  // Sandbox Config
  app.get("/api/sandbox/config", async (req, res) => {
    try {
      let config = await storage.getSandboxConfig();
      if (!config) {
        config = await storage.createSandboxConfig({
          environment: "sandbox",
          maxUsers: 500,
          maxMerchants: 20,
          maxTransactionAmount: 500,
          dailyTransactionLimit: 1000,
          monthlyTransactionLimit: 5000,
          isActive: true,
        });
      }
      res.json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const sandboxConfigUpdateSchema = z.object({
    maxUsers: z.number().min(1).max(10000).optional(),
    maxMerchants: z.number().min(1).max(1000).optional(),
    maxTransactionAmount: z.number().min(1).max(10000).optional(),
    dailyTransactionLimit: z.number().min(1).max(100000).optional(),
    monthlyTransactionLimit: z.number().min(1).max(1000000).optional(),
    isActive: z.boolean().optional(),
  });

  app.put("/api/sandbox/config", async (req, res) => {
    try {
      const validation = sandboxConfigUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid config data", details: validation.error.errors });
      }
      const config = await storage.getSandboxConfig();
      if (!config) {
        return res.status(404).json({ error: "Sandbox config not found" });
      }
      const updated = await storage.updateSandboxConfig(config.id, validation.data);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction Limits
  app.get("/api/sandbox/limits/:userId", async (req, res) => {
    try {
      let limit = await storage.getTransactionLimit(req.params.userId);
      if (!limit) {
        limit = await storage.createTransactionLimit({
          userId: req.params.userId,
          environment: "sandbox",
          dailyUsed: 0,
          weeklyUsed: 0,
          monthlyUsed: 0,
          dailyLimit: 1000,
          weeklyLimit: 3000,
          monthlyLimit: 5000,
          maxSingleTransaction: 500,
          totalTransactions: 0,
        });
      }
      res.json({ success: true, data: limit });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sandbox/limits/check", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      if (!userId || !amount) {
        return res.status(400).json({ error: "userId and amount are required" });
      }

      let limit = await storage.getTransactionLimit(userId);
      if (!limit) {
        limit = await storage.createTransactionLimit({
          userId,
          environment: "sandbox",
          dailyUsed: 0,
          weeklyUsed: 0,
          monthlyUsed: 0,
          dailyLimit: 1000,
          weeklyLimit: 3000,
          monthlyLimit: 5000,
          maxSingleTransaction: 500,
          totalTransactions: 0,
        });
      }

      const breaches: string[] = [];
      if (amount > (limit.maxSingleTransaction || 500)) {
        breaches.push("max_single_transaction");
      }
      if ((limit.dailyUsed || 0) + amount > (limit.dailyLimit || 1000)) {
        breaches.push("daily_limit");
      }
      if ((limit.weeklyUsed || 0) + amount > (limit.weeklyLimit || 3000)) {
        breaches.push("weekly_limit");
      }
      if ((limit.monthlyUsed || 0) + amount > (limit.monthlyLimit || 5000)) {
        breaches.push("monthly_limit");
      }

      if (breaches.length > 0) {
        for (const breachType of breaches) {
          await storage.createLimitBreach({
            userId,
            breachType,
            attemptedAmount: amount,
            currentUsage: breachType === "daily_limit" ? (limit.dailyUsed || 0) :
                          breachType === "weekly_limit" ? (limit.weeklyUsed || 0) :
                          breachType === "monthly_limit" ? (limit.monthlyUsed || 0) : 0,
            limitAmount: breachType === "daily_limit" ? (limit.dailyLimit || 1000) :
                         breachType === "weekly_limit" ? (limit.weeklyLimit || 3000) :
                         breachType === "monthly_limit" ? (limit.monthlyLimit || 5000) :
                         (limit.maxSingleTransaction || 500),
            environment: "sandbox",
          });
        }

        await storage.createMoneyFlowLog({
          environment: "sandbox",
          eventType: "limit_breach",
          eventCategory: "risk",
          entityType: "transaction_limit",
          userId,
          amount,
          status: "blocked",
          description: `Transaction blocked: ${breaches.join(", ")}`,
          descriptionAr: `تم حظر العملية: تجاوز ${breaches.length} حد(ود)`,
          flagged: true,
          riskScore: breaches.length * 25,
        });

        return res.json({
          success: false,
          allowed: false,
          breaches,
          message: "تجاوز حدود العمليات المسموحة",
          limits: limit,
        });
      }

      res.json({
        success: true,
        allowed: true,
        remainingDaily: (limit.dailyLimit || 1000) - (limit.dailyUsed || 0) - amount,
        remainingMonthly: (limit.monthlyLimit || 5000) - (limit.monthlyUsed || 0) - amount,
        limits: limit,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Money Flow Logs
  app.get("/api/sandbox/money-flow", async (req, res) => {
    try {
      const { environment, userId, startDate, endDate } = req.query;
      const filters: any = {};
      if (environment) filters.environment = environment as string;
      if (userId) filters.userId = userId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const logs = await storage.getMoneyFlowLogs(filters);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sandbox/money-flow", async (req, res) => {
    try {
      const validation = insertMoneyFlowLogSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid money flow data", details: validation.error.errors });
      }
      const log = await storage.createMoneyFlowLog(validation.data);
      res.json({ success: true, data: log });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Limit Breaches
  app.get("/api/sandbox/breaches", async (req, res) => {
    try {
      const { userId, environment } = req.query;
      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (environment) filters.environment = environment as string;

      const breaches = await storage.getLimitBreaches(filters);
      res.json({ success: true, data: breaches });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Monitoring Dashboard Stats
  app.get("/api/sandbox/monitoring", async (req, res) => {
    try {
      const environment = (req.query.environment as string) || "sandbox";
      const stats = await storage.getMonitoringStats(environment);
      const config = await storage.getSandboxConfig();
      const recentLogs = await storage.getMoneyFlowLogs({ environment });
      const recentBreaches = await storage.getLimitBreaches({ environment });

      res.json({
        success: true,
        data: {
          stats,
          config,
          recentTransactions: recentLogs.slice(0, 50),
          recentBreaches: recentBreaches.slice(0, 20),
          environment,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const simulateTransactionSchema = z.object({
    userId: z.string().min(1, "userId is required"),
    merchantId: z.string().optional(),
    stationId: z.string().optional(),
    amount: z.number().min(1, "Amount must be at least 1").max(10000, "Amount exceeds maximum"),
    fuelType: z.string().optional(),
    liters: z.number().optional(),
  });

  app.post("/api/sandbox/simulate-transaction", async (req, res) => {
    try {
      const validation = simulateTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid transaction data", details: validation.error.errors });
      }
      const { userId, merchantId, stationId, amount, fuelType, liters } = validation.data;

      // Check limits first
      let limit = await storage.getTransactionLimit(userId);
      if (!limit) {
        limit = await storage.createTransactionLimit({
          userId,
          environment: "sandbox",
          dailyUsed: 0,
          weeklyUsed: 0,
          monthlyUsed: 0,
          dailyLimit: 1000,
          weeklyLimit: 3000,
          monthlyLimit: 5000,
          maxSingleTransaction: 500,
          totalTransactions: 0,
        });
      }

      const breaches: string[] = [];
      if (amount > (limit.maxSingleTransaction || 500)) breaches.push("max_single_transaction");
      if ((limit.dailyUsed || 0) + amount > (limit.dailyLimit || 1000)) breaches.push("daily_limit");
      if ((limit.monthlyUsed || 0) + amount > (limit.monthlyLimit || 5000)) breaches.push("monthly_limit");

      if (breaches.length > 0) {
        for (const bt of breaches) {
          await storage.createLimitBreach({
            userId,
            breachType: bt,
            attemptedAmount: amount,
            currentUsage: bt === "daily_limit" ? (limit.dailyUsed || 0) : (limit.monthlyUsed || 0),
            limitAmount: bt === "daily_limit" ? (limit.dailyLimit || 1000) : bt === "monthly_limit" ? (limit.monthlyLimit || 5000) : (limit.maxSingleTransaction || 500),
            environment: "sandbox",
          });
        }
        await storage.createMoneyFlowLog({
          environment: "sandbox",
          eventType: "transaction_blocked",
          eventCategory: "risk",
          entityType: "fuel_purchase",
          userId,
          merchantId,
          stationId,
          amount,
          status: "blocked",
          description: `Sandbox transaction blocked: ${breaches.join(", ")}`,
          descriptionAr: `عملية تجريبية محظورة: تجاوز الحدود`,
          flagged: true,
          riskScore: 75,
        });
        return res.json({ success: false, blocked: true, breaches, message: "تم حظر العملية بسبب تجاوز الحدود" });
      }

      // Step 1: Customer debit
      const debitLog = await storage.createMoneyFlowLog({
        environment: "sandbox",
        eventType: "customer_debit",
        eventCategory: "payment",
        entityType: "fuel_purchase",
        userId,
        merchantId,
        stationId,
        amount,
        currency: "SAR",
        fromAccount: `customer_${userId}`,
        toAccount: "darby_escrow",
        status: "completed",
        description: `Customer debited ${amount} SAR for fuel purchase`,
        descriptionAr: `تم خصم ${amount} ريال من حساب العميل لشراء الوقود`,
        riskScore: 10,
        flagged: false,
      });

      // Step 2: Darby escrow receipt
      await storage.createMoneyFlowLog({
        environment: "sandbox",
        eventType: "escrow_receipt",
        eventCategory: "settlement",
        entityType: "fuel_purchase",
        entityId: debitLog.id,
        userId,
        merchantId,
        stationId,
        amount,
        currency: "SAR",
        fromAccount: `customer_${userId}`,
        toAccount: "darby_escrow",
        status: "completed",
        description: `Darby escrow received ${amount} SAR`,
        descriptionAr: `استلام ${amount} ريال في حساب دربي الوسيط`,
        riskScore: 5,
        flagged: false,
      });

      // Step 3: Station settlement
      const commissionRate = 0.03;
      const commission = amount * commissionRate;
      const stationAmount = amount - commission;

      await storage.createMoneyFlowLog({
        environment: "sandbox",
        eventType: "station_settlement",
        eventCategory: "settlement",
        entityType: "fuel_purchase",
        entityId: debitLog.id,
        userId,
        merchantId,
        stationId,
        amount: stationAmount,
        currency: "SAR",
        fromAccount: "darby_escrow",
        toAccount: `station_${stationId || "default"}`,
        status: "completed",
        description: `Station settled ${stationAmount} SAR (commission: ${commission} SAR)`,
        descriptionAr: `تسوية ${stationAmount} ريال للمحطة (عمولة: ${commission} ريال)`,
        riskScore: 5,
        flagged: false,
        metadata: { commission, commissionRate, fuelType, liters },
      });

      // Step 4: Commission record
      await storage.createMoneyFlowLog({
        environment: "sandbox",
        eventType: "commission_earned",
        eventCategory: "revenue",
        entityType: "fuel_purchase",
        entityId: debitLog.id,
        merchantId,
        amount: commission,
        currency: "SAR",
        fromAccount: "darby_escrow",
        toAccount: "darby_revenue",
        status: "completed",
        description: `Darby commission ${commission} SAR (${commissionRate * 100}%)`,
        descriptionAr: `عمولة دربي ${commission} ريال (${commissionRate * 100}%)`,
        riskScore: 0,
        flagged: false,
      });

      // Update user limits
      await storage.updateTransactionLimit(userId, {
        dailyUsed: (limit.dailyUsed || 0) + amount,
        weeklyUsed: (limit.weeklyUsed || 0) + amount,
        monthlyUsed: (limit.monthlyUsed || 0) + amount,
        totalTransactions: (limit.totalTransactions || 0) + 1,
      });

      res.json({
        success: true,
        transaction: {
          id: debitLog.id,
          amount,
          commission,
          stationAmount,
          status: "completed",
          steps: [
            { step: 1, type: "customer_debit", amount, descriptionAr: "خصم من حساب العميل" },
            { step: 2, type: "escrow_receipt", amount, descriptionAr: "استلام في حساب دربي الوسيط" },
            { step: 3, type: "station_settlement", amount: stationAmount, descriptionAr: "تسوية للمحطة" },
            { step: 4, type: "commission", amount: commission, descriptionAr: "عمولة دربي" },
          ]
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/generate-pdf", async (_req, res) => {
    try {
      const { generateDarbyPDF } = await import("./services/pdf-generator");
      const pdfBuffer = await generateDarbyPDF();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="Darby_SAMA_Application.pdf"');
      res.setHeader("Content-Length", pdfBuffer.length.toString());
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF", details: error.message });
    }
  });

  return httpServer;
}
