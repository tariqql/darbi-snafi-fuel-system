import { db } from "../db";
import { 
  adminUsers, adminLoginHistory, auditLogs, workflowRequests, 
  systemSettings, adminNotifications, branches, merchants, 
  invoices, users, checkoutSessions
} from "@shared/schema";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const adminService = {
  async createAdminUser(data: {
    email: string;
    password: string;
    fullName: string;
    fullNameAr?: string;
    phone?: string;
    role: string;
    department?: string;
    branchId?: string;
    permissions?: string[];
  }) {
    const passwordHash = hashPassword(data.password);
    
    const [admin] = await db.insert(adminUsers).values({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      fullNameAr: data.fullNameAr,
      phone: data.phone,
      role: data.role,
      department: data.department,
      branchId: data.branchId,
      permissions: data.permissions || [],
    }).returning();

    return admin;
  },

  async authenticateAdmin(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const passwordHash = hashPassword(password);
    
    const [admin] = await db.select()
      .from(adminUsers)
      .where(and(
        eq(adminUsers.email, email),
        eq(adminUsers.passwordHash, passwordHash),
        eq(adminUsers.isActive, true)
      ))
      .limit(1);

    await db.insert(adminLoginHistory).values({
      adminUserId: admin?.id || "unknown",
      ipAddress,
      userAgent,
      loginStatus: admin ? "success" : "failed",
      failureReason: admin ? null : "Invalid credentials",
    });

    if (admin) {
      await db.update(adminUsers)
        .set({ lastLoginAt: new Date(), lastLoginIp: ipAddress })
        .where(eq(adminUsers.id, admin.id));
    }

    return admin || null;
  },

  async getAdminUsers() {
    return db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
  },

  async getAdminById(id: string) {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
    return admin;
  },

  async updateAdminUser(id: string, data: Partial<{
    fullName: string;
    fullNameAr: string;
    phone: string;
    role: string;
    department: string;
    branchId: string;
    permissions: string[];
    isActive: boolean;
  }>) {
    const [updated] = await db.update(adminUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return updated;
  },

  async logAuditEvent(data: {
    adminUserId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    description?: string;
  }) {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  },

  async getAuditLogs(filters?: { adminUserId?: string; resourceType?: string; limit?: number }) {
    let query = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return query;
  },

  async createWorkflowRequest(data: {
    requestType: string;
    requesterId?: string;
    requesterType?: string;
    resourceType: string;
    resourceId: string;
    payload?: any;
    priority?: string;
    dueDate?: Date;
  }) {
    const [request] = await db.insert(workflowRequests).values(data).returning();
    return request;
  },

  async getWorkflowRequests(status?: string) {
    if (status) {
      return db.select().from(workflowRequests)
        .where(eq(workflowRequests.status, status))
        .orderBy(desc(workflowRequests.createdAt));
    }
    return db.select().from(workflowRequests).orderBy(desc(workflowRequests.createdAt));
  },

  async reviewWorkflowRequest(id: string, reviewerId: string, status: string, reviewNote?: string) {
    const [updated] = await db.update(workflowRequests)
      .set({
        status,
        reviewedBy: reviewerId,
        reviewNote,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflowRequests.id, id))
      .returning();

    if (updated && status === "approved" && updated.requestType === "merchant_activation") {
      await db.update(merchants)
        .set({ status: "active", isVerified: true })
        .where(eq(merchants.id, updated.resourceId));
    }

    return updated;
  },

  async getDashboardStats() {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalMerchants] = await db.select({ count: count() }).from(merchants);
    const [activeMerchants] = await db.select({ count: count() }).from(merchants).where(eq(merchants.status, "active"));
    const [pendingMerchants] = await db.select({ count: count() }).from(merchants).where(eq(merchants.status, "pending"));
    const [totalInvoices] = await db.select({ count: count() }).from(invoices);
    const [pendingWorkflows] = await db.select({ count: count() }).from(workflowRequests).where(eq(workflowRequests.status, "pending"));
    const [totalCheckouts] = await db.select({ count: count() }).from(checkoutSessions);

    const recentMerchants = await db.select().from(merchants).orderBy(desc(merchants.createdAt)).limit(5);
    const recentInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(5);
    const recentWorkflows = await db.select().from(workflowRequests).orderBy(desc(workflowRequests.createdAt)).limit(5);

    return {
      stats: {
        totalUsers: totalUsers?.count || 0,
        totalMerchants: totalMerchants?.count || 0,
        activeMerchants: activeMerchants?.count || 0,
        pendingMerchants: pendingMerchants?.count || 0,
        totalInvoices: totalInvoices?.count || 0,
        pendingWorkflows: pendingWorkflows?.count || 0,
        totalCheckouts: totalCheckouts?.count || 0,
      },
      recentMerchants,
      recentInvoices,
      recentWorkflows,
    };
  },

  async getAllMerchants() {
    return db.select().from(merchants).orderBy(desc(merchants.createdAt));
  },

  async updateMerchantStatus(merchantId: string, status: string, adminId: string) {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);
    
    const [updated] = await db.update(merchants)
      .set({ status, isVerified: status === "active" })
      .where(eq(merchants.id, merchantId))
      .returning();

    await this.logAuditEvent({
      adminUserId: adminId,
      action: "update_merchant_status",
      resourceType: "merchant",
      resourceId: merchantId,
      oldValue: { status: merchant?.status },
      newValue: { status },
      description: `تغيير حالة التاجر إلى ${status}`,
    });

    return updated;
  },

  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  },

  async updateUserStatus(userId: string, status: string, adminId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, `${userId}`)).limit(1);
    
    const [updated] = await db.update(users)
      .set({ status })
      .where(eq(users.id, `${userId}`))
      .returning();

    await this.logAuditEvent({
      adminUserId: adminId,
      action: "update_user_status",
      resourceType: "user",
      resourceId: userId,
      oldValue: { status: user?.status },
      newValue: { status },
      description: `تغيير حالة المستخدم إلى ${status}`,
    });

    return updated;
  },

  async updateUserCreditLimit(userId: string, creditLimit: number, adminId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, `${userId}`)).limit(1);
    
    const [updated] = await db.update(users)
      .set({ creditLimit })
      .where(eq(users.id, `${userId}`))
      .returning();

    await this.logAuditEvent({
      adminUserId: adminId,
      action: "update_credit_limit",
      resourceType: "user",
      resourceId: userId,
      oldValue: { creditLimit: user?.creditLimit },
      newValue: { creditLimit },
      description: `تغيير الحد الائتماني إلى ${creditLimit}`,
    });

    return updated;
  },

  async getAllInvoices() {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  },

  async createNotification(adminUserId: string | null, title: string, message: string, type: string = "info", actionUrl?: string) {
    const [notification] = await db.insert(adminNotifications).values({
      adminUserId,
      title,
      message,
      notificationType: type,
      actionUrl,
    }).returning();
    return notification;
  },

  async getNotifications(adminUserId: string) {
    return db.select().from(adminNotifications)
      .where(eq(adminNotifications.adminUserId, adminUserId))
      .orderBy(desc(adminNotifications.createdAt))
      .limit(20);
  },

  async markNotificationRead(notificationId: string) {
    const [updated] = await db.update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.id, notificationId))
      .returning();
    return updated;
  },

  async getSystemSettings() {
    return db.select().from(systemSettings);
  },

  async updateSystemSetting(key: string, value: any, adminId: string) {
    const [existing] = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key)).limit(1);
    
    if (existing) {
      const [updated] = await db.update(systemSettings)
        .set({ settingValue: value, updatedBy: adminId, updatedAt: new Date() })
        .where(eq(systemSettings.settingKey, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(systemSettings).values({
        settingKey: key,
        settingValue: value,
        updatedBy: adminId,
      }).returning();
      return created;
    }
  },

  async getBranches() {
    return db.select().from(branches);
  },

  async createBranch(data: { name: string; nameAr?: string; address?: string; city?: string; phone?: string; managerId?: string }) {
    const [branch] = await db.insert(branches).values(data).returning();
    return branch;
  },
};
