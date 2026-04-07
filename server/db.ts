import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, transactions, installments, installmentPayments, savings, budgets, activityLogs, InsertTransaction, InsertInstallment, InsertInstallmentPayment, InsertSaving, InsertBudget, InsertActivityLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Finance Manager Query Helpers

// Transactions
export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(transactions).values(data);
}

export async function getUserTransactions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(transactions).where(eq(transactions.userId, userId));
}

export async function updateTransaction(id: string, data: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(transactions).set(data).where(eq(transactions.id, id));
}

export async function deleteTransaction(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(transactions).where(eq(transactions.id, id));
}

// Installments
export async function createInstallment(data: InsertInstallment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(installments).values(data);
}

export async function getUserInstallments(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(installments).where(eq(installments.userId, userId));
}

export async function deleteInstallment(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(installments).where(eq(installments.id, id));
}

// Installment Payments
export async function createInstallmentPayment(data: InsertInstallmentPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(installmentPayments).values(data);
}

export async function getInstallmentPayments(installmentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(installmentPayments).where(eq(installmentPayments.installmentId, installmentId));
}

export async function updateInstallmentPayment(id: string, data: Partial<InsertInstallmentPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(installmentPayments).set(data).where(eq(installmentPayments.id, id));
}

// Savings
export async function createSaving(data: InsertSaving) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(savings).values(data);
}

export async function getUserSavings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(savings).where(eq(savings.userId, userId));
}

export async function updateSaving(id: string, data: Partial<InsertSaving>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(savings).set(data).where(eq(savings.id, id));
}

export async function deleteSaving(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(savings).where(eq(savings.id, id));
}

// Budgets
export async function createBudget(data: InsertBudget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(budgets).values(data);
}

export async function getUserBudgets(userId: number, month?: number, year?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(budgets).where(eq(budgets.userId, userId));
  
  if (month !== undefined && year !== undefined) {
    query = db.select().from(budgets).where(
      and(eq(budgets.userId, userId), eq(budgets.month, month), eq(budgets.year, year))
    );
  }
  
  return await query;
}

export async function updateBudget(id: string, data: Partial<InsertBudget>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(budgets).set(data).where(eq(budgets.id, id));
}

export async function deleteBudget(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(budgets).where(eq(budgets.id, id));
}

// Activity Logs
export async function createActivityLog(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(activityLogs).values(data);
}

export async function getUserActivityLogs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(activityLogs).where(eq(activityLogs.userId, userId));
}
