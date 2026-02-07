/**
 * خدمة فحص السجل الائتماني
 * SIMAH Credit Bureau Service
 * 
 * سمة هي شركة المعلومات الائتمانية السعودية
 * توفر معلومات عن السجل الائتماني للأفراد والشركات
 */

import { db } from "../db";
import { creditReports, customerRatings, CreditRiskCategories } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

interface CreditScore {
  score: number;
  category: string;
  description: string;
}

interface CreditReportResult {
  success: boolean;
  score: CreditScore;
  totalDebts: number;
  activeLoans: number;
  delayedPayments: number;
  defaultedLoans: number;
  creditUtilization: number;
  recommendedLimit: number;
  riskCategory: string;
  message: string;
}

interface SimahConfig {
  apiUrl: string;
  apiKey: string;
  memberId: string;
}

/**
 * فئة خدمة سمة الائتمانية
 */
export class CreditService {
  private config: SimahConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.SIMAH_API_URL || "https://api.simah.com/v1",
      apiKey: process.env.SIMAH_API_KEY || "",
      memberId: process.env.SIMAH_MEMBER_ID || "",
    };
  }

  /**
   * جلب التقرير الائتماني للعميل
   */
  async getCreditReport(userId: string, nationalId: string): Promise<CreditReportResult> {
    try {
      // في الإنتاج: الربط مع API سمة الفعلي
      // هنا نحاكي الاستجابة للتطوير
      
      const mockReport = this.generateMockReport(nationalId);

      // حفظ التقرير في قاعدة البيانات
      await db.insert(creditReports).values({
        userId,
        nationalId,
        simahScore: mockReport.score.score,
        totalDebts: mockReport.totalDebts,
        activeLoans: mockReport.activeLoans,
        delayedPayments: mockReport.delayedPayments,
        defaultedLoans: mockReport.defaultedLoans,
        creditUtilization: mockReport.creditUtilization,
        riskCategory: mockReport.riskCategory,
        recommendedLimit: mockReport.recommendedLimit,
        paymentHistory: { months: this.generatePaymentHistory() },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // صالح لـ 30 يوم
      });

      return mockReport;
    } catch (error) {
      console.error("Credit report error:", error);
      return {
        success: false,
        score: { score: 0, category: "unknown", description: "خطأ" },
        totalDebts: 0,
        activeLoans: 0,
        delayedPayments: 0,
        defaultedLoans: 0,
        creditUtilization: 0,
        recommendedLimit: 0,
        riskCategory: CreditRiskCategories.POOR,
        message: "حدث خطأ أثناء جلب التقرير الائتماني",
      };
    }
  }

  /**
   * تقييم أهلية العميل للتمويل
   */
  async evaluateCreditEligibility(
    userId: string,
    requestedAmount: number
  ): Promise<{
    eligible: boolean;
    approvedAmount: number;
    maxInstallments: number;
    interestRate: number;
    reasons: string[];
  }> {
    const [report] = await db
      .select()
      .from(creditReports)
      .where(eq(creditReports.userId, userId))
      .orderBy(creditReports.reportDate);

    if (!report) {
      return {
        eligible: false,
        approvedAmount: 0,
        maxInstallments: 0,
        interestRate: 0,
        reasons: ["لم يتم العثور على تقرير ائتماني. يرجى إجراء فحص ائتماني أولاً."],
      };
    }

    const reasons: string[] = [];
    let eligible = true;
    let approvedAmount = requestedAmount;
    let maxInstallments = 12;
    let interestRate = 0; // بدون فوائد - تمويل إسلامي

    // قواعد التقييم
    if (report.defaultedLoans && report.defaultedLoans > 0) {
      eligible = false;
      reasons.push("يوجد قروض متعثرة في السجل");
    }

    if (report.delayedPayments && report.delayedPayments > 3) {
      approvedAmount = Math.min(approvedAmount, (report.recommendedLimit || 1000) * 0.5);
      maxInstallments = 3;
      reasons.push("سجل تأخر في السداد - تم تخفيض الحد");
    }

    if (report.simahScore && report.simahScore < 500) {
      eligible = false;
      reasons.push("درجة الائتمان منخفضة جداً");
    } else if (report.simahScore && report.simahScore < 600) {
      approvedAmount = Math.min(approvedAmount, (report.recommendedLimit || 1000) * 0.7);
      maxInstallments = 6;
      reasons.push("درجة ائتمان متوسطة - حد مخفض");
    }

    if (report.creditUtilization && report.creditUtilization > 80) {
      approvedAmount = Math.min(approvedAmount, (report.recommendedLimit || 1000) * 0.3);
      reasons.push("نسبة استخدام الائتمان مرتفعة");
    }

    // التأكد من عدم تجاوز الحد الموصى به
    if (report.recommendedLimit) {
      approvedAmount = Math.min(approvedAmount, report.recommendedLimit);
    }

    if (eligible && reasons.length === 0) {
      reasons.push("مؤهل للتمويل بالكامل");
    }

    return {
      eligible,
      approvedAmount: Math.round(approvedAmount * 100) / 100,
      maxInstallments,
      interestRate,
      reasons,
    };
  }

  /**
   * التحقق من وجود متعثرات
   */
  async hasDefaultedLoans(userId: string): Promise<{ hasDefaults: boolean; count: number; message: string }> {
    const [report] = await db
      .select()
      .from(creditReports)
      .where(eq(creditReports.userId, userId))
      .orderBy(creditReports.reportDate);

    if (!report) {
      return {
        hasDefaults: false,
        count: 0,
        message: "لا يوجد تقرير ائتماني",
      };
    }

    const hasDefaults = (report.defaultedLoans || 0) > 0;

    return {
      hasDefaults,
      count: report.defaultedLoans || 0,
      message: hasDefaults
        ? `يوجد ${report.defaultedLoans} قرض متعثر`
        : "لا توجد قروض متعثرة",
    };
  }

  /**
   * حساب الحد الائتماني الموصى به
   */
  calculateRecommendedLimit(
    simahScore: number,
    monthlySalary: number,
    existingDebts: number,
    isEmployee: boolean
  ): number {
    let baseLimit = monthlySalary * 2; // الحد الأساسي ضعف الراتب

    // تعديل بناءً على درجة سمة
    if (simahScore >= 750) {
      baseLimit *= 1.5;
    } else if (simahScore >= 650) {
      baseLimit *= 1.2;
    } else if (simahScore >= 550) {
      baseLimit *= 0.8;
    } else {
      baseLimit *= 0.5;
    }

    // خصم الديون الحالية
    baseLimit = Math.max(0, baseLimit - existingDebts);

    // مكافأة للموظفين
    if (isEmployee) {
      baseLimit *= 1.2;
    }

    // حد أقصى
    const maxLimit = 10000;
    return Math.min(Math.round(baseLimit), maxLimit);
  }

  /**
   * تصنيف درجة الائتمان
   */
  classifyScore(score: number): CreditScore {
    if (score >= 750) {
      return {
        score,
        category: CreditRiskCategories.EXCELLENT,
        description: "ممتاز - سجل ائتماني مثالي",
      };
    } else if (score >= 650) {
      return {
        score,
        category: CreditRiskCategories.GOOD,
        description: "جيد - سجل ائتماني قوي",
      };
    } else if (score >= 550) {
      return {
        score,
        category: CreditRiskCategories.FAIR,
        description: "مقبول - يحتاج تحسين",
      };
    } else if (score >= 400) {
      return {
        score,
        category: CreditRiskCategories.POOR,
        description: "ضعيف - مخاطر عالية",
      };
    } else {
      return {
        score,
        category: CreditRiskCategories.DEFAULTER,
        description: "متعثر - غير مؤهل للتمويل",
      };
    }
  }

  /**
   * محاكاة تقرير ائتماني (للتطوير)
   */
  private generateMockReport(nationalId: string): CreditReportResult {
    // استخدام آخر رقمين من الهوية لتوليد درجات مختلفة
    const lastDigits = parseInt(nationalId.slice(-2)) || 50;
    const baseScore = 400 + Math.floor(lastDigits * 4.5); // 400-850
    
    const scoreInfo = this.classifyScore(baseScore);
    const totalDebts = Math.floor(Math.random() * 50000);
    const activeLoans = Math.floor(Math.random() * 3);
    const delayedPayments = baseScore < 600 ? Math.floor(Math.random() * 3) : 0;
    const defaultedLoans = baseScore < 450 ? 1 : 0;
    const creditUtilization = Math.floor(Math.random() * 80);

    const recommendedLimit = this.calculateRecommendedLimit(
      baseScore,
      10000, // راتب افتراضي
      totalDebts,
      true
    );

    return {
      success: true,
      score: scoreInfo,
      totalDebts,
      activeLoans,
      delayedPayments,
      defaultedLoans,
      creditUtilization,
      recommendedLimit,
      riskCategory: scoreInfo.category,
      message: `تقرير ائتماني - ${scoreInfo.description}`,
    };
  }

  /**
   * توليد سجل المدفوعات (للتطوير)
   */
  private generatePaymentHistory(): { month: string; status: string }[] {
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];
    return months.map((month) => ({
      month,
      status: Math.random() > 0.1 ? "on_time" : "late",
    }));
  }

  /**
   * الحصول على آخر تقرير للمستخدم
   */
  async getLastReport(userId: string) {
    const results = await db
      .select()
      .from(creditReports)
      .where(eq(creditReports.userId, userId))
      .orderBy(sql`${creditReports.reportDate} DESC`)
      .limit(1);
    
    return results[0] || null;
  }
}

export const creditService = new CreditService();
