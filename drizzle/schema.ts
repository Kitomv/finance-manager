import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Finance Manager Tables
export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  amount: int("amount").notNull(), // Store in cents to avoid float issues
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const installments = mysqlTable("installments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  totalAmount: int("totalAmount").notNull(), // in cents
  monthlyAmount: int("monthlyAmount").notNull(), // in cents
  startYear: int("startYear").notNull(),
  startMonth: int("startMonth").notNull(),
  durationMonths: int("durationMonths").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const installmentPayments = mysqlTable("installmentPayments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  installmentId: varchar("installmentId", { length: 64 }).notNull(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  amount: int("amount").notNull(), // in cents
  isPaid: int("isPaid").default(0).notNull(), // 0 = false, 1 = true
  paidDate: timestamp("paidDate"),
});

export const savings = mysqlTable("savings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  targetAmount: int("targetAmount").notNull(), // in cents
  currentAmount: int("currentAmount").notNull().default(0), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const budgets = mysqlTable("budgets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  limit: int("limit").notNull(), // in cents
  month: int("month").notNull(),
  year: int("year").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const activityLogs = mysqlTable("activityLogs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["transaction", "installment", "saving", "budget", "backup"]).notNull(),
  action: mysqlEnum("action", ["create", "update", "delete", "restore"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Types
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type Installment = typeof installments.$inferSelect;
export type InsertInstallment = typeof installments.$inferInsert;
export type InstallmentPayment = typeof installmentPayments.$inferSelect;
export type InsertInstallmentPayment = typeof installmentPayments.$inferInsert;
export type Saving = typeof savings.$inferSelect;
export type InsertSaving = typeof savings.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;