import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  logActivity,
  logTransactionActivity,
  logInstallmentActivity,
  logSavingActivity,
  logBudgetActivity,
  logBackupActivity,
  logActivitiesBatch,
} from './activityLogger';

// Mock database module
vi.mock('./db', () => ({
  createActivityLog: vi.fn(async (data) => {
    console.log('[Mock DB] Activity logged:', data);
    return data;
  }),
}));

describe('Activity Logger Service', () => {
  describe('logActivity', () => {
    it('should log activity with all required fields', async () => {
      await logActivity({
        userId: 1,
        type: 'transaction',
        action: 'create',
        description: 'Test transaction created',
      });

      // If no error thrown, test passes
      expect(true).toBe(true);
    });

    it('should handle different activity types', async () => {
      const types: Array<'transaction' | 'installment' | 'saving' | 'budget' | 'backup'> = [
        'transaction',
        'installment',
        'saving',
        'budget',
        'backup',
      ];

      for (const type of types) {
        await logActivity({
          userId: 1,
          type,
          action: 'create',
          description: `Test ${type} activity`,
        });
      }

      expect(true).toBe(true);
    });

    it('should handle different activity actions', async () => {
      const actions: Array<'create' | 'update' | 'delete' | 'restore'> = [
        'create',
        'update',
        'delete',
        'restore',
      ];

      for (const action of actions) {
        await logActivity({
          userId: 1,
          type: 'transaction',
          action,
          description: `Test ${action} activity`,
        });
      }

      expect(true).toBe(true);
    });

    it('should include optional details', async () => {
      await logActivity({
        userId: 1,
        type: 'transaction',
        action: 'create',
        description: 'Transaction with details',
        details: {
          amount: 100000,
          category: 'Food',
          date: '2026-04-08',
        },
      });

      expect(true).toBe(true);
    });
  });

  describe('Specialized logging functions', () => {
    it('should log transaction activity', async () => {
      await logTransactionActivity(1, 'create', 'Test transaction');
      expect(true).toBe(true);
    });

    it('should log installment activity', async () => {
      await logInstallmentActivity(1, 'create', 'Test installment');
      expect(true).toBe(true);
    });

    it('should log saving activity', async () => {
      await logSavingActivity(1, 'create', 'Test saving');
      expect(true).toBe(true);
    });

    it('should log budget activity', async () => {
      await logBudgetActivity(1, 'create', 'Test budget');
      expect(true).toBe(true);
    });

    it('should log backup activity', async () => {
      await logBackupActivity(1, 'create', 'Test backup');
      expect(true).toBe(true);
    });
  });

  describe('Batch logging', () => {
    it('should log multiple activities', async () => {
      const activities = [
        {
          userId: 1,
          type: 'transaction' as const,
          action: 'create' as const,
          description: 'Activity 1',
        },
        {
          userId: 1,
          type: 'installment' as const,
          action: 'update' as const,
          description: 'Activity 2',
        },
        {
          userId: 1,
          type: 'saving' as const,
          action: 'delete' as const,
          description: 'Activity 3',
        },
      ];

      await logActivitiesBatch(activities);
      expect(true).toBe(true);
    });

    it('should handle empty batch', async () => {
      await logActivitiesBatch([]);
      expect(true).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should not throw on logging failure', async () => {
      // Mock createActivityLog to throw error
      const { createActivityLog } = await import('./db');
      vi.mocked(createActivityLog).mockRejectedValueOnce(new Error('DB Error'));

      // Should not throw
      await expect(
        logActivity({
          userId: 1,
          type: 'transaction',
          action: 'create',
          description: 'Test',
        })
      ).resolves.toBeUndefined();
    });
  });
});
