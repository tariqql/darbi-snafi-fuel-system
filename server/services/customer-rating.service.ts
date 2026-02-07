/**
 * خدمة تقييم العميل الشاملة
 * Customer Rating & Scoring Service
 * 
 * تجمع جميع التحققات والتقييمات في تصنيف شامل للعميل
 */

import { db } from "../db";
import { customerRatings, users, PriorityLevels } from "@shared/schema";
import { eq } from "drizzle-orm";
import { nafathService } from "./nafath.service";
import { complianceService } from "./compliance.service";
import { creditService } from "./credit.service";
import { employmentService } from "./employment.service";

interface CustomerEvaluationResult {
  success: boolean;
  userId: string;
  overallScore: number;
  priorityLevel: string;
  checks: {
    nafathVerified: boolean;
    kycPassed: boolean;
    creditApproved: boolean;
    ageVerified: boolean;
    isEmployee: boolean;
  };
  scores: {
    employment: number;
    credit: number;
    compliance: number;
  };
  recommendation: {
    creditLimit: number;
    maxInstallments: number;
    eligible: boolean;
    reasons: string[];
  };
}

interface QuickCheckResult {
  canProceed: boolean;
  blockers: string[];
  warnings: string[];
}

/**
 * فئة خدمة تقييم العميل
 */
export class CustomerRatingService {
  /**
   * إجراء تقييم شامل للعميل
   */
  async performFullEvaluation(userId: string, nationalId: string): Promise<CustomerEvaluationResult> {
    const reasons: string[] = [];
    let overallScore = 0;
    let eligible = true;

    // 1. التحقق من الهوية عبر نفاذ
    const nafathCheck = await nafathService.getLastVerification(userId);
    const nafathVerified = nafathCheck?.status === "verified";
    if (!nafathVerified) {
      reasons.push("لم يتم التحقق من الهوية عبر نفاذ");
      eligible = false;
    } else {
      overallScore += 20;
    }

    // 2. التحقق من العمر
    const ageCheck = await nafathService.verifyAge(userId);
    const ageVerified = ageCheck.passed;
    if (!ageVerified) {
      reasons.push(ageCheck.message);
      eligible = false;
    } else {
      overallScore += 10;
    }

    // 3. فحص الامتثال KYC/AML
    const complianceCheck = await complianceService.getLastCheck(userId);
    const kycPassed = complianceCheck?.isPassed ?? false;
    const complianceScore = kycPassed ? 100 : 0;
    if (!kycPassed) {
      reasons.push("لم يجتز فحص الامتثال");
      eligible = false;
    } else {
      overallScore += 20;
    }

    // 4. فحص السجل الائتماني
    const creditReport = await creditService.getLastReport(userId);
    const creditApproved = creditReport && (creditReport.defaultedLoans || 0) === 0;
    const creditScore = creditReport?.simahScore || 0;
    if (!creditApproved) {
      reasons.push("يوجد متعثرات في السجل الائتماني");
      eligible = false;
    } else if (creditScore < 500) {
      reasons.push("درجة الائتمان منخفضة");
      eligible = false;
    } else {
      overallScore += 25;
    }

    // 5. التحقق من التوظيف والأولوية
    const employmentRecord = await employmentService.getEmploymentRecord(userId);
    const isEmployee = employmentRecord?.isVerified ?? false;
    const priority = await employmentService.calculatePriority(userId);
    const employmentScore = priority.priorityScore;
    
    if (isEmployee) {
      overallScore += 25;
      reasons.push(`مستوى الأولوية: ${this.translatePriorityLevel(priority.priorityLevel)}`);
    }

    // حساب الحد الائتماني الموصى به
    let recommendedLimit = 0;
    let maxInstallments = 3;

    if (eligible) {
      recommendedLimit = creditService.calculateRecommendedLimit(
        creditScore,
        employmentRecord?.monthlySalary || 5000,
        creditReport?.totalDebts || 0,
        isEmployee
      );
      recommendedLimit *= priority.creditMultiplier;
      maxInstallments = priority.maxInstallmentMonths;
      reasons.push("مؤهل للتمويل");
    }

    // تحديد مستوى الأولوية النهائي
    const priorityLevel = this.determinePriorityLevel(overallScore, eligible);

    // حفظ التقييم
    await this.saveRating(userId, {
      overallScore,
      nafathVerified,
      kycPassed,
      creditApproved,
      ageVerified,
      isEmployee,
      employmentScore,
      creditScore,
      complianceScore,
      priorityLevel,
      recommendedCreditLimit: recommendedLimit,
      maxInstallmentMonths: maxInstallments,
    });

    return {
      success: true,
      userId,
      overallScore,
      priorityLevel,
      checks: {
        nafathVerified,
        kycPassed,
        creditApproved,
        ageVerified,
        isEmployee,
      },
      scores: {
        employment: employmentScore,
        credit: creditScore,
        compliance: complianceScore,
      },
      recommendation: {
        creditLimit: Math.round(recommendedLimit),
        maxInstallments,
        eligible,
        reasons,
      },
    };
  }

  /**
   * فحص سريع للأهلية
   */
  async quickEligibilityCheck(userId: string): Promise<QuickCheckResult> {
    const blockers: string[] = [];
    const warnings: string[] = [];

    // جلب التقييم المحفوظ
    const [rating] = await db
      .select()
      .from(customerRatings)
      .where(eq(customerRatings.userId, userId));

    if (!rating) {
      blockers.push("لم يتم تقييم العميل بعد");
      return { canProceed: false, blockers, warnings };
    }

    // التحقق من المتطلبات الأساسية
    if (!rating.nafathVerified) {
      blockers.push("لم يتم التحقق من الهوية");
    }

    if (!rating.ageVerified) {
      blockers.push("العمر أقل من 18 سنة");
    }

    if (!rating.kycPassed) {
      blockers.push("لم يجتز فحص الامتثال");
    }

    if (!rating.creditApproved) {
      blockers.push("السجل الائتماني غير مقبول");
    }

    // تحذيرات (لا تمنع لكن تؤثر على الحد)
    if (!rating.isEmployee) {
      warnings.push("غير موظف - حد ائتماني مخفض");
    }

    if (rating.priorityLevel === PriorityLevels.RESTRICTED) {
      warnings.push("مستوى أولوية منخفض");
    }

    return {
      canProceed: blockers.length === 0,
      blockers,
      warnings,
    };
  }

  /**
   * الحصول على تقييم العميل
   */
  async getRating(userId: string) {
    const [rating] = await db
      .select()
      .from(customerRatings)
      .where(eq(customerRatings.userId, userId));

    return rating;
  }

  /**
   * حفظ أو تحديث تقييم العميل
   */
  private async saveRating(userId: string, data: any) {
    const existing = await this.getRating(userId);

    if (existing) {
      await db
        .update(customerRatings)
        .set({
          ...data,
          lastUpdated: new Date(),
        })
        .where(eq(customerRatings.userId, userId));
    } else {
      await db.insert(customerRatings).values({
        userId,
        ...data,
      });
    }
  }

  /**
   * تحديد مستوى الأولوية بناءً على النقاط
   */
  private determinePriorityLevel(score: number, eligible: boolean): string {
    if (!eligible) return PriorityLevels.BLOCKED;
    
    if (score >= 85) return PriorityLevels.PREMIUM;
    if (score >= 70) return PriorityLevels.HIGH;
    if (score >= 50) return PriorityLevels.STANDARD;
    if (score >= 30) return PriorityLevels.RESTRICTED;
    return PriorityLevels.BLOCKED;
  }

  /**
   * ترجمة مستوى الأولوية
   */
  private translatePriorityLevel(level: string): string {
    const translations: Record<string, string> = {
      [PriorityLevels.PREMIUM]: "مميز",
      [PriorityLevels.HIGH]: "عالي",
      [PriorityLevels.STANDARD]: "عادي",
      [PriorityLevels.RESTRICTED]: "محدود",
      [PriorityLevels.BLOCKED]: "محظور",
    };
    return translations[level] || level;
  }

  /**
   * تحديث حالة التحقق الفردية
   */
  async updateVerificationStatus(
    userId: string,
    field: keyof typeof customerRatings.$inferSelect,
    value: boolean | number
  ) {
    const existing = await this.getRating(userId);
    
    if (existing) {
      await db
        .update(customerRatings)
        .set({
          [field]: value,
          lastUpdated: new Date(),
        })
        .where(eq(customerRatings.userId, userId));
    }
  }
}

export const customerRatingService = new CustomerRatingService();
