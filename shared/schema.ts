import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// 1. المستخدمون والحسابات
// ==========================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  nationalId: text("national_id").unique(),
  userType: text("user_type").notNull().default("individual"),
  status: text("status").notNull().default("pending"),
  creditLimit: real("credit_limit").default(0),
  creditScore: integer("credit_score").default(500),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// المحافظ الإلكترونية
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  balance: real("balance").default(0),
  pendingAmount: real("pending_amount").default(0),
  currency: text("currency").default("SAR"),
  lastTransaction: timestamp("last_transaction"),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true });
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

// جلسات المستخدمين
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  deviceId: text("device_id"),
  deviceType: text("device_type"),
  ipAddress: text("ip_address"),
  lastActive: timestamp("last_active").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertSessionSchema = createInsertSchema(userSessions).omit({ id: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

// مستندات التحقق من الهوية
export const kycDocuments = pgTable("kyc_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  docType: text("doc_type").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").default("pending"),
  rejectionReason: text("rejection_reason"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const insertKycDocSchema = createInsertSchema(kycDocuments).omit({ id: true, uploadedAt: true });
export type InsertKycDoc = z.infer<typeof insertKycDocSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;

// ==========================================
// 2. كتالوج السيارات (Vehicle Catalog)
// ==========================================

// قاعدة بيانات السيارات المتاحة في السوق السعودي
export const vehicleCatalog = pgTable("vehicle_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  make: text("make").notNull(), // الشركة المصنعة
  makeAr: text("make_ar").notNull(), // اسم الشركة بالعربية
  model: text("model").notNull(), // الموديل
  modelAr: text("model_ar").notNull(), // اسم الموديل بالعربية
  yearFrom: integer("year_from").notNull(), // سنة البداية
  yearTo: integer("year_to").notNull(), // سنة النهاية
  tankCapacity: real("tank_capacity").notNull(), // سعة الخزان باللتر
  fuelType: text("fuel_type").notNull().default("91"), // نوع الوقود الافتراضي
  avgConsumption: real("avg_consumption"), // متوسط الاستهلاك km/l
  popularity: integer("popularity").default(1), // ترتيب الشعبية (1 = الأكثر)
  category: text("category"), // sedan, suv, pickup, hatchback
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleCatalogSchema = createInsertSchema(vehicleCatalog).omit({ id: true, createdAt: true });
export type InsertVehicleCatalog = z.infer<typeof insertVehicleCatalogSchema>;
export type VehicleCatalog = typeof vehicleCatalog.$inferSelect;

// ==========================================
// 3. مركبات المستخدمين
// ==========================================

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  plateNumber: text("plate_number").notNull().unique(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  tankCapacity: real("tank_capacity"),
  avgConsumption: real("avg_consumption"),
  odometerReading: integer("odometer_reading"),
  lastMaintenance: timestamp("last_maintenance"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// ==========================================
// 3. الشركاء والمحطات
// ==========================================

export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  commercialReg: text("commercial_reg").unique(),
  taxNumber: text("tax_number").unique(),
  partnerType: text("partner_type").notNull().default("station_owner"),
  commissionRate: real("commission_rate").default(0),
  status: text("status").default("pending"),
  contractStart: timestamp("contract_start"),
  contractEnd: timestamp("contract_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true, createdAt: true });
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

export const fuelStations = pgTable("fuel_stations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id"),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  city: text("city"),
  region: text("region"),
  isActive: boolean("is_active").default(true),
  operatingHours: jsonb("operating_hours"),
  fuelTypes: text("fuel_types").array().notNull(),
  pricePerLiter: real("price_per_liter"),
  rating: real("rating").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFuelStationSchema = createInsertSchema(fuelStations).omit({ id: true, createdAt: true });
export type InsertFuelStation = z.infer<typeof insertFuelStationSchema>;
export type FuelStation = typeof fuelStations.$inferSelect;

// موظفو المحطات
export const stationEmployees = pgTable("station_employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stationId: varchar("station_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("attendant"),
  hiredAt: timestamp("hired_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertStationEmployeeSchema = createInsertSchema(stationEmployees).omit({ id: true, hiredAt: true });
export type InsertStationEmployee = z.infer<typeof insertStationEmployeeSchema>;
export type StationEmployee = typeof stationEmployees.$inferSelect;

// مخزون الوقود
export const fuelInventory = pgTable("fuel_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stationId: varchar("station_id").notNull(),
  fuelType: text("fuel_type").notNull(),
  currentStock: real("current_stock").default(0),
  pricePerLiter: real("price_per_liter").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertFuelInventorySchema = createInsertSchema(fuelInventory).omit({ id: true, lastUpdated: true });
export type InsertFuelInventory = z.infer<typeof insertFuelInventorySchema>;
export type FuelInventory = typeof fuelInventory.$inferSelect;

// ==========================================
// 4. طلبات الوقود
// ==========================================

export const fuelRequests = pgTable("fuel_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  vehicleId: varchar("vehicle_id"),
  stationId: varchar("station_id").notNull(),
  amountLiters: real("amount_liters").notNull(),
  totalPrice: real("total_price").notNull(),
  fuelType: text("fuel_type").notNull(),
  qrCode: text("qr_code").unique(),
  status: text("status").default("pending"),
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFuelRequestSchema = createInsertSchema(fuelRequests).omit({ id: true, createdAt: true, qrCode: true });
export type InsertFuelRequest = z.infer<typeof insertFuelRequestSchema>;
export type FuelRequest = typeof fuelRequests.$inferSelect;

// ==========================================
// 5. الفواتير والمدفوعات
// ==========================================

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fuelRequestId: varchar("fuel_request_id"),
  stationId: varchar("station_id"),
  decisionSupportId: varchar("decision_support_id"),
  fuelType: text("fuel_type"),
  liters: real("liters"),
  invoiceNumber: text("invoice_number").unique(),
  totalAmount: real("total_amount").notNull(),
  paidAmount: real("paid_amount").default(0),
  installmentMonths: integer("installment_months").notNull(),
  monthlyAmount: real("monthly_amount").notNull(),
  status: text("status").default("active"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, invoiceNumber: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// بنود الفاتورة
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

// المدفوعات
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  walletId: varchar("wallet_id"),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  transactionRef: text("transaction_ref").unique(),
  status: text("status").default("pending"),
  paidAt: timestamp("paid_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, paidAt: true, transactionRef: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// ==========================================
// 6. الرحلات
// ==========================================

export const journeys = pgTable("journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title"),
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location").notNull(),
  totalDistance: real("total_distance"),
  estimatedFuel: real("estimated_fuel"),
  estimatedCost: real("estimated_cost"),
  plannedDate: timestamp("planned_date"),
  status: text("status").default("planned"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJourneySchema = createInsertSchema(journeys).omit({ id: true, createdAt: true });
export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Journey = typeof journeys.$inferSelect;

// محطات التوقف في الرحلة
export const journeyStops = pgTable("journey_stops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journeyId: varchar("journey_id").notNull(),
  stationId: varchar("station_id").notNull(),
  stopOrder: integer("stop_order").notNull(),
  distanceFromStart: real("distance_from_start"),
  isFuelStop: boolean("is_fuel_stop").default(true),
  estimatedArrival: timestamp("estimated_arrival"),
});

export const insertJourneyStopSchema = createInsertSchema(journeyStops).omit({ id: true });
export type InsertJourneyStop = z.infer<typeof insertJourneyStopSchema>;
export type JourneyStop = typeof journeyStops.$inferSelect;

// ==========================================
// 7. قياسات الخزان وسنافي AI
// ==========================================

export const tankMeasurements = pgTable("tank_measurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull(),
  fuelLevel: real("fuel_level").notNull(),
  odometer: integer("odometer"),
  imageUrl: text("image_url"),
  aiConfidence: real("ai_confidence"),
  measuredAt: timestamp("measured_at").defaultNow(),
});

export const insertTankMeasurementSchema = createInsertSchema(tankMeasurements).omit({ id: true, measuredAt: true });
export type InsertTankMeasurement = z.infer<typeof insertTankMeasurementSchema>;
export type TankMeasurement = typeof tankMeasurements.$inferSelect;

// تنبؤات الذكاء الاصطناعي
export const aiPredictions = pgTable("ai_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  measurementId: varchar("measurement_id"),
  vehicleId: varchar("vehicle_id").notNull(),
  predictedConsumption: real("predicted_consumption"),
  remainingRange: real("remaining_range"),
  nextRefuelDate: timestamp("next_refuel_date"),
  recommendations: jsonb("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiPredictionSchema = createInsertSchema(aiPredictions).omit({ id: true, createdAt: true });
export type InsertAiPrediction = z.infer<typeof insertAiPredictionSchema>;
export type AiPrediction = typeof aiPredictions.$inferSelect;

// موافقات سنافي
export const snafiApprovals = pgTable("snafi_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fuelRequestId: varchar("fuel_request_id"),
  riskScore: integer("risk_score"),
  approvedAmount: real("approved_amount"),
  aiReasoning: text("ai_reasoning"),
  decision: text("decision").default("pending"),
  decidedAt: timestamp("decided_at").defaultNow(),
});

export const insertSnafiApprovalSchema = createInsertSchema(snafiApprovals).omit({ id: true, decidedAt: true });
export type InsertSnafiApproval = z.infer<typeof insertSnafiApprovalSchema>;
export type SnafiApproval = typeof snafiApprovals.$inferSelect;

// ==========================================
// 8. الإشعارات
// ==========================================

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  notificationType: text("notification_type").notNull(),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, sentAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ==========================================
// 9. التحقق والامتثال (KYC/AML)
// ==========================================

// التحقق من الهوية عبر نفاذ
export const nafathVerifications = pgTable("nafath_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  nationalId: text("national_id").notNull(),
  requestId: text("request_id").unique(),
  randomNumber: text("random_number"),
  status: text("status").default("pending"),
  verifiedName: text("verified_name"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  idExpiryDate: timestamp("id_expiry_date"),
  errorMessage: text("error_message"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNafathVerificationSchema = createInsertSchema(nafathVerifications).omit({ id: true, createdAt: true });
export type InsertNafathVerification = z.infer<typeof insertNafathVerificationSchema>;
export type NafathVerification = typeof nafathVerifications.$inferSelect;

// فحص الامتثال والقضايا (AML)
export const complianceChecks = pgTable("compliance_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  nationalId: text("national_id").notNull(),
  checkType: text("check_type").notNull(),
  isPassed: boolean("is_passed"),
  riskLevel: text("risk_level"),
  findings: jsonb("findings"),
  pepStatus: boolean("pep_status").default(false),
  sanctionsMatch: boolean("sanctions_match").default(false),
  wantedListMatch: boolean("wanted_list_match").default(false),
  checkedAt: timestamp("checked_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).omit({ id: true, checkedAt: true });
export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;
export type ComplianceCheck = typeof complianceChecks.$inferSelect;

// السجل الائتماني (SIMAH)
export const creditReports = pgTable("credit_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  nationalId: text("national_id").notNull(),
  simahScore: integer("simah_score"),
  totalDebts: real("total_debts").default(0),
  activeLoans: integer("active_loans").default(0),
  delayedPayments: integer("delayed_payments").default(0),
  defaultedLoans: integer("defaulted_loans").default(0),
  creditUtilization: real("credit_utilization"),
  paymentHistory: jsonb("payment_history"),
  riskCategory: text("risk_category"),
  recommendedLimit: real("recommended_limit"),
  reportDate: timestamp("report_date").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertCreditReportSchema = createInsertSchema(creditReports).omit({ id: true, reportDate: true });
export type InsertCreditReport = z.infer<typeof insertCreditReportSchema>;
export type CreditReport = typeof creditReports.$inferSelect;

// بيانات التوظيف
export const employmentRecords = pgTable("employment_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  nationalId: text("national_id"),
  employerName: text("employer_name"),
  employerType: text("employer_type"),
  jobTitle: text("job_title"),
  monthlySalary: real("monthly_salary"),
  employmentStartDate: timestamp("employment_start_date"),
  isVerified: boolean("is_verified").default(false),
  gosiRegistered: boolean("gosi_registered").default(false),
  sector: text("sector"),
  verificationSource: text("verification_source"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmploymentRecordSchema = createInsertSchema(employmentRecords).omit({ id: true, createdAt: true });
export type InsertEmploymentRecord = z.infer<typeof insertEmploymentRecordSchema>;
export type EmploymentRecord = typeof employmentRecords.$inferSelect;

// تقييم العميل الشامل
export const customerRatings = pgTable("customer_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  overallScore: integer("overall_score").default(0),
  nafathVerified: boolean("nafath_verified").default(false),
  kycPassed: boolean("kyc_passed").default(false),
  creditApproved: boolean("credit_approved").default(false),
  ageVerified: boolean("age_verified").default(false),
  isEmployee: boolean("is_employee").default(false),
  employmentScore: integer("employment_score").default(0),
  creditScore: integer("credit_score").default(0),
  complianceScore: integer("compliance_score").default(0),
  priorityLevel: text("priority_level").default("standard"),
  recommendedCreditLimit: real("recommended_credit_limit").default(0),
  maxInstallmentMonths: integer("max_installment_months").default(3),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertCustomerRatingSchema = createInsertSchema(customerRatings).omit({ id: true, lastUpdated: true });
export type InsertCustomerRating = z.infer<typeof insertCustomerRatingSchema>;
export type CustomerRating = typeof customerRatings.$inferSelect;

// ==========================================
// 10. سنافي - محرك دعم قرار الشراء الذكي
// ==========================================

// سجلات التعبئة التاريخية (للمطابقة والتعلم)
export const refuelingHistory = pgTable("refueling_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  vehicleId: varchar("vehicle_id").notNull(),
  stationId: varchar("station_id"),
  fuelType: text("fuel_type").notNull(),
  fuelLevelBefore: real("fuel_level_before").notNull(), // نسبة الوقود قبل التعبئة
  fuelLevelAfter: real("fuel_level_after").notNull(), // نسبة الوقود بعد التعبئة
  litersAdded: real("liters_added").notNull(),
  pricePerLiter: real("price_per_liter").notNull(),
  totalCost: real("total_cost").notNull(),
  odometerBefore: integer("odometer_before"),
  odometerAfter: integer("odometer_after"),
  wasSuccessful: boolean("was_successful").default(true), // هل كانت التعبئة مناسبة
  userSatisfaction: integer("user_satisfaction"), // تقييم المستخدم 1-5
  notes: text("notes"),
  refueledAt: timestamp("refueled_at").defaultNow(),
});

export const insertRefuelingHistorySchema = createInsertSchema(refuelingHistory).omit({ id: true, refueledAt: true });
export type InsertRefuelingHistory = z.infer<typeof insertRefuelingHistorySchema>;
export type RefuelingHistory = typeof refuelingHistory.$inferSelect;

// جلسات دعم القرار (Decision Support Sessions)
export const decisionSupportSessions = pgTable("decision_support_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  decisionSupportId: text("decision_support_id").unique().notNull(), // SNAFI-DSS-XXXXXX
  userId: varchar("user_id").notNull(),
  vehicleId: varchar("vehicle_id").notNull(),
  invoiceId: varchar("invoice_id"), // ربط بالفاتورة لاحقاً
  
  // مدخلات المستخدم
  inputFuelPercentage: real("input_fuel_percentage").notNull(), // نسبة الوقود الحالية
  inputTankCapacity: real("input_tank_capacity").notNull(), // سعة التانكي
  selectedFuelType: text("selected_fuel_type").notNull(),
  
  // مخرجات الخوارزمية
  recommendedLiters: real("recommended_liters").notNull(), // اللترات المقترحة
  estimatedCost: real("estimated_cost").notNull(), // التكلفة المتوقعة
  confidenceScore: real("confidence_score").default(0), // درجة الثقة في التوصية
  matchedHistoricalRecords: integer("matched_historical_records").default(0), // عدد السجلات المطابقة
  
  // بيانات السعر
  currentFuelPrice: real("current_fuel_price").notNull(), // سعر اللتر الحالي
  estimatedSavings: real("estimated_savings").default(0), // التوفير المحتمل
  
  // حالة الجلسة
  status: text("status").default("pending"), // pending, accepted, rejected, completed
  userAction: text("user_action"), // accepted, modified, rejected
  actualLitersUsed: real("actual_liters_used"), // اللترات الفعلية المستخدمة
  
  // تقييم الدقة
  predictionAccuracy: real("prediction_accuracy"), // دقة التنبؤ بعد التعبئة
  userFeedback: integer("user_feedback"), // تقييم المستخدم 1-5
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertDecisionSupportSessionSchema = createInsertSchema(decisionSupportSessions).omit({ 
  id: true, 
  createdAt: true,
  completedAt: true 
});
export type InsertDecisionSupportSession = z.infer<typeof insertDecisionSupportSessionSchema>;
export type DecisionSupportSession = typeof decisionSupportSessions.$inferSelect;

// سجلات تقييم دقة التنبؤ
export const predictionAccuracyRecords = pgTable("prediction_accuracy_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  decisionSessionId: varchar("decision_session_id").notNull(),
  userId: varchar("user_id").notNull(),
  vehicleId: varchar("vehicle_id").notNull(),
  
  predictedLiters: real("predicted_liters").notNull(),
  actualLiters: real("actual_liters").notNull(),
  deviationPercentage: real("deviation_percentage").notNull(), // نسبة الانحراف
  
  predictedCost: real("predicted_cost").notNull(),
  actualCost: real("actual_cost").notNull(),
  costDeviation: real("cost_deviation").notNull(),
  
  accuracyScore: real("accuracy_score").notNull(), // 0-100
  improvedFromLast: boolean("improved_from_last").default(false),
  
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const insertPredictionAccuracySchema = createInsertSchema(predictionAccuracyRecords).omit({ id: true, recordedAt: true });
export type InsertPredictionAccuracy = z.infer<typeof insertPredictionAccuracySchema>;
export type PredictionAccuracyRecord = typeof predictionAccuracyRecords.$inferSelect;

// أسعار الوقود الحالية
export const fuelPrices = pgTable("fuel_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fuelType: text("fuel_type").notNull(),
  pricePerLiter: real("price_per_liter").notNull(),
  effectiveFrom: timestamp("effective_from").defaultNow(),
  effectiveTo: timestamp("effective_to"),
  source: text("source").default("system"), // aramco, system, station
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFuelPriceSchema = createInsertSchema(fuelPrices).omit({ id: true, createdAt: true });
export type InsertFuelPrice = z.infer<typeof insertFuelPriceSchema>;
export type FuelPrice = typeof fuelPrices.$inferSelect;

// ==========================================
// 11. Merchant API (BNPL Integration - مثل تمارا/تابي)
// ==========================================

// التجار المسجلين في النظام
export const merchants = pgTable("merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantCode: text("merchant_code").unique().notNull(), // MERCH-XXXXX
  companyName: text("company_name").notNull(),
  companyNameAr: text("company_name_ar"),
  commercialReg: text("commercial_reg").unique(),
  taxNumber: text("tax_number"),
  website: text("website"),
  callbackUrl: text("callback_url"), // URL للإشعارات
  logoUrl: text("logo_url"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  category: text("category"), // retail, ecommerce, fuel_station, etc.
  commissionRate: real("commission_rate").default(3), // نسبة العمولة %
  settlementDays: integer("settlement_days").default(1), // أيام التسوية
  status: text("status").default("pending"), // pending, active, suspended
  isVerified: boolean("is_verified").default(false),
  maxTransactionLimit: real("max_transaction_limit").default(5000),
  monthlyLimit: real("monthly_limit").default(100000),
  currentMonthVolume: real("current_month_volume").default(0),
  totalTransactions: integer("total_transactions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMerchantSchema = createInsertSchema(merchants).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchants.$inferSelect;

// مفاتيح API للتجار
export const merchantApiKeys = pgTable("merchant_api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull(),
  keyType: text("key_type").notNull(), // sandbox, production
  publicKey: text("public_key").unique().notNull(), // pk_test_xxx / pk_live_xxx
  secretKey: text("secret_key").unique().notNull(), // sk_test_xxx / sk_live_xxx (مشفر)
  webhookSecret: text("webhook_secret"), // whsec_xxx للتحقق من Webhooks
  permissions: text("permissions").array().default(sql`ARRAY['checkout', 'refund', 'read']::text[]`),
  ipWhitelist: text("ip_whitelist").array(),
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMerchantApiKeySchema = createInsertSchema(merchantApiKeys).omit({ id: true, createdAt: true });
export type InsertMerchantApiKey = z.infer<typeof insertMerchantApiKeySchema>;
export type MerchantApiKey = typeof merchantApiKeys.$inferSelect;

// جلسات الدفع (Checkout Sessions) - مثل تمارا/تابي
export const checkoutSessions = pgTable("checkout_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").unique().notNull(), // chk_xxx
  merchantId: varchar("merchant_id").notNull(),
  merchantReference: text("merchant_reference").notNull(), // رقم الطلب من التاجر
  
  // بيانات المستهلك
  consumerId: varchar("consumer_id"), // إذا كان مسجل
  consumerPhone: text("consumer_phone").notNull(),
  consumerEmail: text("consumer_email"),
  consumerName: text("consumer_name"),
  consumerNationalId: text("consumer_national_id"),
  
  // بيانات الطلب
  currency: text("currency").default("SAR"),
  totalAmount: real("total_amount").notNull(),
  taxAmount: real("tax_amount").default(0),
  shippingAmount: real("shipping_amount").default(0),
  discountAmount: real("discount_amount").default(0),
  items: jsonb("items"), // [{name, quantity, unitPrice, sku}]
  
  // خطة الدفع
  paymentType: text("payment_type").default("pay_in_installments"), // pay_now, pay_later, pay_in_installments
  installmentCount: integer("installment_count").default(4),
  downPaymentPercent: real("down_payment_percent").default(0), // نسبة الدفعة المقدمة
  
  // URLs
  successUrl: text("success_url").notNull(),
  failureUrl: text("failure_url").notNull(),
  cancelUrl: text("cancel_url"),
  notificationUrl: text("notification_url"), // Webhook URL
  
  // الحالة
  status: text("status").default("pending"), // pending, approved, captured, declined, expired, refunded
  declineReason: text("decline_reason"),
  
  // الموافقة الائتمانية
  creditDecision: text("credit_decision"), // approved, declined, pending_verification
  creditLimit: real("credit_limit"),
  riskScore: integer("risk_score"),
  
  // الربط بالفاتورة
  invoiceId: varchar("invoice_id"),
  
  // توقيتات
  expiresAt: timestamp("expires_at"),
  approvedAt: timestamp("approved_at"),
  capturedAt: timestamp("captured_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCheckoutSessionSchema = createInsertSchema(checkoutSessions).omit({ id: true, createdAt: true });
export type InsertCheckoutSession = z.infer<typeof insertCheckoutSessionSchema>;
export type CheckoutSession = typeof checkoutSessions.$inferSelect;

// Webhooks المرسلة للتجار
export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull(),
  eventType: text("event_type").notNull(), // checkout.approved, payment.captured, refund.completed
  resourceType: text("resource_type").notNull(), // checkout, payment, refund
  resourceId: varchar("resource_id").notNull(),
  payload: jsonb("payload").notNull(),
  webhookUrl: text("webhook_url").notNull(),
  
  // حالة الإرسال
  status: text("status").default("pending"), // pending, sent, failed, retrying
  httpStatus: integer("http_status"),
  responseBody: text("response_body"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(5),
  nextRetryAt: timestamp("next_retry_at"),
  
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({ id: true, createdAt: true });
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;

// سجل معاملات التجار
export const merchantTransactions = pgTable("merchant_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull(),
  checkoutSessionId: varchar("checkout_session_id").notNull(),
  transactionType: text("transaction_type").notNull(), // capture, refund, chargeback
  
  grossAmount: real("gross_amount").notNull(), // المبلغ الإجمالي
  commissionAmount: real("commission_amount").notNull(), // عمولة دربي
  netAmount: real("net_amount").notNull(), // المبلغ الصافي للتاجر
  
  status: text("status").default("pending"), // pending, completed, failed
  settledAt: timestamp("settled_at"),
  settlementRef: text("settlement_ref"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMerchantTransactionSchema = createInsertSchema(merchantTransactions).omit({ id: true, createdAt: true });
export type InsertMerchantTransaction = z.infer<typeof insertMerchantTransactionSchema>;
export type MerchantTransaction = typeof merchantTransactions.$inferSelect;

// تسويات التجار
export const merchantSettlements = pgTable("merchant_settlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull(),
  settlementRef: text("settlement_ref").unique().notNull(), // STL-XXXXXXXX
  
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  totalTransactions: integer("total_transactions").notNull(),
  grossAmount: real("gross_amount").notNull(),
  totalCommission: real("total_commission").notNull(),
  totalRefunds: real("total_refunds").default(0),
  netAmount: real("net_amount").notNull(),
  
  bankAccount: text("bank_account"),
  iban: text("iban"),
  
  status: text("status").default("pending"), // pending, processing, completed, failed
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMerchantSettlementSchema = createInsertSchema(merchantSettlements).omit({ id: true, createdAt: true });
export type InsertMerchantSettlement = z.infer<typeof insertMerchantSettlementSchema>;
export type MerchantSettlement = typeof merchantSettlements.$inferSelect;

// ==========================================
// Enums للاستخدام في التطبيق
// ==========================================

// حالات جلسة دعم القرار
export const DecisionSessionStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  COMPLETED: "completed",
  EXPIRED: "expired",
} as const;

// أنواع إجراء المستخدم
export const UserActionTypes = {
  ACCEPTED: "accepted",
  MODIFIED: "modified",
  REJECTED: "rejected",
} as const;

export const UserTypes = {
  INDIVIDUAL: "individual",
  FLEET: "fleet",
  PARTNER: "partner",
  ADMIN: "admin",
} as const;

export const UserStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  CLOSED: "closed",
} as const;

export const FuelTypes = {
  GASOLINE_91: "91",
  GASOLINE_95: "95",
  DIESEL: "diesel",
} as const;

export const InvoiceStatus = {
  ACTIVE: "active",
  PARTIALLY_PAID: "partially_paid",
  PAID: "paid",
  OVERDUE: "overdue",
  DEFAULTED: "defaulted",
} as const;

export const FuelRequestStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export const PartnerTypes = {
  STATION_OWNER: "station_owner",
  FINANCIAL: "financial",
  INSURANCE: "insurance",
} as const;

export const PaymentMethods = {
  WALLET: "wallet",
  CARD: "card",
  BANK_TRANSFER: "bank_transfer",
} as const;

export const NotificationTypes = {
  PAYMENT_DUE: "payment_due",
  OFFER: "offer",
  SYSTEM: "system",
  FUEL_LOW: "fuel_low",
} as const;

export const NafathStatus = {
  PENDING: "pending",
  WAITING: "waiting",
  VERIFIED: "verified",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export const ComplianceCheckTypes = {
  KYC: "kyc",
  AML: "aml",
  SANCTIONS: "sanctions",
  PEP: "pep",
  WANTED_LIST: "wanted_list",
} as const;

export const RiskLevels = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export const CreditRiskCategories = {
  EXCELLENT: "excellent",
  GOOD: "good",
  FAIR: "fair",
  POOR: "poor",
  DEFAULTER: "defaulter",
} as const;

export const EmployerTypes = {
  GOVERNMENT: "government",
  SEMI_GOVERNMENT: "semi_government",
  PRIVATE_LARGE: "private_large",
  PRIVATE_SME: "private_sme",
  SELF_EMPLOYED: "self_employed",
  FREELANCER: "freelancer",
  UNEMPLOYED: "unemployed",
} as const;

export const PriorityLevels = {
  PREMIUM: "premium",
  HIGH: "high",
  STANDARD: "standard",
  RESTRICTED: "restricted",
  BLOCKED: "blocked",
} as const;

// Merchant API Enums
export const MerchantStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  CLOSED: "closed",
} as const;

export const CheckoutStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  CAPTURED: "captured",
  DECLINED: "declined",
  EXPIRED: "expired",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
} as const;

export const WebhookEventTypes = {
  CHECKOUT_APPROVED: "checkout.approved",
  CHECKOUT_DECLINED: "checkout.declined",
  CHECKOUT_EXPIRED: "checkout.expired",
  PAYMENT_CAPTURED: "payment.captured",
  PAYMENT_FAILED: "payment.failed",
  REFUND_COMPLETED: "refund.completed",
  REFUND_FAILED: "refund.failed",
  INSTALLMENT_PAID: "installment.paid",
  INSTALLMENT_OVERDUE: "installment.overdue",
} as const;

export const ApiKeyTypes = {
  SANDBOX: "sandbox",
  PRODUCTION: "production",
} as const;

// ==========================================
// النظام الإداري (Admin Management System)
// ==========================================

// أدوار المستخدمين الإداريين
export const AdminRoles = {
  SUPER_ADMIN: "super_admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
  AUDITOR: "auditor",
} as const;

// حالات طلبات سير العمل
export const WorkflowStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

// أنواع طلبات سير العمل
export const WorkflowTypes = {
  MERCHANT_ACTIVATION: "merchant_activation",
  CREDIT_LIMIT_CHANGE: "credit_limit_change",
  REFUND_REQUEST: "refund_request",
  DISPUTE_RESOLUTION: "dispute_resolution",
  ACCOUNT_SUSPENSION: "account_suspension",
} as const;

// ==========================================
// الأدوار الوظيفية (مطابق لهيكل تمارا BNPL)
// ==========================================
export const ADMIN_ROLES = {
  // القيادة التنفيذية
  CEO: "ceo",                           // الرئيس التنفيذي
  COO: "coo",                           // مدير العمليات
  CFO: "cfo",                           // المدير المالي
  CPO: "cpo",                           // مدير المنتجات
  
  // الإدارة الوسطى
  SUPER_ADMIN: "super_admin",           // مدير النظام
  OPERATIONS_MANAGER: "operations_manager", // مدير العمليات
  FINANCE_MANAGER: "finance_manager",   // مدير المالية
  RISK_MANAGER: "risk_manager",         // مدير المخاطر
  COMPLIANCE_OFFICER: "compliance_officer", // مسؤول الامتثال
  
  // الأقسام التشغيلية
  CUSTOMER_SERVICE: "customer_service", // خدمة العملاء
  CUSTOMER_SERVICE_LEAD: "customer_service_lead", // قائد فريق خدمة العملاء
  ACCOUNTANT: "accountant",             // محاسب
  SENIOR_ACCOUNTANT: "senior_accountant", // محاسب أول
  COLLECTIONS: "collections",           // التحصيل
  COLLECTIONS_LEAD: "collections_lead", // قائد فريق التحصيل
  FRAUD_ANALYST: "fraud_analyst",       // محلل الاحتيال
  DATA_ANALYST: "data_analyst",         // محلل البيانات
  
  // إدارة التجار والشراكات
  MERCHANT_SUPPORT: "merchant_support", // دعم التجار
  PARTNERSHIPS_MANAGER: "partnerships_manager", // مدير الشراكات
  
  // إدارة الفروع
  BRANCH_MANAGER: "branch_manager",     // مدير الفرع
  ASSISTANT_BRANCH_MANAGER: "assistant_branch_manager", // مساعد مدير الفرع
  CASHIER: "cashier",                   // أمين الصندوق
  
  // الجودة والتدقيق
  QA_SPECIALIST: "qa_specialist",       // أخصائي الجودة
  AUDITOR: "auditor",                   // مدقق
  INTERNAL_AUDITOR: "internal_auditor", // مدقق داخلي
  
  // الموارد البشرية
  HR_MANAGER: "hr_manager",             // مدير الموارد البشرية
  TRAINING_OFFICER: "training_officer", // مسؤول التدريب
} as const;

// الصلاحيات التفصيلية
export const PERMISSIONS = {
  // إدارة المستخدمين
  VIEW_USERS: "view_users",
  CREATE_USER: "create_user",
  EDIT_USER: "edit_user",
  DELETE_USER: "delete_user",
  SUSPEND_USER: "suspend_user",
  
  // إدارة التجار
  VIEW_MERCHANTS: "view_merchants",
  CREATE_MERCHANT: "create_merchant",
  EDIT_MERCHANT: "edit_merchant",
  ACTIVATE_MERCHANT: "activate_merchant",
  SUSPEND_MERCHANT: "suspend_merchant",
  
  // إدارة الفواتير
  VIEW_INVOICES: "view_invoices",
  CREATE_INVOICE: "create_invoice",
  EDIT_INVOICE: "edit_invoice",
  CANCEL_INVOICE: "cancel_invoice",
  REFUND_INVOICE: "refund_invoice",
  
  // الإدارة المالية
  VIEW_FINANCIAL_REPORTS: "view_financial_reports",
  PROCESS_PAYMENTS: "process_payments",
  MANAGE_SETTLEMENTS: "manage_settlements",
  APPROVE_REFUNDS: "approve_refunds",
  
  // إدارة المخاطر والائتمان
  VIEW_CREDIT_REPORTS: "view_credit_reports",
  MODIFY_CREDIT_LIMIT: "modify_credit_limit",
  APPROVE_CREDIT_REQUEST: "approve_credit_request",
  VIEW_RISK_ANALYTICS: "view_risk_analytics",
  
  // الامتثال
  VIEW_COMPLIANCE_REPORTS: "view_compliance_reports",
  MANAGE_AML_CHECKS: "manage_aml_checks",
  MANAGE_KYC: "manage_kyc",
  REGULATORY_REPORTING: "regulatory_reporting",
  
  // مكافحة الاحتيال
  VIEW_FRAUD_ALERTS: "view_fraud_alerts",
  INVESTIGATE_FRAUD: "investigate_fraud",
  BLOCK_TRANSACTIONS: "block_transactions",
  
  // التحصيل
  VIEW_OVERDUE: "view_overdue",
  MANAGE_PAYMENT_PLANS: "manage_payment_plans",
  ESCALATE_COLLECTIONS: "escalate_collections",
  
  // خدمة العملاء
  VIEW_TICKETS: "view_tickets",
  MANAGE_TICKETS: "manage_tickets",
  ESCALATE_TICKETS: "escalate_tickets",
  
  // إدارة الفروع
  VIEW_BRANCH: "view_branch",
  MANAGE_BRANCH_STAFF: "manage_branch_staff",
  VIEW_BRANCH_REPORTS: "view_branch_reports",
  
  // نقاط البيع
  POS_CREATE_INVOICE: "pos_create_invoice",
  POS_PROCESS_PAYMENT: "pos_process_payment",
  POS_VIEW_TRANSACTIONS: "pos_view_transactions",
  
  // سير العمل والموافقات
  VIEW_WORKFLOWS: "view_workflows",
  APPROVE_WORKFLOWS: "approve_workflows",
  REJECT_WORKFLOWS: "reject_workflows",
  
  // النظام والإعدادات
  VIEW_SYSTEM_SETTINGS: "view_system_settings",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  MANAGE_ADMIN_USERS: "manage_admin_users",
} as const;

// مصفوفة الصلاحيات لكل دور
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ADMIN_ROLES.CEO]: Object.values(PERMISSIONS),
  [ADMIN_ROLES.COO]: Object.values(PERMISSIONS),
  [ADMIN_ROLES.CFO]: [
    PERMISSIONS.VIEW_FINANCIAL_REPORTS, PERMISSIONS.PROCESS_PAYMENTS, 
    PERMISSIONS.MANAGE_SETTLEMENTS, PERMISSIONS.APPROVE_REFUNDS,
    PERMISSIONS.VIEW_INVOICES, PERMISSIONS.VIEW_MERCHANTS,
    PERMISSIONS.VIEW_AUDIT_LOGS, PERMISSIONS.APPROVE_WORKFLOWS,
  ],
  [ADMIN_ROLES.CPO]: [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_MERCHANTS,
    PERMISSIONS.VIEW_INVOICES, PERMISSIONS.VIEW_RISK_ANALYTICS,
  ],
  [ADMIN_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ADMIN_ROLES.OPERATIONS_MANAGER]: [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_MERCHANTS, PERMISSIONS.ACTIVATE_MERCHANT,
    PERMISSIONS.SUSPEND_MERCHANT, PERMISSIONS.VIEW_INVOICES, PERMISSIONS.VIEW_WORKFLOWS,
    PERMISSIONS.APPROVE_WORKFLOWS, PERMISSIONS.MANAGE_ADMIN_USERS,
  ],
  [ADMIN_ROLES.FINANCE_MANAGER]: [
    PERMISSIONS.VIEW_FINANCIAL_REPORTS, PERMISSIONS.PROCESS_PAYMENTS,
    PERMISSIONS.MANAGE_SETTLEMENTS, PERMISSIONS.APPROVE_REFUNDS,
    PERMISSIONS.VIEW_INVOICES, PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  [ADMIN_ROLES.RISK_MANAGER]: [
    PERMISSIONS.VIEW_CREDIT_REPORTS, PERMISSIONS.MODIFY_CREDIT_LIMIT,
    PERMISSIONS.APPROVE_CREDIT_REQUEST, PERMISSIONS.VIEW_RISK_ANALYTICS,
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_FRAUD_ALERTS,
  ],
  [ADMIN_ROLES.COMPLIANCE_OFFICER]: [
    PERMISSIONS.VIEW_COMPLIANCE_REPORTS, PERMISSIONS.MANAGE_AML_CHECKS,
    PERMISSIONS.MANAGE_KYC, PERMISSIONS.REGULATORY_REPORTING,
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  [ADMIN_ROLES.CUSTOMER_SERVICE]: [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.VIEW_INVOICES,
  ],
  [ADMIN_ROLES.CUSTOMER_SERVICE_LEAD]: [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.ESCALATE_TICKETS, PERMISSIONS.VIEW_INVOICES,
  ],
  [ADMIN_ROLES.ACCOUNTANT]: [
    PERMISSIONS.VIEW_INVOICES, PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.PROCESS_PAYMENTS,
  ],
  [ADMIN_ROLES.SENIOR_ACCOUNTANT]: [
    PERMISSIONS.VIEW_INVOICES, PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.PROCESS_PAYMENTS, PERMISSIONS.MANAGE_SETTLEMENTS,
  ],
  [ADMIN_ROLES.COLLECTIONS]: [
    PERMISSIONS.VIEW_OVERDUE, PERMISSIONS.MANAGE_PAYMENT_PLANS,
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_INVOICES,
  ],
  [ADMIN_ROLES.COLLECTIONS_LEAD]: [
    PERMISSIONS.VIEW_OVERDUE, PERMISSIONS.MANAGE_PAYMENT_PLANS,
    PERMISSIONS.ESCALATE_COLLECTIONS, PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_INVOICES,
  ],
  [ADMIN_ROLES.FRAUD_ANALYST]: [
    PERMISSIONS.VIEW_FRAUD_ALERTS, PERMISSIONS.INVESTIGATE_FRAUD,
    PERMISSIONS.BLOCK_TRANSACTIONS, PERMISSIONS.VIEW_USERS,
  ],
  [ADMIN_ROLES.DATA_ANALYST]: [
    PERMISSIONS.VIEW_FINANCIAL_REPORTS, PERMISSIONS.VIEW_RISK_ANALYTICS,
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_INVOICES, PERMISSIONS.VIEW_MERCHANTS,
  ],
  [ADMIN_ROLES.MERCHANT_SUPPORT]: [
    PERMISSIONS.VIEW_MERCHANTS, PERMISSIONS.EDIT_MERCHANT,
    PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS,
  ],
  [ADMIN_ROLES.PARTNERSHIPS_MANAGER]: [
    PERMISSIONS.VIEW_MERCHANTS, PERMISSIONS.CREATE_MERCHANT,
    PERMISSIONS.EDIT_MERCHANT, PERMISSIONS.ACTIVATE_MERCHANT,
  ],
  [ADMIN_ROLES.BRANCH_MANAGER]: [
    PERMISSIONS.VIEW_BRANCH, PERMISSIONS.MANAGE_BRANCH_STAFF,
    PERMISSIONS.VIEW_BRANCH_REPORTS, PERMISSIONS.POS_CREATE_INVOICE,
    PERMISSIONS.POS_PROCESS_PAYMENT, PERMISSIONS.POS_VIEW_TRANSACTIONS,
  ],
  [ADMIN_ROLES.ASSISTANT_BRANCH_MANAGER]: [
    PERMISSIONS.VIEW_BRANCH, PERMISSIONS.VIEW_BRANCH_REPORTS,
    PERMISSIONS.POS_CREATE_INVOICE, PERMISSIONS.POS_PROCESS_PAYMENT,
  ],
  [ADMIN_ROLES.CASHIER]: [
    PERMISSIONS.POS_CREATE_INVOICE, PERMISSIONS.POS_PROCESS_PAYMENT,
    PERMISSIONS.POS_VIEW_TRANSACTIONS,
  ],
  [ADMIN_ROLES.QA_SPECIALIST]: [
    PERMISSIONS.VIEW_INVOICES, PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  [ADMIN_ROLES.AUDITOR]: [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_MERCHANTS, PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS, PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_COMPLIANCE_REPORTS, PERMISSIONS.VIEW_WORKFLOWS,
  ],
  [ADMIN_ROLES.INTERNAL_AUDITOR]: [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_MERCHANTS, PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS, PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_COMPLIANCE_REPORTS, PERMISSIONS.VIEW_WORKFLOWS,
    PERMISSIONS.VIEW_SYSTEM_SETTINGS,
  ],
  [ADMIN_ROLES.HR_MANAGER]: [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.MANAGE_ADMIN_USERS,
  ],
  [ADMIN_ROLES.TRAINING_OFFICER]: [
    PERMISSIONS.VIEW_USERS,
  ],
};

// الأقسام الإدارية
export const DEPARTMENTS = {
  EXECUTIVE: "executive",               // القيادة التنفيذية
  OPERATIONS: "operations",             // العمليات
  FINANCE: "finance",                   // المالية
  RISK: "risk",                         // إدارة المخاطر
  COMPLIANCE: "compliance",             // الامتثال
  CUSTOMER_SERVICE: "customer_service", // خدمة العملاء
  COLLECTIONS: "collections",           // التحصيل
  FRAUD: "fraud",                       // مكافحة الاحتيال
  DATA: "data",                         // تحليل البيانات
  MERCHANTS: "merchants",               // إدارة التجار
  BRANCHES: "branches",                 // إدارة الفروع
  QUALITY: "quality",                   // الجودة
  AUDIT: "audit",                       // التدقيق
  HR: "hr",                             // الموارد البشرية
} as const;

// جدول المستخدمين الإداريين
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  fullNameAr: text("full_name_ar"),
  phone: text("phone"),
  role: text("role").notNull().default("employee"),
  department: text("department"),
  branchId: varchar("branch_id"),
  permissions: jsonb("permissions").default([]),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// سجل تسجيل الدخول
export const adminLoginHistory = pgTable("admin_login_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").notNull(),
  loginAt: timestamp("login_at").defaultNow(),
  logoutAt: timestamp("logout_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  loginStatus: text("login_status").default("success"),
  failureReason: text("failure_reason"),
});

export const insertAdminLoginHistorySchema = createInsertSchema(adminLoginHistory).omit({ id: true });
export type InsertAdminLoginHistory = z.infer<typeof insertAdminLoginHistorySchema>;
export type AdminLoginHistory = typeof adminLoginHistory.$inferSelect;

// سجل الأحداث والتدقيق
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// طلبات سير العمل (Workflow Requests)
export const workflowRequests = pgTable("workflow_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestType: text("request_type").notNull(),
  requesterId: varchar("requester_id"),
  requesterType: text("requester_type").default("system"),
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id").notNull(),
  payload: jsonb("payload"),
  priority: text("priority").default("normal"),
  status: text("status").default("pending"),
  assignedTo: varchar("assigned_to"),
  reviewedBy: varchar("reviewed_by"),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkflowRequestSchema = createInsertSchema(workflowRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkflowRequest = z.infer<typeof insertWorkflowRequestSchema>;
export type WorkflowRequest = typeof workflowRequests.$inferSelect;

// إعدادات النظام
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value"),
  settingType: text("setting_type").default("string"),
  description: text("description"),
  isEditable: boolean("is_editable").default(true),
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ id: true, updatedAt: true });
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// الإشعارات الإدارية
export const adminNotifications = pgTable("admin_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  notificationType: text("notification_type").default("info"),
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({ id: true, createdAt: true });
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;

// الفروع
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  address: text("address"),
  city: text("city"),
  phone: text("phone"),
  managerId: varchar("manager_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBranchSchema = createInsertSchema(branches).omit({ id: true, createdAt: true });
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;

// ==========================================
// 15. الهيكل التنظيمي - Organizational Structure
// ==========================================

// جدول الأقسام الإدارية - Departments Table
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),              // رمز القسم - Department Code
  nameEn: text("name_en").notNull(),                  // اسم القسم بالإنجليزية - English Name
  nameAr: text("name_ar").notNull(),                  // اسم القسم بالعربية - Arabic Name
  descriptionEn: text("description_en"),              // وصف القسم بالإنجليزية - English Description
  descriptionAr: text("description_ar"),              // وصف القسم بالعربية - Arabic Description
  parentDepartmentId: varchar("parent_department_id"), // القسم الأب - Parent Department
  managerId: varchar("manager_id"),                   // مدير القسم - Department Manager
  level: integer("level").default(1),                 // مستوى القسم في الهيكل - Hierarchy Level
  sortOrder: integer("sort_order").default(0),        // ترتيب العرض - Display Order
  isActive: boolean("is_active").default(true),       // حالة النشاط - Active Status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// جدول الأدوار الوظيفية - Roles Table
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),              // رمز الدور - Role Code
  nameEn: text("name_en").notNull(),                  // اسم الدور بالإنجليزية - English Name
  nameAr: text("name_ar").notNull(),                  // اسم الدور بالعربية - Arabic Name
  descriptionEn: text("description_en"),              // وصف الدور بالإنجليزية - English Description
  descriptionAr: text("description_ar"),              // وصف الدور بالعربية - Arabic Description
  departmentId: varchar("department_id"),             // القسم التابع له - Department
  level: integer("level").default(1),                 // المستوى الوظيفي - Job Level (1=CEO, 6=Staff)
  reportsToRoleId: varchar("reports_to_role_id"),     // يرفع التقارير إلى - Reports To
  salaryGradeMin: integer("salary_grade_min"),        // الحد الأدنى للدرجة الوظيفية - Min Salary Grade
  salaryGradeMax: integer("salary_grade_max"),        // الحد الأقصى للدرجة الوظيفية - Max Salary Grade
  isManagement: boolean("is_management").default(false), // هل دور إداري - Is Management Role
  isActive: boolean("is_active").default(true),       // حالة النشاط - Active Status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// جدول الصلاحيات - Permissions Table
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),              // رمز الصلاحية - Permission Code
  nameEn: text("name_en").notNull(),                  // اسم الصلاحية بالإنجليزية - English Name
  nameAr: text("name_ar").notNull(),                  // اسم الصلاحية بالعربية - Arabic Name
  descriptionEn: text("description_en"),              // وصف الصلاحية بالإنجليزية - English Description
  descriptionAr: text("description_ar"),              // وصف الصلاحية بالعربية - Arabic Description
  module: text("module").notNull(),                   // الوحدة/النظام الفرعي - Module
  category: text("category"),                         // تصنيف الصلاحية - Category
  riskLevel: text("risk_level").default("low"),       // مستوى الخطورة - Risk Level (low, medium, high, critical)
  requiresApproval: boolean("requires_approval").default(false), // يتطلب موافقة - Requires Approval
  isActive: boolean("is_active").default(true),       // حالة النشاط - Active Status
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true, createdAt: true });
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

// جدول ربط الأدوار بالصلاحيات - Role Permissions (Many-to-Many)
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull(),               // معرف الدور - Role ID
  permissionId: varchar("permission_id").notNull(),   // معرف الصلاحية - Permission ID
  grantedAt: timestamp("granted_at").defaultNow(),    // تاريخ المنح - Grant Date
  grantedBy: varchar("granted_by"),                   // من قام بالمنح - Granted By
  expiresAt: timestamp("expires_at"),                 // تاريخ الانتهاء - Expiry Date
  isActive: boolean("is_active").default(true),       // حالة النشاط - Active Status
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true, grantedAt: true });
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// جدول المهام اليومية للأدوار - Role Daily Tasks
export const roleDailyTasks = pgTable("role_daily_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull(),               // معرف الدور - Role ID
  taskNameEn: text("task_name_en").notNull(),         // اسم المهمة بالإنجليزية - English Task Name
  taskNameAr: text("task_name_ar").notNull(),         // اسم المهمة بالعربية - Arabic Task Name
  descriptionEn: text("description_en"),              // وصف المهمة بالإنجليزية - English Description
  descriptionAr: text("description_ar"),              // وصف المهمة بالعربية - Arabic Description
  frequency: text("frequency").default("daily"),      // التكرار - Frequency (daily, weekly, monthly)
  priority: integer("priority").default(1),           // الأولوية - Priority
  estimatedHours: real("estimated_hours"),            // الوقت المتوقع بالساعات - Estimated Hours
  kpiMetric: text("kpi_metric"),                      // مؤشر الأداء - KPI Metric
  sortOrder: integer("sort_order").default(0),        // ترتيب العرض - Display Order
  isActive: boolean("is_active").default(true),       // حالة النشاط - Active Status
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoleDailyTaskSchema = createInsertSchema(roleDailyTasks).omit({ id: true, createdAt: true });
export type InsertRoleDailyTask = z.infer<typeof insertRoleDailyTaskSchema>;
export type RoleDailyTask = typeof roleDailyTasks.$inferSelect;

// جدول علاقات الأقسام - Department Relationships (Cross-Department Collaboration)
export const departmentRelationships = pgTable("department_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromDepartmentId: varchar("from_department_id").notNull(),  // من القسم - From Department
  toDepartmentId: varchar("to_department_id").notNull(),      // إلى القسم - To Department
  relationshipType: text("relationship_type").notNull(),       // نوع العلاقة - Relationship Type
  descriptionEn: text("description_en"),                       // وصف العلاقة بالإنجليزية - English Description
  descriptionAr: text("description_ar"),                       // وصف العلاقة بالعربية - Arabic Description
  dataFlowDirection: text("data_flow_direction").default("bidirectional"), // اتجاه تدفق البيانات - Data Flow Direction
  priority: text("priority").default("normal"),                // أهمية العلاقة - Importance
  isActive: boolean("is_active").default(true),                // حالة النشاط - Active Status
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDepartmentRelationshipSchema = createInsertSchema(departmentRelationships).omit({ id: true, createdAt: true });
export type InsertDepartmentRelationship = z.infer<typeof insertDepartmentRelationshipSchema>;
export type DepartmentRelationship = typeof departmentRelationships.$inferSelect;

// جدول سلسلة التقارير - Reporting Chain (الهيكل الهرمي للموظفين)
export const reportingChain = pgTable("reporting_chain", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),        // معرف الموظف - Employee ID
  supervisorId: varchar("supervisor_id").notNull(),    // معرف المشرف - Supervisor ID
  relationshipType: text("relationship_type").default("direct"), // نوع العلاقة - Type (direct, dotted, matrix)
  effectiveFrom: timestamp("effective_from").defaultNow(),       // تاريخ البداية - Effective From
  effectiveTo: timestamp("effective_to"),                        // تاريخ النهاية - Effective To
  isActive: boolean("is_active").default(true),        // حالة النشاط - Active Status
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportingChainSchema = createInsertSchema(reportingChain).omit({ id: true, createdAt: true });
export type InsertReportingChain = z.infer<typeof insertReportingChainSchema>;
export type ReportingChain = typeof reportingChain.$inferSelect;

// جدول سير العمل النموذجي - Workflow Templates
export const workflowTemplates = pgTable("workflow_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),               // رمز سير العمل - Workflow Code
  nameEn: text("name_en").notNull(),                   // اسم سير العمل بالإنجليزية - English Name
  nameAr: text("name_ar").notNull(),                   // اسم سير العمل بالعربية - Arabic Name
  descriptionEn: text("description_en"),               // وصف سير العمل بالإنجليزية - English Description
  descriptionAr: text("description_ar"),               // وصف سير العمل بالعربية - Arabic Description
  category: text("category"),                          // تصنيف سير العمل - Category
  estimatedDuration: integer("estimated_duration"),    // المدة المتوقعة بالدقائق - Estimated Duration (minutes)
  isActive: boolean("is_active").default(true),        // حالة النشاط - Active Status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;

// جدول خطوات سير العمل - Workflow Steps
export const workflowSteps = pgTable("workflow_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowTemplateId: varchar("workflow_template_id").notNull(), // معرف سير العمل - Workflow ID
  stepNumber: integer("step_number").notNull(),                   // رقم الخطوة - Step Number
  departmentId: varchar("department_id"),                         // القسم المسؤول - Responsible Department
  roleId: varchar("role_id"),                                     // الدور المسؤول - Responsible Role
  actionNameEn: text("action_name_en").notNull(),                 // اسم الإجراء بالإنجليزية - English Action
  actionNameAr: text("action_name_ar").notNull(),                 // اسم الإجراء بالعربية - Arabic Action
  descriptionEn: text("description_en"),                          // وصف الإجراء بالإنجليزية - English Description
  descriptionAr: text("description_ar"),                          // وصف الإجراء بالعربية - Arabic Description
  requiredPermissions: jsonb("required_permissions").default([]), // الصلاحيات المطلوبة - Required Permissions
  slaMinutes: integer("sla_minutes"),                             // الوقت المحدد للإنجاز - SLA in Minutes
  isOptional: boolean("is_optional").default(false),              // خطوة اختيارية - Is Optional
  canSkip: boolean("can_skip").default(false),                    // يمكن تخطيها - Can Skip
  nextStepOnApprove: integer("next_step_on_approve"),             // الخطوة التالية عند الموافقة - Next on Approve
  nextStepOnReject: integer("next_step_on_reject"),               // الخطوة التالية عند الرفض - Next on Reject
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({ id: true, createdAt: true });
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;

// جدول مستويات الموافقة - Approval Levels
export const approvalLevels = pgTable("approval_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),               // رمز المستوى - Level Code
  nameEn: text("name_en").notNull(),                   // اسم المستوى بالإنجليزية - English Name
  nameAr: text("name_ar").notNull(),                   // اسم المستوى بالعربية - Arabic Name
  minAmount: decimal("min_amount", { precision: 15, scale: 2 }), // الحد الأدنى للمبلغ - Min Amount
  maxAmount: decimal("max_amount", { precision: 15, scale: 2 }), // الحد الأقصى للمبلغ - Max Amount
  approverRoleIds: jsonb("approver_role_ids").default([]),       // الأدوار المخولة بالموافقة - Approver Roles
  requiresMultipleApprovers: boolean("requires_multiple_approvers").default(false), // يتطلب موافقين متعددين - Multiple Approvers
  minimumApprovers: integer("minimum_approvers").default(1),     // الحد الأدنى من الموافقين - Minimum Approvers
  escalationTimeMinutes: integer("escalation_time_minutes"),     // وقت التصعيد بالدقائق - Escalation Time
  escalateToRoleId: varchar("escalate_to_role_id"),              // تصعيد إلى دور - Escalate To Role
  isActive: boolean("is_active").default(true),                  // حالة النشاط - Active Status
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApprovalLevelSchema = createInsertSchema(approvalLevels).omit({ id: true, createdAt: true });
export type InsertApprovalLevel = z.infer<typeof insertApprovalLevelSchema>;
export type ApprovalLevel = typeof approvalLevels.$inferSelect;

// جدول تفويض الصلاحيات - Delegation of Authority
export const authorityDelegations = pgTable("authority_delegations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  delegatorId: varchar("delegator_id").notNull(),      // المفوض - Delegator (Admin User ID)
  delegateeId: varchar("delegatee_id").notNull(),      // المفوض إليه - Delegatee (Admin User ID)
  delegationType: text("delegation_type").default("full"), // نوع التفويض - Type (full, partial, specific)
  permissionIds: jsonb("permission_ids").default([]),  // الصلاحيات المفوضة - Delegated Permissions
  reasonEn: text("reason_en"),                         // سبب التفويض بالإنجليزية - English Reason
  reasonAr: text("reason_ar"),                         // سبب التفويض بالعربية - Arabic Reason
  maxApprovalAmount: decimal("max_approval_amount", { precision: 15, scale: 2 }), // الحد الأقصى للموافقة - Max Approval
  effectiveFrom: timestamp("effective_from").notNull(), // تاريخ البداية - Effective From
  effectiveTo: timestamp("effective_to").notNull(),     // تاريخ النهاية - Effective To
  isActive: boolean("is_active").default(true),        // حالة النشاط - Active Status
  approvedBy: varchar("approved_by"),                  // موافق عليه من - Approved By
  approvedAt: timestamp("approved_at"),                // تاريخ الموافقة - Approval Date
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuthorityDelegationSchema = createInsertSchema(authorityDelegations).omit({ id: true, createdAt: true });
export type InsertAuthorityDelegation = z.infer<typeof insertAuthorityDelegationSchema>;
export type AuthorityDelegation = typeof authorityDelegations.$inferSelect;

// جدول مؤشرات الأداء للأقسام - Department KPIs
export const departmentKpis = pgTable("department_kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").notNull(),    // معرف القسم - Department ID
  kpiCode: text("kpi_code").notNull(),                 // رمز المؤشر - KPI Code
  kpiNameEn: text("kpi_name_en").notNull(),            // اسم المؤشر بالإنجليزية - English Name
  kpiNameAr: text("kpi_name_ar").notNull(),            // اسم المؤشر بالعربية - Arabic Name
  descriptionEn: text("description_en"),               // وصف المؤشر بالإنجليزية - English Description
  descriptionAr: text("description_ar"),               // وصف المؤشر بالعربية - Arabic Description
  targetValue: real("target_value"),                   // القيمة المستهدفة - Target Value
  currentValue: real("current_value"),                 // القيمة الحالية - Current Value
  unit: text("unit"),                                  // وحدة القياس - Unit
  frequency: text("frequency").default("monthly"),     // تكرار القياس - Frequency
  lastUpdated: timestamp("last_updated"),              // آخر تحديث - Last Updated
  isActive: boolean("is_active").default(true),        // حالة النشاط - Active Status
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDepartmentKpiSchema = createInsertSchema(departmentKpis).omit({ id: true, createdAt: true });
export type InsertDepartmentKpi = z.infer<typeof insertDepartmentKpiSchema>;
export type DepartmentKpi = typeof departmentKpis.$inferSelect;
