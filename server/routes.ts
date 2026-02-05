import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertInvoiceSchema, insertJourneySchema, 
  insertTankMeasurementSchema, insertAiPredictionSchema,
  insertFuelRequestSchema, insertVehicleSchema
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

  return httpServer;
}
