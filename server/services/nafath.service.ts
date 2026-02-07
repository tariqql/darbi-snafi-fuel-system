/**
 * خدمة التحقق من الهوية عبر نفاذ API
 * Nafath Identity Verification Service
 * 
 * نفاذ هي خدمة التحقق من الهوية الوطنية في المملكة العربية السعودية
 * تتيح التحقق من هوية المستخدم عبر تطبيق نفاذ الموبايل
 */

import { db } from "../db";
import { nafathVerifications, users, NafathStatus } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// أنواع البيانات
interface NafathInitiateResponse {
  success: boolean;
  requestId: string;
  randomNumber: string;
  expiresAt: Date;
  message?: string;
}

interface NafathVerifyResponse {
  success: boolean;
  verified: boolean;
  fullName?: string;
  dateOfBirth?: Date;
  gender?: string;
  idExpiryDate?: Date;
  age?: number;
  message?: string;
}

interface NafathConfig {
  apiUrl: string;
  apiKey: string;
  appId: string;
}

/**
 * فئة خدمة نفاذ
 */
export class NafathService {
  private config: NafathConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.NAFATH_API_URL || "https://api.nafath.sa/v1",
      apiKey: process.env.NAFATH_API_KEY || "",
      appId: process.env.NAFATH_APP_ID || "",
    };
  }

  /**
   * بدء عملية التحقق من الهوية
   * يرسل طلب للمستخدم على تطبيق نفاذ
   */
  async initiateVerification(userId: string, nationalId: string): Promise<NafathInitiateResponse> {
    // التحقق من صحة رقم الهوية (10 أرقام تبدأ بـ 1 أو 2)
    if (!this.validateNationalId(nationalId)) {
      return {
        success: false,
        requestId: "",
        randomNumber: "",
        expiresAt: new Date(),
        message: "رقم الهوية غير صحيح",
      };
    }

    try {
      // في بيئة الإنتاج، سيتم الاتصال بـ API نفاذ الفعلي
      // هنا نستخدم محاكاة للتطوير
      const requestId = `NAFATH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const randomNumber = Math.floor(10 + Math.random() * 90).toString(); // رقم عشوائي مكون من رقمين

      // حفظ طلب التحقق في قاعدة البيانات
      await db.insert(nafathVerifications).values({
        userId,
        nationalId,
        requestId,
        randomNumber,
        status: NafathStatus.WAITING,
      });

      return {
        success: true,
        requestId,
        randomNumber,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // ينتهي خلال دقيقتين
        message: "تم إرسال طلب التحقق إلى تطبيق نفاذ. يرجى اختيار الرقم المطابق.",
      };
    } catch (error) {
      console.error("Nafath initiate error:", error);
      return {
        success: false,
        requestId: "",
        randomNumber: "",
        expiresAt: new Date(),
        message: "حدث خطأ أثناء إرسال طلب التحقق",
      };
    }
  }

  /**
   * التحقق من حالة طلب نفاذ
   * يتم استدعاؤه بعد أن يؤكد المستخدم في تطبيق نفاذ
   */
  async checkVerificationStatus(requestId: string): Promise<NafathVerifyResponse> {
    try {
      const [verification] = await db
        .select()
        .from(nafathVerifications)
        .where(eq(nafathVerifications.requestId, requestId));

      if (!verification) {
        return {
          success: false,
          verified: false,
          message: "طلب التحقق غير موجود",
        };
      }

      // في بيئة الإنتاج، سيتم استعلام API نفاذ
      // هنا نحاكي الاستجابة للتطوير
      if (verification.status === NafathStatus.VERIFIED) {
        return {
          success: true,
          verified: true,
          fullName: verification.verifiedName || undefined,
          dateOfBirth: verification.dateOfBirth || undefined,
          gender: verification.gender || undefined,
          idExpiryDate: verification.idExpiryDate || undefined,
          age: verification.dateOfBirth ? this.calculateAge(verification.dateOfBirth) : undefined,
        };
      }

      return {
        success: true,
        verified: false,
        message: "في انتظار تأكيد المستخدم على تطبيق نفاذ",
      };
    } catch (error) {
      console.error("Nafath check status error:", error);
      return {
        success: false,
        verified: false,
        message: "حدث خطأ أثناء التحقق من الحالة",
      };
    }
  }

  /**
   * محاكاة تأكيد التحقق (للتطوير فقط)
   * في الإنتاج، يتم استقبال webhook من نفاذ
   */
  async simulateVerification(requestId: string, approved: boolean): Promise<NafathVerifyResponse> {
    try {
      const [verification] = await db
        .select()
        .from(nafathVerifications)
        .where(eq(nafathVerifications.requestId, requestId));

      if (!verification) {
        return { success: false, verified: false, message: "طلب غير موجود" };
      }

      // محاكاة بيانات المستخدم
      const mockData = {
        verifiedName: "أحمد محمد العلي",
        dateOfBirth: new Date("1990-05-15"),
        gender: "male",
        idExpiryDate: new Date("2028-06-01"),
      };

      const age = this.calculateAge(mockData.dateOfBirth);
      const status = approved ? NafathStatus.VERIFIED : NafathStatus.REJECTED;

      await db
        .update(nafathVerifications)
        .set({
          status,
          verifiedName: approved ? mockData.verifiedName : null,
          dateOfBirth: approved ? mockData.dateOfBirth : null,
          gender: approved ? mockData.gender : null,
          idExpiryDate: approved ? mockData.idExpiryDate : null,
          verifiedAt: approved ? new Date() : null,
        })
        .where(eq(nafathVerifications.requestId, requestId));

      if (approved) {
        // تحديث حالة المستخدم
        await db
          .update(users)
          .set({ status: "active" })
          .where(eq(users.id, verification.userId));
      }

      return {
        success: true,
        verified: approved,
        fullName: approved ? mockData.verifiedName : undefined,
        dateOfBirth: approved ? mockData.dateOfBirth : undefined,
        gender: approved ? mockData.gender : undefined,
        age: approved ? age : undefined,
        message: approved ? "تم التحقق بنجاح" : "تم رفض التحقق",
      };
    } catch (error) {
      console.error("Nafath simulate error:", error);
      return { success: false, verified: false, message: "حدث خطأ" };
    }
  }

  /**
   * التحقق من العمر (18 سنة فأكثر)
   */
  async verifyAge(userId: string): Promise<{ passed: boolean; age: number | null; message: string }> {
    try {
      const [verification] = await db
        .select()
        .from(nafathVerifications)
        .where(eq(nafathVerifications.userId, userId));

      if (!verification || verification.status !== NafathStatus.VERIFIED) {
        return { passed: false, age: null, message: "يجب التحقق من الهوية أولاً" };
      }

      if (!verification.dateOfBirth) {
        return { passed: false, age: null, message: "تاريخ الميلاد غير متوفر" };
      }

      const age = this.calculateAge(verification.dateOfBirth);
      const passed = age >= 18;

      return {
        passed,
        age,
        message: passed ? "العمر مستوفي للشروط" : "يجب أن يكون عمرك 18 سنة على الأقل",
      };
    } catch (error) {
      console.error("Age verification error:", error);
      return { passed: false, age: null, message: "حدث خطأ أثناء التحقق من العمر" };
    }
  }

  /**
   * التحقق من صحة رقم الهوية السعودية
   */
  private validateNationalId(nationalId: string): boolean {
    // رقم الهوية يتكون من 10 أرقام
    // يبدأ بـ 1 للمواطنين أو 2 للمقيمين
    const pattern = /^[12]\d{9}$/;
    return pattern.test(nationalId);
  }

  /**
   * حساب العمر من تاريخ الميلاد
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * الحصول على آخر تحقق للمستخدم
   */
  async getLastVerification(userId: string) {
    const results = await db
      .select()
      .from(nafathVerifications)
      .where(eq(nafathVerifications.userId, userId))
      .orderBy(sql`${nafathVerifications.createdAt} DESC`)
      .limit(1);
    
    return results[0] || null;
  }
}

export const nafathService = new NafathService();
