import { db } from "../db";
import { 
  merchants, merchantApiKeys, checkoutSessions, webhookEvents, 
  merchantTransactions, merchantSettlements,
  CheckoutStatus, WebhookEventTypes, MerchantStatus
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import crypto from "crypto";

function generateMerchantCode(): string {
  return `MERCH-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function generateApiKey(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(24).toString("hex")}`;
}

function generateSessionToken(): string {
  return `chk_${crypto.randomBytes(16).toString("hex")}`;
}

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

function generateSettlementRef(): string {
  return `STL-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export const merchantService = {
  async registerMerchant(data: {
    companyName: string;
    companyNameAr?: string;
    commercialReg?: string;
    taxNumber?: string;
    website?: string;
    callbackUrl?: string;
    contactEmail: string;
    contactPhone?: string;
    category?: string;
  }) {
    const merchantCode = generateMerchantCode();
    
    const [merchant] = await db.insert(merchants).values({
      merchantCode,
      companyName: data.companyName,
      companyNameAr: data.companyNameAr,
      commercialReg: data.commercialReg,
      taxNumber: data.taxNumber,
      website: data.website,
      callbackUrl: data.callbackUrl,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      category: data.category,
      status: "pending",
    }).returning();

    const sandboxKeys = await this.generateApiKeys(merchant.id, "sandbox");
    
    return {
      merchant,
      apiKeys: {
        sandbox: {
          publicKey: sandboxKeys.publicKey,
          secretKey: sandboxKeys.secretKey,
        }
      }
    };
  },

  async generateApiKeys(merchantId: string, keyType: "sandbox" | "production") {
    const prefix = keyType === "sandbox" ? "pk_test" : "pk_live";
    const secretPrefix = keyType === "sandbox" ? "sk_test" : "sk_live";
    
    const publicKey = generateApiKey(prefix);
    const secretKey = generateApiKey(secretPrefix);
    const webhookSecret = generateWebhookSecret();

    const [apiKey] = await db.insert(merchantApiKeys).values({
      merchantId,
      keyType,
      publicKey,
      secretKey,
      webhookSecret,
      permissions: ["checkout", "refund", "read"],
      isActive: true,
    }).returning();

    return { publicKey, secretKey, webhookSecret, id: apiKey.id };
  },

  async validateApiKey(secretKey: string): Promise<{ valid: boolean; merchant?: any; keyType?: string; isSandbox?: boolean }> {
    const [apiKey] = await db.select()
      .from(merchantApiKeys)
      .where(and(
        eq(merchantApiKeys.secretKey, secretKey),
        eq(merchantApiKeys.isActive, true)
      ))
      .limit(1);

    if (!apiKey) {
      return { valid: false };
    }

    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.id, apiKey.merchantId))
      .limit(1);

    if (!merchant) {
      return { valid: false };
    }

    const isSandbox = apiKey.keyType === "sandbox";
    
    if (isSandbox) {
      if (merchant.status === "suspended") {
        return { valid: false };
      }
    } else {
      if (merchant.status !== "active") {
        return { valid: false };
      }
    }

    await db.update(merchantApiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(merchantApiKeys.id, apiKey.id));

    return { valid: true, merchant, keyType: apiKey.keyType, isSandbox };
  },

  async createCheckoutSession(data: {
    merchantId: string;
    merchantReference: string;
    consumerPhone: string;
    consumerEmail?: string;
    consumerName?: string;
    consumerNationalId?: string;
    totalAmount: number;
    taxAmount?: number;
    shippingAmount?: number;
    discountAmount?: number;
    items?: any[];
    paymentType?: string;
    installmentCount?: number;
    successUrl: string;
    failureUrl: string;
    cancelUrl?: string;
    notificationUrl?: string;
  }) {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const [session] = await db.insert(checkoutSessions).values({
      sessionToken,
      merchantId: data.merchantId,
      merchantReference: data.merchantReference,
      consumerPhone: data.consumerPhone,
      consumerEmail: data.consumerEmail,
      consumerName: data.consumerName,
      consumerNationalId: data.consumerNationalId,
      totalAmount: data.totalAmount,
      taxAmount: data.taxAmount || 0,
      shippingAmount: data.shippingAmount || 0,
      discountAmount: data.discountAmount || 0,
      items: data.items,
      paymentType: data.paymentType || "pay_in_installments",
      installmentCount: data.installmentCount || 4,
      successUrl: data.successUrl,
      failureUrl: data.failureUrl,
      cancelUrl: data.cancelUrl,
      notificationUrl: data.notificationUrl,
      status: "pending",
      expiresAt,
    }).returning();

    return {
      sessionToken: session.sessionToken,
      checkoutUrl: `/checkout/${session.sessionToken}`,
      expiresAt: session.expiresAt,
      status: session.status,
    };
  },

  async getCheckoutSession(sessionToken: string) {
    const [session] = await db.select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.sessionToken, sessionToken))
      .limit(1);

    return session;
  },

  async approveCheckout(sessionToken: string, consumerId: string, creditLimit: number, riskScore: number) {
    const [session] = await db.update(checkoutSessions)
      .set({
        consumerId,
        status: "approved",
        creditDecision: "approved",
        creditLimit,
        riskScore,
        approvedAt: new Date(),
      })
      .where(eq(checkoutSessions.sessionToken, sessionToken))
      .returning();

    if (session) {
      await this.sendWebhook(session.merchantId, WebhookEventTypes.CHECKOUT_APPROVED, "checkout", session.id, {
        sessionToken: session.sessionToken,
        merchantReference: session.merchantReference,
        status: "approved",
        totalAmount: session.totalAmount,
        approvedAt: session.approvedAt,
      });
    }

    return session;
  },

  async capturePayment(sessionToken: string, invoiceId: string) {
    const session = await this.getCheckoutSession(sessionToken);
    if (!session) throw new Error("Session not found");

    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.id, session.merchantId))
      .limit(1);

    const commissionRate = merchant?.commissionRate || 3;
    const commissionAmount = (session.totalAmount * commissionRate) / 100;
    const netAmount = session.totalAmount - commissionAmount;

    const [updatedSession] = await db.update(checkoutSessions)
      .set({
        status: "captured",
        invoiceId,
        capturedAt: new Date(),
      })
      .where(eq(checkoutSessions.sessionToken, sessionToken))
      .returning();

    await db.insert(merchantTransactions).values({
      merchantId: session.merchantId,
      checkoutSessionId: session.id,
      transactionType: "capture",
      grossAmount: session.totalAmount,
      commissionAmount,
      netAmount,
      status: "completed",
    });

    await db.update(merchants)
      .set({
        currentMonthVolume: (merchant?.currentMonthVolume || 0) + netAmount,
        totalTransactions: (merchant?.totalTransactions || 0) + 1,
      })
      .where(eq(merchants.id, session.merchantId));

    await this.sendWebhook(session.merchantId, WebhookEventTypes.PAYMENT_CAPTURED, "payment", session.id, {
      sessionToken: session.sessionToken,
      merchantReference: session.merchantReference,
      status: "captured",
      totalAmount: session.totalAmount,
      invoiceId,
      capturedAt: updatedSession.capturedAt,
    });

    return updatedSession;
  },

  async declineCheckout(sessionToken: string, reason: string) {
    const [session] = await db.update(checkoutSessions)
      .set({
        status: "declined",
        creditDecision: "declined",
        declineReason: reason,
      })
      .where(eq(checkoutSessions.sessionToken, sessionToken))
      .returning();

    if (session) {
      await this.sendWebhook(session.merchantId, WebhookEventTypes.CHECKOUT_DECLINED, "checkout", session.id, {
        sessionToken: session.sessionToken,
        merchantReference: session.merchantReference,
        status: "declined",
        reason,
      });
    }

    return session;
  },

  async sendWebhook(merchantId: string, eventType: string, resourceType: string, resourceId: string, payload: any) {
    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant?.callbackUrl) return null;

    const [webhook] = await db.insert(webhookEvents).values({
      merchantId,
      eventType,
      resourceType,
      resourceId,
      payload,
      webhookUrl: merchant.callbackUrl,
      status: "pending",
    }).returning();

    setTimeout(async () => {
      try {
        const response = await fetch(merchant.callbackUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": this.signWebhook(payload, merchantId),
          },
          body: JSON.stringify({
            id: webhook.id,
            eventType,
            resourceType,
            resourceId,
            data: payload,
            createdAt: new Date().toISOString(),
          }),
        });

        await db.update(webhookEvents)
          .set({
            status: response.ok ? "sent" : "failed",
            httpStatus: response.status,
            attempts: 1,
            sentAt: new Date(),
          })
          .where(eq(webhookEvents.id, webhook.id));
      } catch (error) {
        await db.update(webhookEvents)
          .set({
            status: "failed",
            attempts: 1,
            nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
          })
          .where(eq(webhookEvents.id, webhook.id));
      }
    }, 100);

    return webhook;
  },

  signWebhook(payload: any, merchantId: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const data = `${timestamp}.${JSON.stringify(payload)}`;
    return `t=${timestamp},v1=${crypto.createHmac("sha256", merchantId).update(data).digest("hex")}`;
  },

  async getMerchantStats(merchantId: string) {
    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    const transactions = await db.select()
      .from(merchantTransactions)
      .where(eq(merchantTransactions.merchantId, merchantId))
      .orderBy(desc(merchantTransactions.createdAt))
      .limit(10);

    return {
      merchant,
      recentTransactions: transactions,
      stats: {
        totalTransactions: merchant?.totalTransactions || 0,
        currentMonthVolume: merchant?.currentMonthVolume || 0,
        commissionRate: merchant?.commissionRate || 3,
      }
    };
  },

  async getMerchantByCode(merchantCode: string) {
    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.merchantCode, merchantCode))
      .limit(1);
    return merchant;
  },

  async activateMerchant(merchantId: string) {
    const [merchant] = await db.update(merchants)
      .set({ status: "active", isVerified: true })
      .where(eq(merchants.id, merchantId))
      .returning();

    const productionKeys = await this.generateApiKeys(merchantId, "production");

    return { merchant, productionKeys };
  },
};
