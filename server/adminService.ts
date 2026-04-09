import { getDb } from "./db";
import { users, activityLogs, transactions, installments, savings, budgets } from "../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

/**
 * Admin Service
 * Provides admin-only operations for viewing all users and their activity logs
 */

export interface AdminUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  lastSignedIn: Date;
  transactionCount: number;
  installmentCount: number;
  savingCount: number;
  budgetCount: number;
}

export interface AdminActivityLog {
  id: string;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  type: 'transaction' | 'installment' | 'saving' | 'budget' | 'backup';
  action: 'create' | 'update' | 'delete' | 'restore';
  description: string;
  createdAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalTransactions: number;
  totalInstallments: number;
  totalSavings: number;
  totalBudgets: number;
  recentActivityCount: number;
}

/**
 * Get all users with their data counts
 */
export async function getAllUsers(limit: number = 50, offset: number = 0): Promise<AdminUser[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allUsers = await db.select().from(users).limit(limit).offset(offset);

  const usersWithCounts = await Promise.all(
    allUsers.map(async (user: any) => {
      const txnCount = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, user.id));
      
      const instCount = await db
        .select()
        .from(installments)
        .where(eq(installments.userId, user.id));
      
      const savCount = await db
        .select()
        .from(savings)
        .where(eq(savings.userId, user.id));
      
      const budCount = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, user.id));

      return {
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastSignedIn: user.lastSignedIn,
        transactionCount: txnCount.length,
        installmentCount: instCount.length,
        savingCount: savCount.length,
        budgetCount: budCount.length,
      };
    })
  );

  return usersWithCounts;
}

/**
 * Get total user count
 */
export async function getTotalUserCount(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(users);
  return result.length;
}

/**
 * Get all activity logs with user info
 */
export async function getAllActivityLogs(
  limit: number = 100,
  offset: number = 0,
  filters?: {
    userId?: number;
    type?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<AdminActivityLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query: any = db.select().from(activityLogs);

  // Apply filters
  const conditions: any[] = [];
  if (filters?.userId) {
    conditions.push(eq(activityLogs.userId, filters.userId));
  }
  if (filters?.type) {
    conditions.push(eq(activityLogs.type, filters.type as any));
  }
  if (filters?.action) {
    conditions.push(eq(activityLogs.action, filters.action as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(activityLogs.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(activityLogs.createdAt, filters.endDate));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const logs = await query
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);

  // Enrich with user info
  const enrichedLogs = await Promise.all(
    logs.map(async (log: any) => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, log.userId))
        .limit(1);

      return {
        id: log.id,
        userId: log.userId,
        userName: user[0]?.name || null,
        userEmail: user[0]?.email || null,
        type: log.type,
        action: log.action,
        description: log.description,
        createdAt: log.createdAt,
      };
    })
  );

  return enrichedLogs;
}

/**
 * Get activity logs for a specific user
 */
export async function getUserActivityLogs(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<AdminActivityLog[]> {
  return getAllActivityLogs(limit, offset, { userId });
}

/**
 * Get admin statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const totalUsers = await db.select().from(users);
  const totalAdmins = totalUsers.filter((u: any) => u.role === 'admin').length;
  const totalTxns = await db.select().from(transactions);
  const totalInsts = await db.select().from(installments);
  const totalSavs = await db.select().from(savings);
  const totalBuds = await db.select().from(budgets);
  
  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentLogs = await db
    .select()
    .from(activityLogs)
    .where(gte(activityLogs.createdAt, sevenDaysAgo));

  return {
    totalUsers: totalUsers.length,
    totalAdmins,
    totalTransactions: totalTxns.length,
    totalInstallments: totalInsts.length,
    totalSavings: totalSavs.length,
    totalBudgets: totalBuds.length,
    recentActivityCount: recentLogs.length,
  };
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: number,
  newRole: 'user' | 'admin'
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
}

/**
 * Get user details with all their data
 */
export async function getUserDetails(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) throw new Error("User not found");

  const userTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId));
  
  const userInstallments = await db
    .select()
    .from(installments)
    .where(eq(installments.userId, userId));
  
  const userSavings = await db
    .select()
    .from(savings)
    .where(eq(savings.userId, userId));
  
  const userBudgets = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId));
  
  const userLogs = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt));

  return {
    user: user[0],
    transactions: userTransactions,
    installments: userInstallments,
    savings: userSavings,
    budgets: userBudgets,
    activityLogs: userLogs,
  };
}
