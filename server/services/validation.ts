/**
 * مخططات التحقق من البيانات
 * Validation Schemas for Verification APIs
 */

import { z } from "zod";

// مخطط التحقق من الهوية الوطنية السعودية
const nationalIdSchema = z.string()
  .min(10, "رقم الهوية يجب أن يكون 10 أرقام")
  .max(10, "رقم الهوية يجب أن يكون 10 أرقام")
  .regex(/^[12]\d{9}$/, "رقم الهوية غير صحيح - يجب أن يبدأ بـ 1 أو 2");

// مخطط معرف المستخدم
const userIdSchema = z.string()
  .uuid("معرف المستخدم غير صحيح");

// بدء التحقق من نفاذ
export const nafathInitiateSchema = z.object({
  userId: userIdSchema,
  nationalId: nationalIdSchema,
});

// محاكاة نفاذ
export const nafathSimulateSchema = z.object({
  requestId: z.string().min(1, "معرف الطلب مطلوب"),
  approved: z.boolean(),
});

// فحص الامتثال
export const complianceCheckSchema = z.object({
  userId: userIdSchema,
  nationalId: nationalIdSchema,
});

// جلب التقرير الائتماني
export const creditReportSchema = z.object({
  userId: userIdSchema,
  nationalId: nationalIdSchema,
});

// تقييم أهلية التمويل
export const creditEvaluateSchema = z.object({
  userId: userIdSchema,
  requestedAmount: z.number().positive().optional().default(1000),
});

// التحقق من التوظيف
export const employmentVerifySchema = z.object({
  userId: userIdSchema,
  nationalId: nationalIdSchema,
});

// التقييم الشامل للعميل
export const customerEvaluateSchema = z.object({
  userId: userIdSchema,
  nationalId: nationalIdSchema,
});

// ==========================================
// مخططات سنافي - دعم قرار الشراء الذكي
// ==========================================

// طلب جلسة دعم قرار
export const decisionSupportRequestSchema = z.object({
  userId: userIdSchema,
  vehicle: z.object({
    vehicleId: z.string().min(1, "معرف المركبة مطلوب"),
    make: z.string().optional(),
    model: z.string().optional(),
    tankCapacity: z.number().min(10).max(200, "سعة التانكي يجب أن تكون بين 10 و 200 لتر"),
  }),
  currentFuelPercentage: z.number().min(0).max(100, "نسبة الوقود يجب أن تكون بين 0 و 100"),
  fuelType: z.enum(["91", "95", "diesel"], { errorMap: () => ({ message: "نوع الوقود غير صحيح" }) }),
  targetFuelPercentage: z.number().min(0).max(100).optional().default(100),
});

// قبول التوصية
export const acceptRecommendationSchema = z.object({
  decisionSupportId: z.string().min(1, "معرف جلسة دعم القرار مطلوب"),
  invoiceId: z.string().min(1, "معرف الفاتورة مطلوب"),
});

// تسجيل التعبئة الفعلية
export const recordActualRefuelingSchema = z.object({
  decisionSupportId: z.string().min(1, "معرف جلسة دعم القرار مطلوب"),
  actualLiters: z.number().min(1, "عدد اللترات يجب أن يكون أكبر من 0"),
  actualCost: z.number().min(0, "التكلفة يجب أن تكون أكبر من 0"),
  userFeedback: z.number().min(1).max(5).optional(),
});

// تحديث سعر الوقود
export const updateFuelPriceSchema = z.object({
  fuelType: z.enum(["91", "95", "diesel"]),
  pricePerLiter: z.number().min(0.1).max(10, "السعر يجب أن يكون بين 0.1 و 10 ريال"),
  source: z.string().optional().default("system"),
});

// Types
export type NafathInitiateInput = z.infer<typeof nafathInitiateSchema>;
export type NafathSimulateInput = z.infer<typeof nafathSimulateSchema>;
export type ComplianceCheckInput = z.infer<typeof complianceCheckSchema>;
export type CreditReportInput = z.infer<typeof creditReportSchema>;
export type CreditEvaluateInput = z.infer<typeof creditEvaluateSchema>;
export type EmploymentVerifyInput = z.infer<typeof employmentVerifySchema>;
export type CustomerEvaluateInput = z.infer<typeof customerEvaluateSchema>;
export type DecisionSupportRequestInput = z.infer<typeof decisionSupportRequestSchema>;
export type AcceptRecommendationInput = z.infer<typeof acceptRecommendationSchema>;
export type RecordActualRefuelingInput = z.infer<typeof recordActualRefuelingSchema>;
export type UpdateFuelPriceInput = z.infer<typeof updateFuelPriceSchema>;
