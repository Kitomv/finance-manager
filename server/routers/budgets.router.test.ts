/**
 * Budgets Router Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as db from '../db';
import * as activityLogger from '../activityLogger';
import { appRouter } from '../routers';

vi.mock('../db');
vi.mock('../activityLogger');
vi.mock('../id-generator', () => ({
  generateId: (prefix: string) => `${prefix}-mock-id-12345`,
}));

describe('Budgets Router', () => {
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
    caller = appRouter.createCaller({
      user: mockUser,
      req: {} as any,
      res: {} as any,
    });
  });

  describe('budgets.create', () => {
    it('should create budget with valid data', async () => {
      vi.mocked(db.createBudget).mockResolvedValue(undefined);
      vi.mocked(activityLogger.logActivity).mockResolvedValue(undefined);

      const result = await caller.budgets.create({
        category: 'Food',
        limit: 5000000, // Rp 5,000,000
        month: 4,
        year: 2026,
      });

      expect(result.id).toBe('budget-mock-id-12345');
      expect(result.userId).toBe(1);
      expect(result.category).toBe('Food');
      expect(result.limit).toBe(5000000);
      expect(db.createBudget).toHaveBeenCalledOnce();
    });

    it('should reject negative limit', async () => {
      await expect(
        caller.budgets.create({
          category: 'Food',
          limit: -5000000,
          month: 4,
          year: 2026,
        })
      ).rejects.toThrow();
    });

    it('should reject zero limit', async () => {
      await expect(
        caller.budgets.create({
          category: 'Food',
          limit: 0,
          month: 4,
          year: 2026,
        })
      ).rejects.toThrow();
    });

    it('should reject invalid month', async () => {
      await expect(
        caller.budgets.create({
          category: 'Food',
          limit: 5000000,
          month: 13,
          year: 2026,
        })
      ).rejects.toThrow();
    });

    it('should reject empty category', async () => {
      await expect(
        caller.budgets.create({
          category: '',
          limit: 5000000,
          month: 4,
          year: 2026,
        })
      ).rejects.toThrow();
    });
  });

  describe('budgets.update', () => {
    it('should update budget successfully', async () => {
      vi.mocked(db.updateBudget).mockResolvedValue(undefined);
      vi.mocked(activityLogger.logActivity).mockResolvedValue(undefined);

      const result = await caller.budgets.update({
        id: 'budget-123',
        limit: 6000000,
      });

      expect(result).toEqual({ success: true });
      expect(db.updateBudget).toHaveBeenCalledWith('budget-123', 1, {
        limit: 6000000,
      });
    });
  });

  describe('budgets.delete', () => {
    it('should delete budget successfully', async () => {
      vi.mocked(db.deleteBudget).mockResolvedValue(undefined);
      vi.mocked(activityLogger.logActivity).mockResolvedValue(undefined);

      const result = await caller.budgets.delete({ id: 'budget-123' });

      expect(result).toEqual({ success: true });
      expect(db.deleteBudget).toHaveBeenCalledWith('budget-123', 1);
    });
  });

  describe('budgets.list', () => {
    it('should list budgets with filter', async () => {
      const mockBudgets = [
        {
          id: 'budget-1',
          userId: 1,
          category: 'Food',
          limit: 5000000,
          month: 4,
          year: 2026,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getUserBudgets).mockResolvedValue({
        data: mockBudgets,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      } as any);

      const result = await caller.budgets.list({
        page: 1,
        month: 4,
        year: 2026,
      });

      expect(result.data).toHaveLength(1);
      expect(db.getUserBudgets).toHaveBeenCalled();
    });
  });
});
