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
