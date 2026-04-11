import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as cloudBackup from "./cloudBackup";
import * as activityLogger from "./activityLogger";
import * as adminService from "./adminService";

// Define schemas inline
const budgetListSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().optional(),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Finance Manager Routers
  transactions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || !user.id) throw new Error("User not found");
      return await db.getUserTransactions(user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(['income', 'expense']),
        amount: z.number().int().positive(),
        category: z.string(),
        description: z.string().optional(),
        date: z.string(), // YYYY-MM-DD format
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const transaction = {
          id: `${Date.now()}-${Math.random()}`,
          userId: user.id,
          ...input,
        };
        
        await db.createTransaction(transaction);
        
        // Log activity to database
        await activityLogger.logTransactionActivity(
          user.id,
          'create',
          `Transaksi ${input.type === 'income' ? 'pemasukan' : 'pengeluaran'} ditambahkan: Rp ${input.amount.toLocaleString('id-ID')}`
        );
        
        return transaction;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        type: z.enum(['income', 'expense']).optional(),
        amount: z.number().int().positive().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const { id, ...updates } = input;
        await db.updateTransaction(id, user.id, updates);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'transaction',
          action: 'update',
          description: `Transaksi diperbarui: ${updates.description || 'Rp ' + updates.amount?.toLocaleString('id-ID')}`,
        });
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteTransaction(input.id, user.id);
        
        // Log activity to database
        await activityLogger.logTransactionActivity(user.id, 'delete', 'Transaksi dihapus');
        
        return { success: true };
      }),

    deleteAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteAllTransactions(user.id);
        
        // Log activity to database
        await activityLogger.logTransactionActivity(user.id, 'delete', 'Semua transaksi dihapus');
        
        return { success: true };
      }),
  }),

  installments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || !user.id) throw new Error("User not found");
      return await db.getUserInstallments(user.id);
    }),

    deleteAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteAllInstallments(user.id);
        
        // Log activity to database
        await activityLogger.logActivity({
          userId: user.id,
          type: 'installment',
          action: 'delete',
          description: 'Semua cicilan dihapus',
        });
        
        return { success: true };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        totalAmount: z.number().int().positive(),
        monthlyAmount: z.number().int().positive(),
        startYear: z.number().int(),
        startMonth: z.number().int().min(1).max(12),
        durationMonths: z.number().int().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const installment = {
          id: `${Date.now()}-${Math.random()}`,
          userId: user.id,
          ...input,
        };
        
        await db.createInstallment(installment);
        
        // Create installment payments
        for (let i = 0; i < input.durationMonths; i++) {
          let month = input.startMonth + i;
          let year = input.startYear;
          
          if (month > 12) {
            year += Math.floor(month / 12);
            month = month % 12 || 12;
          }
          
          await db.createInstallmentPayment({
            id: `${Date.now()}-${Math.random()}-${i}`,
            installmentId: installment.id,
            month,
            year,
            amount: input.monthlyAmount,
            isPaid: 0,
          });
        }
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'installment',
          action: 'create',
          description: `Cicilan ditambahkan: ${input.name}`,
        });
        
        return installment;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteInstallment(input.id, user.id);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'installment',
          action: 'delete',
          description: `Cicilan dihapus`,
        });
        
        return { success: true };
      }),

    payments: router({
      list: protectedProcedure
        .input(z.object({ installmentId: z.string() }))
        .query(async ({ input }) => {
          return await db.getInstallmentPayments(input.installmentId);
        }),

      toggle: protectedProcedure
        .input(z.object({
          paymentId: z.string(),
          isPaid: z.number().int(),
        }))
        .mutation(async ({ ctx, input }) => {
          const user = ctx.user;
          if (!user || !user.id) throw new Error("User not found");
          
          await db.updateInstallmentPayment(input.paymentId, user.id, {
            isPaid: input.isPaid,
            paidDate: input.isPaid === 1 ? new Date() : null,
          });
          
          return { success: true };
        }),
    }),
  }),

  savings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || !user.id) throw new Error("User not found");
      return await db.getUserSavings(user.id);
    }),

    deleteAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteAllSavings(user.id);
        
        // Log activity to database
        await activityLogger.logActivity({
          userId: user.id,
          type: 'saving',
          action: 'delete',
          description: 'Semua tabungan dihapus',
        });
        
        return { success: true };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        category: z.string(),
        targetAmount: z.number().int().positive(),
        currentAmount: z.number().int().nonnegative().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const saving = {
          id: `${Date.now()}-${Math.random()}`,
          userId: user.id,
          currentAmount: input.currentAmount || 0,
          ...input,
        };
        
        await db.createSaving(saving);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'saving',
          action: 'create',
          description: `Target tabungan ditambahkan: ${input.name}`,
        });
        
        return saving;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        category: z.string().optional(),
        targetAmount: z.number().int().positive().optional(),
        currentAmount: z.number().int().nonnegative().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const { id, ...updates } = input;
        await db.updateSaving(id, user.id, updates);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'saving',
          action: 'update',
          description: `Target tabungan diperbarui`,
        });
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteSaving(input.id, user.id);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'saving',
          action: 'delete',
          description: `Target tabungan dihapus`,
        });
        
        return { success: true };
      }),
  }),
  budgets: router({
    deleteAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteAllBudgets(user.id);
        
        // Log activity to database
        await activityLogger.logActivity({
          userId: user.id,
          type: 'budget',
          action: 'delete',
          description: 'Semua budget dihapus',
        });
        
        return { success: true };
      }),

    list: protectedProcedure
      .input(budgetListSchema)
      .query(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        return await db.getUserBudgets(user.id, input.month, input.year);
      }),

    create: protectedProcedure
      .input(z.object({
        category: z.string(),
        limit: z.number().int().positive(),
        month: z.number().int().min(1).max(12),
        year: z.number().int(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const budget = {
          id: `${Date.now()}-${Math.random()}`,
          userId: user.id,
          ...input,
        };
        
        await db.createBudget(budget);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'transaction',
          action: 'create',
          description: `Budget ditambahkan untuk kategori ${input.category}`,
        });
        
        return budget;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        category: z.string().optional(),
        limit: z.number().int().positive().optional(),
        month: z.number().int().min(1).max(12).optional(),
        year: z.number().int().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const { id, ...updates } = input;
        await db.updateBudget(id, user.id, updates);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'transaction',
          action: 'update',
          description: `Budget diperbarui`,
        });
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteBudget(input.id, user.id);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'transaction',
          action: 'delete',
          description: `Budget dihapus`,
        });
        
        return { success: true };
      }),
  }),

  activityLogs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || !user.id) throw new Error("User not found");
      return await db.getUserActivityLogs(user.id);
    }),
  }),

  // Cloud Backup Routers
  backup: router({
    create: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || !user.id) throw new Error("User not found");
      
      try {
        const result = await cloudBackup.createCloudBackup(user.id);
        
        // Log backup activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'backup',
          action: 'create',
          description: `Cloud backup dibuat: ${result.metadata.recordCounts.transactions} transaksi, ${result.metadata.recordCounts.installments} cicilan`,
        });
        
        return result;
      } catch (error) {
        console.error('[Backup] Failed to create backup:', error);
        throw new Error('Gagal membuat backup');
      }
    }),

    restore: protectedProcedure
      .input(z.object({
        backupKey: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        try {
          const backupData = await cloudBackup.restoreCloudBackup(user.id, input.backupKey);
          
          // Log restore activity
          await activityLogger.logActivity({
            userId: user.id,
            type: 'backup',
            action: 'restore',
            description: `Cloud backup di-restore: ${backupData.metadata.recordCounts.transactions} transaksi, ${backupData.metadata.recordCounts.installments} cicilan`,
          });
          
          return { success: true, data: backupData };
        } catch (error) {
          console.error('[Backup] Failed to restore backup:', error);
          throw new Error('Gagal me-restore backup');
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || !user.id) throw new Error("User not found");
      
      try {
        return await cloudBackup.listUserBackups(user.id);
      } catch (error) {
        console.error('[Backup] Failed to list backups:', error);
        return [];
      }
    }),
  }),

  // Admin Routers (admin-only access)
  admin: router({
    getAllUsers: protectedProcedure
      .input(z.object({
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        if (user.role !== 'admin') throw new Error("Unauthorized: Admin access required");
        
        return await adminService.getAllUsers(input.limit, input.offset);
      }),

    getTotalUserCount: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || !user.id) throw new Error("User not found");
      if (user.role !== 'admin') throw new Error("Unauthorized: Admin access required");
      
      return await adminService.getTotalUserCount();
    }),

    getAllActivityLogs: protectedProcedure
      .input(z.object({
        limit: z.number().int().positive().default(100),
        offset: z.number().int().nonnegative().default(0),
        userId: z.number().int().optional(),
        type: z.string().optional(),
        action: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        if (user.role !== 'admin') throw new Error("Unauthorized: Admin access required");
        
        return await adminService.getAllActivityLogs(input.limit, input.offset, {
          userId: input.userId,
          type: input.type,
          action: input.action,
          startDate: input.startDate,
          endDate: input.endDate,
        });
      }),

    getAdminStats: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || !user.id) throw new Error("User not found");
      if (user.role !== 'admin') throw new Error("Unauthorized: Admin access required");
      
      return await adminService.getAdminStats();
    }),

    getUserDetails: protectedProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        if (user.role !== 'admin') throw new Error("Unauthorized: Admin access required");
        
        return await adminService.getUserDetails(input.userId);
      }),

    updateUserRole: protectedProcedure
      .input(z.object({
        userId: z.number().int().positive(),
        newRole: z.enum(['user', 'admin']),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        if (user.role !== 'admin') throw new Error("Unauthorized: Admin access required");
        
        await adminService.updateUserRole(input.userId, input.newRole);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'transaction',
          action: 'update',
          description: `User ${input.userId} role updated to ${input.newRole}`,
        });
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
