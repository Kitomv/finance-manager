import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
        
        // Log activity
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
          userId: user.id,
          type: 'transaction',
          action: 'create',
          description: `Transaksi ${input.type === 'income' ? 'pemasukan' : 'pengeluaran'} ditambahkan: Rp ${input.amount.toLocaleString('id-ID')}`,
        });
        
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
        await db.updateTransaction(id, updates);
        
        // Log activity
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
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
        
        await db.deleteTransaction(input.id);
        
        // Log activity
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
          userId: user.id,
          type: 'transaction',
          action: 'delete',
          description: `Transaksi dihapus`,
        });
        
        return { success: true };
      }),
  }),

  installments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || !user.id) throw new Error("User not found");
      return await db.getUserInstallments(user.id);
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
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
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
        
        await db.deleteInstallment(input.id);
        
        // Log activity
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
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
          
          await db.updateInstallmentPayment(input.paymentId, {
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
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
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
        await db.updateSaving(id, updates);
        
        // Log activity
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
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
        
        await db.deleteSaving(input.id);
        
        // Log activity
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
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
      .input(z.object({
        month: z.number().int().min(1).max(12).optional(),
        year: z.number().int().optional(),
      }))
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
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
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
        await db.updateBudget(id, updates);
        
        // Log activity
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
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
        
        await db.deleteBudget(input.id);
        
        // Log activity
        await db.createActivityLog({
          id: `${Date.now()}-${Math.random()}`,
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
});

export type AppRouter = typeof appRouter;
