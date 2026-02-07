/**
 * خدمة سنافي لدعم قرار الشراء الذكي
 * Snafi Smart Purchase Decision Support Service
 * 
 * تحويل سنافي من أداة تنبؤ إلى محرك دعم قرار شراء ذكي
 */

import { db } from "../db";
import { 
  refuelingHistory, 
  decisionSupportSessions, 
  predictionAccuracyRecords,
  fuelPrices,
  vehicles,
  invoices
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte, avg } from "drizzle-orm";

// ==========================================
// الأنواع والثوابت
// ==========================================

interface VehicleInput {
  vehicleId: string;
  make?: string;
  model?: string;
  tankCapacity: number;
}

interface DecisionRequest {
  userId: string;
  vehicle: VehicleInput;
  currentFuelPercentage: number;
  fuelType: string;
  targetFuelPercentage?: number; // النسبة المستهدفة (افتراضي 100%)
}

interface DecisionRecommendation {
  decisionSupportId: string;
  recommendedLiters: number;
  estimatedCost: number;
  confidenceScore: number;
  matchedRecords: number;
  currentFuelPrice: number;
  estimatedSavings: number;
  reasoning: string[];
  alternatives: AlternativeOption[];
}

interface AlternativeOption {
  liters: number;
  cost: number;
  targetPercentage: number;
  label: string;
}

interface HistoricalMatch {
  avgLiters: number;
  avgCost: number;
  successRate: number;
  recordCount: number;
}

// أسعار الوقود الافتراضية (ريال سعودي)
const DEFAULT_FUEL_PRICES: Record<string, number> = {
  "91": 2.18,
  "95": 2.33,
  "diesel": 0.52,
};

class SnafiDecisionService {
  
  /**
   * توليد معرف جلسة دعم القرار الفريد
   * Format: SNAFI-DSS-XXXXX (5 uppercase alphanumeric characters)
   */
  private generateDecisionSupportId(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "";
    for (let i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SNAFI-DSS-${id}`;
  }

  /**
   * الحصول على سعر الوقود الحالي
   */
  async getCurrentFuelPrice(fuelType: string): Promise<number> {
    const [price] = await db
      .select()
      .from(fuelPrices)
      .where(and(
        eq(fuelPrices.fuelType, fuelType),
        eq(fuelPrices.isActive, true)
      ))
      .orderBy(desc(fuelPrices.effectiveFrom))
      .limit(1);
    
    return price?.pricePerLiter || DEFAULT_FUEL_PRICES[fuelType] || 2.33;
  }

  /**
   * البحث في السجلات التاريخية المطابقة
   * Historical Data Matching Algorithm
   */
  async findHistoricalMatches(
    userId: string,
    vehicleId: string,
    fuelType: string,
    currentFuelPercentage: number,
    tankCapacity: number
  ): Promise<HistoricalMatch> {
    // نطاق البحث: ±10% من نسبة الوقود الحالية
    const percentageRange = 10;
    const minPercentage = Math.max(0, currentFuelPercentage - percentageRange);
    const maxPercentage = Math.min(100, currentFuelPercentage + percentageRange);

    // البحث في جميع سجلات التعبئة ضمن النطاق (بدون تصفية على wasSuccessful)
    const historicalRecords = await db
      .select({
        avgLiters: avg(refuelingHistory.litersAdded),
        avgCost: avg(refuelingHistory.totalCost),
        count: sql<number>`count(*)`,
        successCount: sql<number>`count(*) filter (where ${refuelingHistory.wasSuccessful} = true)`,
      })
      .from(refuelingHistory)
      .where(and(
        eq(refuelingHistory.vehicleId, vehicleId),
        eq(refuelingHistory.fuelType, fuelType),
        gte(refuelingHistory.fuelLevelBefore, minPercentage),
        lte(refuelingHistory.fuelLevelBefore, maxPercentage)
      ));

    const result = historicalRecords[0];
    const recordCount = Number(result?.count) || 0;
    const successCount = Number(result?.successCount) || 0;

    return {
      avgLiters: Number(result?.avgLiters) || 0,
      avgCost: Number(result?.avgCost) || 0,
      successRate: recordCount > 0 ? (successCount / recordCount) * 100 : 0,
      recordCount,
    };
  }

  /**
   * حساب اللترات المقترحة
   * Decision Support Algorithm
   */
  private calculateRecommendedLiters(
    tankCapacity: number,
    currentPercentage: number,
    targetPercentage: number,
    historicalMatch: HistoricalMatch
  ): { liters: number; confidence: number; reasoning: string[] } {
    const reasoning: string[] = [];
    let confidence = 50; // الثقة الأساسية

    // الحساب الأساسي: الفرق بين النسبة الحالية والمستهدفة
    const percentageDiff = targetPercentage - currentPercentage;
    const basicLiters = (percentageDiff / 100) * tankCapacity;

    let recommendedLiters = basicLiters;

    // تحسين التوصية بناءً على البيانات التاريخية
    if (historicalMatch.recordCount >= 3) {
      // لدينا بيانات كافية للمطابقة
      const historicalWeight = Math.min(historicalMatch.recordCount / 10, 0.5);
      recommendedLiters = (basicLiters * (1 - historicalWeight)) + (historicalMatch.avgLiters * historicalWeight);
      
      confidence += historicalMatch.recordCount * 3;
      confidence += historicalMatch.successRate * 0.2;
      
      reasoning.push(`تم مطابقة ${historicalMatch.recordCount} سجلات تعبئة سابقة ناجحة`);
      reasoning.push(`معدل نجاح التعبئات السابقة: ${historicalMatch.successRate.toFixed(1)}%`);
    } else if (historicalMatch.recordCount > 0) {
      reasoning.push(`تم العثور على ${historicalMatch.recordCount} سجل سابق - نحتاج المزيد لتحسين الدقة`);
      confidence += historicalMatch.recordCount * 5;
    } else {
      reasoning.push("أول تعبئة لهذه السيارة - التوصية مبنية على الحساب الأساسي");
    }

    // إضافة ملاحظات مفيدة
    if (currentPercentage < 20) {
      reasoning.push("تحذير: مستوى الوقود منخفض جداً - يُنصح بالتعبئة الكاملة");
      confidence += 10;
    } else if (currentPercentage > 70) {
      reasoning.push("ملاحظة: مستوى الوقود جيد - يمكنك تأجيل التعبئة");
    }

    // تقريب اللترات لأقرب 0.5 لتر
    recommendedLiters = Math.round(recommendedLiters * 2) / 2;
    
    // التأكد من عدم تجاوز الحد الأدنى والأقصى
    recommendedLiters = Math.max(5, recommendedLiters); // حد أدنى 5 لتر
    recommendedLiters = Math.min((100 - currentPercentage) / 100 * tankCapacity, recommendedLiters);

    confidence = Math.min(95, confidence); // حد أقصى للثقة

    return { liters: recommendedLiters, confidence, reasoning };
  }

  /**
   * توليد البدائل المتاحة
   */
  private generateAlternatives(
    tankCapacity: number,
    currentPercentage: number,
    fuelPrice: number
  ): AlternativeOption[] {
    const alternatives: AlternativeOption[] = [];
    
    // التعبئة الكاملة
    const fullFillLiters = ((100 - currentPercentage) / 100) * tankCapacity;
    alternatives.push({
      liters: Math.round(fullFillLiters * 2) / 2,
      cost: Math.round(fullFillLiters * fuelPrice * 100) / 100,
      targetPercentage: 100,
      label: "تعبئة كاملة",
    });

    // نصف تانكي
    const halfTankTarget = Math.min(100, currentPercentage + 50);
    const halfTankLiters = ((halfTankTarget - currentPercentage) / 100) * tankCapacity;
    if (halfTankLiters >= 5) {
      alternatives.push({
        liters: Math.round(halfTankLiters * 2) / 2,
        cost: Math.round(halfTankLiters * fuelPrice * 100) / 100,
        targetPercentage: halfTankTarget,
        label: "نصف تانكي",
      });
    }

    // 100 ريال
    const hundredRiyalLiters = 100 / fuelPrice;
    const hundredRiyalTarget = currentPercentage + (hundredRiyalLiters / tankCapacity) * 100;
    if (hundredRiyalTarget <= 100) {
      alternatives.push({
        liters: Math.round(hundredRiyalLiters * 2) / 2,
        cost: 100,
        targetPercentage: Math.round(hundredRiyalTarget),
        label: "100 ريال",
      });
    }

    // 50 ريال
    const fiftyRiyalLiters = 50 / fuelPrice;
    const fiftyRiyalTarget = currentPercentage + (fiftyRiyalLiters / tankCapacity) * 100;
    if (fiftyRiyalTarget <= 100) {
      alternatives.push({
        liters: Math.round(fiftyRiyalLiters * 2) / 2,
        cost: 50,
        targetPercentage: Math.round(fiftyRiyalTarget),
        label: "50 ريال",
      });
    }

    return alternatives;
  }

  /**
   * حساب التوفير المحتمل
   */
  private calculateEstimatedSavings(
    historicalMatch: HistoricalMatch,
    recommendedLiters: number,
    fuelPrice: number
  ): number {
    if (historicalMatch.recordCount < 3) return 0;
    
    // التوفير = الفرق بين متوسط التعبئة السابقة والتوصية الحالية
    const historicalCost = historicalMatch.avgLiters * fuelPrice;
    const recommendedCost = recommendedLiters * fuelPrice;
    
    // إذا كانت التوصية أقل = توفير
    const savings = Math.max(0, historicalCost - recommendedCost);
    return Math.round(savings * 100) / 100;
  }

  /**
   * إنشاء جلسة دعم قرار جديدة
   * Main Decision Support Entry Point
   */
  async createDecisionSession(request: DecisionRequest): Promise<DecisionRecommendation> {
    const { userId, vehicle, currentFuelPercentage, fuelType, targetFuelPercentage = 100 } = request;

    // الحصول على سعر الوقود الحالي
    const currentFuelPrice = await this.getCurrentFuelPrice(fuelType);

    // البحث في السجلات التاريخية
    const historicalMatch = await this.findHistoricalMatches(
      userId,
      vehicle.vehicleId,
      fuelType,
      currentFuelPercentage,
      vehicle.tankCapacity
    );

    // حساب التوصية
    const { liters, confidence, reasoning } = this.calculateRecommendedLiters(
      vehicle.tankCapacity,
      currentFuelPercentage,
      targetFuelPercentage,
      historicalMatch
    );

    // حساب التكلفة المتوقعة
    const estimatedCost = Math.round(liters * currentFuelPrice * 100) / 100;

    // حساب التوفير المحتمل
    const estimatedSavings = this.calculateEstimatedSavings(historicalMatch, liters, currentFuelPrice);

    // توليد البدائل
    const alternatives = this.generateAlternatives(vehicle.tankCapacity, currentFuelPercentage, currentFuelPrice);

    // توليد معرف الجلسة
    const decisionSupportId = this.generateDecisionSupportId();

    // حفظ الجلسة في قاعدة البيانات
    await db.insert(decisionSupportSessions).values({
      decisionSupportId,
      userId,
      vehicleId: vehicle.vehicleId,
      inputFuelPercentage: currentFuelPercentage,
      inputTankCapacity: vehicle.tankCapacity,
      selectedFuelType: fuelType,
      recommendedLiters: liters,
      estimatedCost,
      confidenceScore: confidence,
      matchedHistoricalRecords: historicalMatch.recordCount,
      currentFuelPrice,
      estimatedSavings,
      status: "pending",
    });

    return {
      decisionSupportId,
      recommendedLiters: liters,
      estimatedCost,
      confidenceScore: confidence,
      matchedRecords: historicalMatch.recordCount,
      currentFuelPrice,
      estimatedSavings,
      reasoning,
      alternatives,
    };
  }

  /**
   * قبول التوصية وربطها بالفاتورة
   */
  async acceptRecommendation(decisionSupportId: string, invoiceId: string): Promise<boolean> {
    await db
      .update(decisionSupportSessions)
      .set({
        status: "accepted",
        userAction: "accepted",
        invoiceId,
      })
      .where(eq(decisionSupportSessions.decisionSupportId, decisionSupportId));

    return true;
  }

  /**
   * تسجيل التعبئة الفعلية وحساب دقة التنبؤ
   */
  async recordActualRefueling(
    decisionSupportId: string,
    actualLiters: number,
    actualCost: number,
    userFeedback?: number
  ): Promise<{ accuracyScore: number; message: string }> {
    // الحصول على بيانات الجلسة
    const [session] = await db
      .select()
      .from(decisionSupportSessions)
      .where(eq(decisionSupportSessions.decisionSupportId, decisionSupportId))
      .limit(1);

    if (!session) {
      throw new Error("جلسة دعم القرار غير موجودة");
    }

    // حساب دقة التنبؤ
    const literDeviation = Math.abs(session.recommendedLiters - actualLiters);
    const literDeviationPercentage = (literDeviation / session.recommendedLiters) * 100;
    
    const costDeviation = Math.abs(session.estimatedCost - actualCost);
    
    // درجة الدقة: 100 - نسبة الانحراف (مع حد أدنى 0)
    const accuracyScore = Math.max(0, 100 - literDeviationPercentage);

    // تحديث الجلسة
    await db
      .update(decisionSupportSessions)
      .set({
        status: "completed",
        actualLitersUsed: actualLiters,
        predictionAccuracy: accuracyScore,
        userFeedback,
        completedAt: new Date(),
      })
      .where(eq(decisionSupportSessions.decisionSupportId, decisionSupportId));

    // حفظ سجل دقة التنبؤ
    await db.insert(predictionAccuracyRecords).values({
      decisionSessionId: session.id,
      userId: session.userId,
      vehicleId: session.vehicleId,
      predictedLiters: session.recommendedLiters,
      actualLiters,
      deviationPercentage: literDeviationPercentage,
      predictedCost: session.estimatedCost,
      actualCost,
      costDeviation,
      accuracyScore,
    });

    // تسجيل في سجل التعبئة التاريخي
    await db.insert(refuelingHistory).values({
      userId: session.userId,
      vehicleId: session.vehicleId,
      fuelType: session.selectedFuelType,
      fuelLevelBefore: session.inputFuelPercentage,
      fuelLevelAfter: Math.min(100, session.inputFuelPercentage + (actualLiters / session.inputTankCapacity) * 100),
      litersAdded: actualLiters,
      pricePerLiter: session.currentFuelPrice,
      totalCost: actualCost,
      wasSuccessful: accuracyScore >= 70,
      userSatisfaction: userFeedback,
    });

    let message = "";
    if (accuracyScore >= 90) {
      message = "ممتاز! التوصية كانت دقيقة جداً";
    } else if (accuracyScore >= 70) {
      message = "جيد! التوصية كانت قريبة من الفعلي";
    } else if (accuracyScore >= 50) {
      message = "مقبول - سنحسن التوصيات المستقبلية";
    } else {
      message = "نحتاج المزيد من البيانات لتحسين الدقة";
    }

    return { accuracyScore: Math.round(accuracyScore), message };
  }

  /**
   * الحصول على إحصائيات دقة النظام
   */
  async getAccuracyStats(userId: string): Promise<{
    totalSessions: number;
    avgAccuracy: number;
    improvementTrend: string;
    recentAccuracy: number;
  }> {
    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        avgAccuracy: avg(predictionAccuracyRecords.accuracyScore),
      })
      .from(predictionAccuracyRecords)
      .where(eq(predictionAccuracyRecords.userId, userId));

    // آخر 5 جلسات
    const recentRecords = await db
      .select({ accuracy: predictionAccuracyRecords.accuracyScore })
      .from(predictionAccuracyRecords)
      .where(eq(predictionAccuracyRecords.userId, userId))
      .orderBy(desc(predictionAccuracyRecords.recordedAt))
      .limit(5);

    const recentAvg = recentRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0) / recentRecords.length
      : 0;

    const totalAvg = Number(stats[0]?.avgAccuracy) || 0;
    
    let trend = "ثابت";
    if (recentAvg > totalAvg + 5) trend = "تحسن";
    else if (recentAvg < totalAvg - 5) trend = "تراجع";

    return {
      totalSessions: Number(stats[0]?.total) || 0,
      avgAccuracy: Math.round(totalAvg),
      improvementTrend: trend,
      recentAccuracy: Math.round(recentAvg),
    };
  }

  /**
   * الحصول على جلسة دعم قرار محددة
   */
  async getSession(decisionSupportId: string) {
    const [session] = await db
      .select()
      .from(decisionSupportSessions)
      .where(eq(decisionSupportSessions.decisionSupportId, decisionSupportId))
      .limit(1);

    return session;
  }

  /**
   * الحصول على جلسات المستخدم
   */
  async getUserSessions(userId: string, limit: number = 10) {
    return db
      .select()
      .from(decisionSupportSessions)
      .where(eq(decisionSupportSessions.userId, userId))
      .orderBy(desc(decisionSupportSessions.createdAt))
      .limit(limit);
  }

  /**
   * تحديث أسعار الوقود
   */
  async updateFuelPrice(fuelType: string, pricePerLiter: number, source: string = "system"): Promise<void> {
    // إلغاء تفعيل السعر السابق
    await db
      .update(fuelPrices)
      .set({ isActive: false, effectiveTo: new Date() })
      .where(and(
        eq(fuelPrices.fuelType, fuelType),
        eq(fuelPrices.isActive, true)
      ));

    // إضافة السعر الجديد
    await db.insert(fuelPrices).values({
      fuelType,
      pricePerLiter,
      source,
      isActive: true,
    });
  }

  /**
   * تهيئة أسعار الوقود الافتراضية
   */
  async initializeDefaultPrices(): Promise<void> {
    for (const [fuelType, price] of Object.entries(DEFAULT_FUEL_PRICES)) {
      const [existing] = await db
        .select()
        .from(fuelPrices)
        .where(and(
          eq(fuelPrices.fuelType, fuelType),
          eq(fuelPrices.isActive, true)
        ))
        .limit(1);

      if (!existing) {
        await db.insert(fuelPrices).values({
          fuelType,
          pricePerLiter: price,
          source: "system",
          isActive: true,
        });
      }
    }
  }
}

export const snafiDecisionService = new SnafiDecisionService();
