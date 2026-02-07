/**
 * خدمة التحقق من التوظيف وأولوية الموظفين
 * Employment Verification & Priority Service
 * 
 * تتضمن:
 * - التحقق من بيانات التوظيف عبر GOSI
 * - تحديد نوع جهة العمل
 * - حساب أولوية التمويل للموظفين
 */

import { db } from "../db";
import { employmentRecords, customerRatings, EmployerTypes, PriorityLevels } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

interface EmploymentVerificationResult {
  success: boolean;
  isEmployed: boolean;
  employerName?: string;
  employerType?: string;
  jobTitle?: string;
  monthlySalary?: number;
  employmentDuration?: number;
  gosiRegistered?: boolean;
  priorityScore: number;
  message: string;
}

interface PriorityCalculation {
  priorityLevel: string;
  priorityScore: number;
  creditMultiplier: number;
  maxInstallmentMonths: number;
  reasons: string[];
}

/**
 * فئة خدمة التوظيف
 */
export class EmploymentService {
  /**
   * التحقق من بيانات التوظيف
   */
  async verifyEmployment(userId: string, nationalId: string): Promise<EmploymentVerificationResult> {
    try {
      // في الإنتاج: الربط مع API التأمينات الاجتماعية (GOSI)
      // هنا نحاكي الاستجابة للتطوير
      
      const mockEmployment = this.generateMockEmployment(nationalId);

      // حفظ بيانات التوظيف
      await db.insert(employmentRecords).values({
        userId,
        nationalId,
        employerName: mockEmployment.employerName,
        employerType: mockEmployment.employerType,
        jobTitle: mockEmployment.jobTitle,
        monthlySalary: mockEmployment.monthlySalary,
        employmentStartDate: mockEmployment.startDate,
        isVerified: true,
        gosiRegistered: mockEmployment.gosiRegistered,
        sector: mockEmployment.sector,
        verificationSource: "GOSI",
        verifiedAt: new Date(),
      });

      const priorityScore = this.calculateEmploymentPriorityScore(mockEmployment);

      return {
        success: true,
        isEmployed: mockEmployment.isEmployed,
        employerName: mockEmployment.employerName,
        employerType: mockEmployment.employerType,
        jobTitle: mockEmployment.jobTitle,
        monthlySalary: mockEmployment.monthlySalary,
        employmentDuration: mockEmployment.durationMonths,
        gosiRegistered: mockEmployment.gosiRegistered,
        priorityScore,
        message: mockEmployment.isEmployed ? "تم التحقق من التوظيف" : "غير موظف حالياً",
      };
    } catch (error) {
      console.error("Employment verification error:", error);
      return {
        success: false,
        isEmployed: false,
        priorityScore: 0,
        message: "حدث خطأ أثناء التحقق من التوظيف",
      };
    }
  }

  /**
   * حساب أولوية العميل للتمويل
   */
  async calculatePriority(userId: string): Promise<PriorityCalculation> {
    const [employment] = await db
      .select()
      .from(employmentRecords)
      .where(eq(employmentRecords.userId, userId))
      .orderBy(employmentRecords.createdAt);

    const reasons: string[] = [];
    let priorityScore = 50; // نقطة البداية
    let creditMultiplier = 1.0;
    let maxInstallmentMonths = 3;

    if (!employment) {
      return {
        priorityLevel: PriorityLevels.RESTRICTED,
        priorityScore: 30,
        creditMultiplier: 0.5,
        maxInstallmentMonths: 2,
        reasons: ["لم يتم التحقق من التوظيف"],
      };
    }

    // نقاط بناءً على نوع جهة العمل
    switch (employment.employerType) {
      case EmployerTypes.GOVERNMENT:
        priorityScore += 30;
        creditMultiplier = 1.5;
        maxInstallmentMonths = 12;
        reasons.push("موظف حكومي - أولوية عالية");
        break;
      case EmployerTypes.SEMI_GOVERNMENT:
        priorityScore += 25;
        creditMultiplier = 1.4;
        maxInstallmentMonths = 10;
        reasons.push("موظف شبه حكومي - أولوية عالية");
        break;
      case EmployerTypes.PRIVATE_LARGE:
        priorityScore += 20;
        creditMultiplier = 1.3;
        maxInstallmentMonths = 8;
        reasons.push("موظف قطاع خاص كبير");
        break;
      case EmployerTypes.PRIVATE_SME:
        priorityScore += 10;
        creditMultiplier = 1.1;
        maxInstallmentMonths = 6;
        reasons.push("موظف قطاع خاص");
        break;
      case EmployerTypes.SELF_EMPLOYED:
        priorityScore += 5;
        creditMultiplier = 0.9;
        maxInstallmentMonths = 4;
        reasons.push("عمل حر");
        break;
      default:
        priorityScore -= 10;
        creditMultiplier = 0.7;
        maxInstallmentMonths = 3;
        reasons.push("حالة توظيف غير محددة");
    }

    // نقاط إضافية لمسجلي التأمينات
    if (employment.gosiRegistered) {
      priorityScore += 10;
      reasons.push("مسجل في التأمينات الاجتماعية");
    }

    // نقاط بناءً على الراتب
    if (employment.monthlySalary) {
      if (employment.monthlySalary >= 15000) {
        priorityScore += 15;
        reasons.push("راتب مرتفع");
      } else if (employment.monthlySalary >= 10000) {
        priorityScore += 10;
        reasons.push("راتب جيد");
      } else if (employment.monthlySalary >= 5000) {
        priorityScore += 5;
      }
    }

    // تحديد مستوى الأولوية
    let priorityLevel: string;
    if (priorityScore >= 80) {
      priorityLevel = PriorityLevels.PREMIUM;
    } else if (priorityScore >= 65) {
      priorityLevel = PriorityLevels.HIGH;
    } else if (priorityScore >= 45) {
      priorityLevel = PriorityLevels.STANDARD;
    } else if (priorityScore >= 30) {
      priorityLevel = PriorityLevels.RESTRICTED;
    } else {
      priorityLevel = PriorityLevels.BLOCKED;
    }

    return {
      priorityLevel,
      priorityScore,
      creditMultiplier,
      maxInstallmentMonths,
      reasons,
    };
  }

  /**
   * حساب نقاط الأولوية من بيانات التوظيف
   */
  private calculateEmploymentPriorityScore(employment: any): number {
    let score = 0;

    if (!employment.isEmployed) return 0;

    // نوع جهة العمل
    switch (employment.employerType) {
      case EmployerTypes.GOVERNMENT:
        score += 40;
        break;
      case EmployerTypes.SEMI_GOVERNMENT:
        score += 35;
        break;
      case EmployerTypes.PRIVATE_LARGE:
        score += 25;
        break;
      case EmployerTypes.PRIVATE_SME:
        score += 15;
        break;
      default:
        score += 5;
    }

    // مدة العمل
    if (employment.durationMonths >= 36) {
      score += 20;
    } else if (employment.durationMonths >= 24) {
      score += 15;
    } else if (employment.durationMonths >= 12) {
      score += 10;
    }

    // التسجيل في التأمينات
    if (employment.gosiRegistered) {
      score += 15;
    }

    // الراتب
    if (employment.monthlySalary >= 15000) {
      score += 15;
    } else if (employment.monthlySalary >= 10000) {
      score += 10;
    } else if (employment.monthlySalary >= 5000) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * محاكاة بيانات التوظيف (للتطوير)
   */
  private generateMockEmployment(nationalId: string): any {
    // استخدام الهوية لتوليد سيناريوهات مختلفة
    const lastDigit = parseInt(nationalId.slice(-1)) || 0;
    
    const employerTypes = [
      { type: EmployerTypes.GOVERNMENT, name: "وزارة الصحة", sector: "حكومي" },
      { type: EmployerTypes.SEMI_GOVERNMENT, name: "أرامكو السعودية", sector: "شبه حكومي" },
      { type: EmployerTypes.PRIVATE_LARGE, name: "شركة الراجحي المصرفية", sector: "مالي" },
      { type: EmployerTypes.PRIVATE_SME, name: "شركة التقنية الحديثة", sector: "تقنية" },
      { type: EmployerTypes.SELF_EMPLOYED, name: "عمل حر", sector: "حر" },
    ];

    const employerIndex = lastDigit % employerTypes.length;
    const employer = employerTypes[employerIndex];
    const isEmployed = lastDigit < 8; // 80% موظفين

    const salaries = [5000, 7000, 10000, 12000, 15000, 20000, 25000];
    const monthlySalary = salaries[lastDigit % salaries.length];

    return {
      isEmployed,
      employerName: isEmployed ? employer.name : null,
      employerType: isEmployed ? employer.type : EmployerTypes.UNEMPLOYED,
      jobTitle: isEmployed ? "موظف" : null,
      monthlySalary: isEmployed ? monthlySalary : 0,
      startDate: isEmployed ? new Date(Date.now() - (12 + lastDigit * 6) * 30 * 24 * 60 * 60 * 1000) : null,
      durationMonths: isEmployed ? 12 + lastDigit * 6 : 0,
      gosiRegistered: isEmployed && employer.type !== EmployerTypes.SELF_EMPLOYED,
      sector: employer.sector,
    };
  }

  /**
   * الحصول على بيانات التوظيف للمستخدم
   */
  async getEmploymentRecord(userId: string) {
    const results = await db
      .select()
      .from(employmentRecords)
      .where(eq(employmentRecords.userId, userId))
      .orderBy(sql`${employmentRecords.createdAt} DESC`)
      .limit(1);
    
    return results[0] || null;
  }

  /**
   * التحقق من أهلية الموظف للتمويل المميز
   */
  async isEligibleForPremiumFinancing(userId: string): Promise<boolean> {
    const priority = await this.calculatePriority(userId);
    return priority.priorityLevel === PriorityLevels.PREMIUM || priority.priorityLevel === PriorityLevels.HIGH;
  }
}

export const employmentService = new EmploymentService();
