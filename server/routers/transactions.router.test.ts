/**
 * Transaction Router Tests
 * Tests for transactions.create, transactions.update, transactions.delete, transactions.list
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import * as db from '../db';
import * as activityLogger from '../activityLogger';
import { appRouter } from '../routers';

// Mock dependencies
vi.mock('../db');
vi.mock('../activityLogger');
vi.mock('../id-generator', () => ({
  generateId: (prefix: string) => `${prefix}-mock-id-12345`,
}));

describe('Transactions Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  const mockUser = {
    id: 1,
    role: 'user' as const,
    name: 'Test User',
    email: 'test@example.com',
    openId: 'test-open-id',
    loginMethod: 'google',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a caller with mock user context
    caller = appRouter.createCaller({
      user: mockUser,
      req: {} as any,
      res: {} as any,
    });
  });

  describe('transactions.create', () => {
    it('should create transaction with valid data', async () => {
      const mockTransaction = {
        id: 'tx-mock-id-12345',
        userId: 1,
        type: 'income' as const,
        amount: 100000,
        category: 'Salary',
        description: 'Monthly salary',
        date: '2026-04-09',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createTransaction).mockResolvedValue(undefined);
      vi.mocked(activityLogger.logTransactionActivity).mockResolvedValue(undefined);

      const result = await caller.transactions.create({
        type: 'income',
        amount: 100000,
        category: 'Salary',
        description: 'Monthly salary',
        date: '2026-04-09',
      });

      expect(result.id).toBe('tx-mock-id-12345');
      expect(result.userId).toBe(1);
      expect(result.type).toBe('income');
      expect(result.amount).toBe(100000);
      expect(db.createTransaction).toHaveBeenCalledOnce();
      expect(activityLogger.logTransactionActivity).toHaveBeenCalledOnce();
    });

    it('should reject negative amounts', async () => {
      await expect(
        caller.transactions.create({
          type: 'income',
          amount: -1000,
          category: 'Salary',
          date: '2026-04-09',
        })
      ).rejects.toThrow();
    });

    it('should reject invalid date format', async () => {
      await expect(
        caller.transactions.create({
          type: 'income',
          amount: 100000,
          category: 'Salary',
          date: 'invalid-date',
        })
      ).rejects.toThrow();
    });

    it('should reject date in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await expect(
        caller.transactions.create({
          type: 'income',
          amount: 100000,
          category: 'Salary',
          date: futureDateStr,
        })
      ).rejects.toThrow();
    });

    it('should reject zero amounts', async () => {
      await expect(
        caller.transactions.create({
          type: 'income',
          amount: 0,
          category: 'Salary',
          date: '2026-04-09',
        })
      ).rejects.toThrow('Jumlah harus positif');
    });

    it('should reject missing required fields', async () => {
      await expect(
        caller.transactions.create({
          type: 'income',
          amount: 100000,
          category: '',
          date: '2026-04-09',
        })
      ).rejects.toThrow();
    });
  });

  describe('transactions.update', () => {
    it('should update transaction successfully', async () => {
      vi.mocked(db.updateTransaction).mockResolvedValue(undefined);
      vi.mocked(activityLogger.logActivity).mockResolvedValue(undefined);

      const result = await caller.transactions.update({
        id: 'tx-123',
        amount: 150000,
        category: 'Bonus',
        description: 'Updated description',
      });

      expect(result).toEqual({ success: true });
      expect(db.updateTransaction).toHaveBeenCalledWith('tx-123', 1, {
        amount: 150000,
        category: 'Bonus',
        description: 'Updated description',
      });
      expect(activityLogger.logActivity).toHaveBeenCalledOnce();
    });

    it('should reject invalid amount', async () => {
      await expect(
        caller.transactions.update({
          id: 'tx-123',
          amount: -100,
        })
      ).rejects.toThrow('Jumlah harus positif');
    });

    it('should allow partial updates', async () => {
      vi.mocked(db.updateTransaction).mockResolvedValue(undefined);
      vi.mocked(activityLogger.logActivity).mockResolvedValue(undefined);

      const result = await caller.transactions.update({
        id: 'tx-123',
        category: 'NewCategory',
      });

      expect(result).toEqual({ success: true });
      expect(db.updateTransaction).toHaveBeenCalledWith('tx-123', 1, {
        category: 'NewCategory',
      });
    });
  });

  describe('transactions.delete', () => {
    it('should delete transaction successfully', async () => {
      vi.mocked(db.deleteTransaction).mockResolvedValue(undefined);
      vi.mocked(activityLogger.logTransactionActivity).mockResolvedValue(undefined);

      const result = await caller.transactions.delete({ id: 'tx-123' });

      expect(result).toEqual({ success: true });
      expect(db.deleteTransaction).toHaveBeenCalledWith('tx-123', 1);
      expect(activityLogger.logTransactionActivity).toHaveBeenCalledOnce();
    });

    it('should reject empty ID', async () => {
      await expect(
        caller.transactions.delete({ id: '' })
      ).rejects.toThrow();
    });
  });

  describe('transactions.list', () => {
    it('should list transactions with default pagination', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          userId: 1,
          type: 'income' as const,
          amount: 100000,
          category: 'Salary',
          date: '2026-04-09',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getUserTransactions).mockResolvedValue({
        data: mockTransactions,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      } as any);

      const result = await caller.transactions.list({ page: 1 });

      expect(result.data).toHaveLength(1);
      expect(db.getUserTransactions).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should reject unauthorized access when user is null', async () => {
      const unauthedCaller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        unauthedCaller.transactions.list({ page: 1 })
      ).rejects.toThrow();
    });

    it('should handle limit boundaries', async () => {
      // Limit too high
      await expect(
        caller.transactions.list({ page: 1, limit: 101 })
      ).rejects.toThrow();

      // Limit too low
      await expect(
        caller.transactions.list({ page: 1, limit: 0 })
      ).rejects.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should enforce enum types for transaction type', async () => {
      await expect(
        caller.transactions.create({
          type: 'invalid' as any,
          amount: 100000,
          category: 'Salary',
          date: '2026-04-09',
        })
      ).rejects.toThrow();
    });
  });
});
