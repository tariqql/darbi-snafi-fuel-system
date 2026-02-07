/**
 * خدمة فحص الامتثال والقضايا (KYC/AML)
 * Know Your Customer / Anti-Money Laundering Service
 * 
 * تتضمن الفحوصات:
 * - فحص قوائم المطلوبين
 * - فحص العقوبات والقيود
 * - فحص الشخصيات السياسية البارزة (PEP)
 * - فحص قوائم الإرهاب
 */

import { db } from "../db";
import { complianceChecks, ComplianceCheckTypes, RiskLevels } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

interface ComplianceResult {
  passed: boolean;
  riskLevel: string;
  findings: ComplianceFinding[];
  message: string;
}

interface ComplianceFinding {
  checkType: string;
  status: "clear" | "match" | "review";
  details?: string;
  matchScore?: number;
}

interface FullComplianceReport {
  userId: string;
  overallPassed: boolean;
  overallRiskLevel: string;
  checks: {
    wantedList: ComplianceResult;
    sanctions: ComplianceResult;
    pep: ComplianceResult;
    aml: ComplianceResult;
  };
  recommendations: string[];
  createdAt: Date;
}

/**
 * فئة خدمة الامتثال
 */
export class ComplianceService {
  /**
   * إجراء فحص شامل للعميل
   */
  async performFullCheck(userId: string, nationalId: string): Promise<FullComplianceReport> {
    const [wantedList, sanctions, pep, aml] = await Promise.all([
      this.checkWantedList(userId, nationalId),
      this.checkSanctions(userId, nationalId),
      this.checkPEP(userId, nationalId),
      this.checkAML(userId, nationalId),
    ]);

    const overallPassed = wantedList.passed && sanctions.passed && pep.passed && aml.passed;
    const overallRiskLevel = this.calculateOverallRisk([wantedList, sanctions, pep, aml]);

    const recommendations = this.generateRecommendations(overallRiskLevel, {
      wantedList,
      sanctions,
      pep,
      aml,
    });

    // حفظ النتيجة الشاملة
    await db.insert(complianceChecks).values({
      userId,
      nationalId,
      checkType: "full_kyc",
      isPassed: overallPassed,
      riskLevel: overallRiskLevel,
      findings: { wantedList, sanctions, pep, aml },
      pepStatus: !pep.passed,
      sanctionsMatch: !sanctions.passed,
      wantedListMatch: !wantedList.passed,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // صالح لـ 90 يوم
    });

    return {
      userId,
      overallPassed,
      overallRiskLevel,
      checks: { wantedList, sanctions, pep, aml },
      recommendations,
      createdAt: new Date(),
    };
  }

  /**
   * فحص قوائم المطلوبين
   */
  async checkWantedList(userId: string, nationalId: string): Promise<ComplianceResult> {
    try {
      // في الإنتاج: الربط مع API وزارة الداخلية أو الجهات المختصة
      // هنا نحاكي الفحص
      const findings: ComplianceFinding[] = [];
      
      // محاكاة الفحص - في الإنتاج سيتم الاتصال بـ API حقيقي
      const isOnWantedList = false; // محاكاة: المستخدم غير مطلوب
      
      findings.push({
        checkType: ComplianceCheckTypes.WANTED_LIST,
        status: isOnWantedList ? "match" : "clear",
        details: isOnWantedList ? "تم العثور على تطابق في قوائم المطلوبين" : "لا يوجد تطابق",
      });

      await this.saveCheck(userId, nationalId, ComplianceCheckTypes.WANTED_LIST, !isOnWantedList, findings);

      return {
        passed: !isOnWantedList,
        riskLevel: isOnWantedList ? RiskLevels.CRITICAL : RiskLevels.LOW,
        findings,
        message: isOnWantedList ? "مطابقة في قوائم المطلوبين" : "لا توجد قيود",
      };
    } catch (error) {
      console.error("Wanted list check error:", error);
      return {
        passed: false,
        riskLevel: RiskLevels.HIGH,
        findings: [],
        message: "حدث خطأ أثناء الفحص",
      };
    }
  }

  /**
   * فحص قوائم العقوبات الدولية
   */
  async checkSanctions(userId: string, nationalId: string): Promise<ComplianceResult> {
    try {
      // في الإنتاج: الربط مع قوائم OFAC, UN, EU
      const findings: ComplianceFinding[] = [];
      
      const isOnSanctionsList = false; // محاكاة
      
      findings.push({
        checkType: ComplianceCheckTypes.SANCTIONS,
        status: isOnSanctionsList ? "match" : "clear",
        details: isOnSanctionsList ? "تطابق مع قوائم العقوبات" : "لا يوجد تطابق",
      });

      await this.saveCheck(userId, nationalId, ComplianceCheckTypes.SANCTIONS, !isOnSanctionsList, findings);

      return {
        passed: !isOnSanctionsList,
        riskLevel: isOnSanctionsList ? RiskLevels.CRITICAL : RiskLevels.LOW,
        findings,
        message: isOnSanctionsList ? "مطابقة في قوائم العقوبات" : "لا توجد عقوبات",
      };
    } catch (error) {
      console.error("Sanctions check error:", error);
      return {
        passed: false,
        riskLevel: RiskLevels.HIGH,
        findings: [],
        message: "حدث خطأ أثناء الفحص",
      };
    }
  }

  /**
   * فحص الشخصيات السياسية البارزة
   */
  async checkPEP(userId: string, nationalId: string): Promise<ComplianceResult> {
    try {
      // في الإنتاج: الربط مع قواعد بيانات PEP
      const findings: ComplianceFinding[] = [];
      
      const isPEP = false; // محاكاة
      
      findings.push({
        checkType: ComplianceCheckTypes.PEP,
        status: isPEP ? "review" : "clear",
        details: isPEP ? "شخصية سياسية بارزة - يتطلب مراجعة إضافية" : "ليس شخصية سياسية",
      });

      // PEP ليس رفضاً تلقائياً، لكن يتطلب مراجعة معززة
      await this.saveCheck(userId, nationalId, ComplianceCheckTypes.PEP, true, findings);

      return {
        passed: true, // PEP لا يمنع، لكن يرفع مستوى المخاطر
        riskLevel: isPEP ? RiskLevels.MEDIUM : RiskLevels.LOW,
        findings,
        message: isPEP ? "شخصية سياسية - مراجعة معززة" : "ليس شخصية سياسية",
      };
    } catch (error) {
      console.error("PEP check error:", error);
      return {
        passed: false,
        riskLevel: RiskLevels.HIGH,
        findings: [],
        message: "حدث خطأ أثناء الفحص",
      };
    }
  }

  /**
   * فحص غسيل الأموال
   */
  async checkAML(userId: string, nationalId: string): Promise<ComplianceResult> {
    try {
      // في الإنتاج: تحليل المعاملات والأنماط المشبوهة
      const findings: ComplianceFinding[] = [];
      
      const hasAMLFlags = false; // محاكاة
      
      findings.push({
        checkType: ComplianceCheckTypes.AML,
        status: hasAMLFlags ? "review" : "clear",
        details: hasAMLFlags ? "توجد علامات تحتاج مراجعة" : "لا توجد علامات مشبوهة",
      });

      await this.saveCheck(userId, nationalId, ComplianceCheckTypes.AML, !hasAMLFlags, findings);

      return {
        passed: !hasAMLFlags,
        riskLevel: hasAMLFlags ? RiskLevels.HIGH : RiskLevels.LOW,
        findings,
        message: hasAMLFlags ? "يتطلب مراجعة AML" : "لا توجد مخاطر AML",
      };
    } catch (error) {
      console.error("AML check error:", error);
      return {
        passed: false,
        riskLevel: RiskLevels.HIGH,
        findings: [],
        message: "حدث خطأ أثناء الفحص",
      };
    }
  }

  /**
   * حفظ نتيجة الفحص
   */
  private async saveCheck(
    userId: string,
    nationalId: string,
    checkType: string,
    passed: boolean,
    findings: ComplianceFinding[]
  ) {
    await db.insert(complianceChecks).values({
      userId,
      nationalId,
      checkType,
      isPassed: passed,
      riskLevel: passed ? RiskLevels.LOW : RiskLevels.HIGH,
      findings,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  /**
   * حساب مستوى المخاطر الإجمالي
   */
  private calculateOverallRisk(results: ComplianceResult[]): string {
    const riskOrder = [RiskLevels.LOW, RiskLevels.MEDIUM, RiskLevels.HIGH, RiskLevels.CRITICAL];
    let maxRiskIndex = 0;

    for (const result of results) {
      const index = riskOrder.indexOf(result.riskLevel as typeof riskOrder[number]);
      if (index > maxRiskIndex) {
        maxRiskIndex = index;
      }
    }

    return riskOrder[maxRiskIndex];
  }

  /**
   * إنشاء التوصيات بناءً على النتائج
   */
  private generateRecommendations(
    riskLevel: string,
    checks: { wantedList: ComplianceResult; sanctions: ComplianceResult; pep: ComplianceResult; aml: ComplianceResult }
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === RiskLevels.CRITICAL) {
      recommendations.push("يجب رفض العميل فوراً");
      recommendations.push("إبلاغ الجهات المختصة");
    } else if (riskLevel === RiskLevels.HIGH) {
      recommendations.push("يتطلب مراجعة يدوية من فريق الامتثال");
      recommendations.push("طلب مستندات إضافية");
    } else if (riskLevel === RiskLevels.MEDIUM) {
      recommendations.push("مراقبة معززة للمعاملات");
      recommendations.push("مراجعة دورية كل 6 أشهر");
    } else {
      recommendations.push("يمكن المتابعة مع المراقبة العادية");
    }

    return recommendations;
  }

  /**
   * الحصول على آخر فحص للمستخدم
   */
  async getLastCheck(userId: string) {
    const results = await db
      .select()
      .from(complianceChecks)
      .where(eq(complianceChecks.userId, userId))
      .orderBy(sql`${complianceChecks.checkedAt} DESC`)
      .limit(1);
    
    return results[0] || null;
  }

  /**
   * التحقق من صلاحية الفحص
   */
  async isCheckValid(userId: string): Promise<boolean> {
    const lastCheck = await this.getLastCheck(userId);
    if (!lastCheck || !lastCheck.expiresAt) return false;
    return new Date(lastCheck.expiresAt) > new Date();
  }
}

export const complianceService = new ComplianceService();
