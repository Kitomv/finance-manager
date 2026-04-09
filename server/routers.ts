import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as cloudBackup from "./cloudBackup";
import * as activityLogger from "./activityLogger";
import * as adminService from "./adminService";
import { generateId } from "./id-generator";
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionDeleteSchema,
  transactionListSchema,
  installmentCreateSchema,
  installmentDeleteSchema,
  installmentListSchema,
  installmentPaymentToggleSchema,
  savingCreateSchema,
  savingUpdateSchema,
  savingDeleteSchema,
  savingListSchema,
  budgetCreateSchema,
  budgetUpdateSchema,
  budgetDeleteSchema,
  budgetListSchema,
} from "@shared/validators";

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
    list: protectedProcedure
      .input(transactionListSchema)
      .query(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        return await db.getUserTransactions(user.id, input);
      }),

    create: protectedProcedure
      .input(transactionCreateSchema)
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const transaction = {
          id: generateId('tx'),
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
      .input(transactionUpdateSchema)
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
      .input(transactionDeleteSchema)
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteTransaction(input.id, user.id);
        
        // Log activity to database
        await activityLogger.logTransactionActivity(user.id, 'delete', 'Transaksi dihapus');
        
        return { success: true };
      }),
  }),

  installments: router({
    list: protectedProcedure
      .input(installmentListSchema)
      .query(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        return await db.getUserInstallments(user.id);
      }),

    create: protectedProcedure
      .input(installmentCreateSchema)
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const installment = {
          id: generateId('inst'),
          userId: user.id,
          ...input,
        };
        
        await db.createInstallment(installment);
        
        // Create installment payments with proper date arithmetic
        const startDate = new Date(input.startYear, input.startMonth - 1, 1);
        
        for (let i = 0; i < input.durationMonths; i++) {
          const paymentDate = new Date(startDate);
          paymentDate.setMonth(paymentDate.getMonth() + i);
          
          const month = paymentDate.getMonth() + 1; // 1-12
          const year = paymentDate.getFullYear();
          
          await db.createInstallmentPayment({
            id: generateId('pay'),
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
      .input(installmentDeleteSchema)
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
        .query(async ({ ctx, input }) => {
          const user = ctx.user;
          if (!user || !user.id) throw new Error("User not found");
          
          // Verify installment belongs to current user
          const installments = await db.getUserInstallments(user.id);
          if (!installments.some(i => i.id === input.installmentId)) {
            throw new Error("Unauthorized: Installment not found");
          }
          
          return await db.getInstallmentPayments(input.installmentId, user.id);
        }),

      toggle: protectedProcedure
        .input(installmentPaymentToggleSchema)
        .mutation(async ({ ctx, input }) => {
          const user = ctx.user;
          if (!user || !user.id) throw new Error("User not found");
          
          // Only set paidDate when marking as paid, preserve it when unmarking
          const updates: any = { isPaid: input.isPaid ? 1 : 0 };
          if (input.isPaid) {
            updates.paidDate = new Date();
          }
          
          await db.updateInstallmentPaymentByDate(
            input.installmentId,
            input.month,
            input.year,
            user.id,
            updates
          );
          
          return { success: true };
        }),
    }),
  }),

  savings: router({
    list: protectedProcedure
      .input(savingListSchema)
      .query(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        return await db.getUserSavings(user.id);
      }),

    create: protectedProcedure
      .input(savingCreateSchema)
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const saving = {
          id: generateId('save'),
          userId: user.id,
          currentAmount: 0,
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
      .input(savingUpdateSchema)
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
      .input(savingDeleteSchema)
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
    list: protectedProcedure
      .input(budgetListSchema.extend({
        month: z.number().int().min(1).max(12).optional(),
        year: z.number().int().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        return await db.getUserBudgets(user.id, input.month, input.year);
      }),

    create: protectedProcedure
      .input(budgetCreateSchema)
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const budget = {
          id: generateId('budget'),
          userId: user.id,
          ...input,
        };
        
        await db.createBudget(budget);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'budget',
          action: 'create',
          description: `Budget ditambahkan untuk kategori ${input.category}`,
        });
        
        return budget;
      }),

    update: protectedProcedure
      .input(budgetUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        const { id, ...updates } = input;
        await db.updateBudget(id, user.id, updates);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'budget',
          action: 'update',
          description: `Budget diperbarui`,
        });
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(budgetDeleteSchema)
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user || !user.id) throw new Error("User not found");
        
        await db.deleteBudget(input.id, user.id);
        
        // Log activity
        await activityLogger.logActivity({
          userId: user.id,
          type: 'budget',
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
