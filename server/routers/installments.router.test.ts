/**
 * Installments Router Tests
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

describe('Installments Router', () => {
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

  describe('installments.create', () => {
    it('should create installment with valid data', async () => {
      vi.mocked(db.createInstallment).mockResolvedValue(undefined);
      vi.mocked(db.createInstallmentPayment).mockResolvedValue(undefined);
      vi.mocked(activityLogger.logActivity).mockResolvedValue(undefined);

      const result = await caller.installments.create({
        name: 'Laptop Purchase',
        totalAmount: 12000000, // Rp 12,000,000
        monthlyAmount: 1000000, // Rp 1,000,000/bulan
        startYear: 2026,
        startMonth: 4,
        durationMonths: 12,
      });

      expect(result.id).toBe('inst-mock-id-12345');
      expect(result.userId).toBe(1);
      expect(result.name).toBe('Laptop Purchase');
      expect(db.createInstallment).toHaveBeenCalledOnce();
      // Should create 12 payment records
      expect(db.createInstallmentPayment).toHaveBeenCalledTimes(12);
    });

    it('should reject when monthly amount > total amount', async () => {
      await expect(
        caller.installments.create({
          name: 'Phone',
          totalAmount: 5000000,
          monthlyAmount: 6000000, // More than total!
          startYear: 2026,
          startMonth: 4,
          durationMonths: 12,
        })
      ).rejects.toThrow();
    });

    it('should reject invalid duration', async () => {
      await expect(
        caller.installments.create({
          name: 'Laptop',
          totalAmount: 12000000,
          monthlyAmount: 1000000,
          startYear: 2026,
          startMonth: 4,
          durationMonths: 361, // Max 360
        })
      ).rejects.toThrow();
    });

    it('should reject invalid month', async () => {
      await expect(
        caller.installments.create({
          name: 'Laptop',
          totalAmount: 12000000,
          monthlyAmount: 1000000,
          startYear: 2026,
          startMonth: 13, // Invalid month
          durationMonths: 12,
        })
      ).rejects.toThrow();
    });

    it('should reject negative amounts', async () => {
      await expect(
        caller.installments.create({
          name: 'Laptop',
          totalAmount: -12000000,
          monthlyAmount: 1000000,
          startYear: 2026,
          startMonth: 4,
          durationMonths: 12,
        })
      ).rejects.toThrow();
    });
  });

  describe('installments.delete', () => {
    it('should delete installment successfully', async () => {
      vi.mocked(db.deleteInstallment).mockResolvedValue(undefined);
      vi.mocked(activityLogger.logActivity).mockResolvedValue(undefined);

      const result = await caller.installments.delete({ id: 'inst-123' });

      expect(result).toEqual({ success: true });
      expect(db.deleteInstallment).toHaveBeenCalledWith('inst-123', 1);
    });
  });

  describe('installments.payments.toggle', () => {
    it('should toggle payment status', async () => {
      vi.mocked(db.updateInstallmentPayment).mockResolvedValue(undefined);

      const result = await caller.installments.payments.toggle({
        installmentId: 'inst-123',
        month: 4,
        year: 2026,
        isPaid: true,
      });

      expect(result).toEqual({ success: true });
      expect(db.updateInstallmentPayment).toHaveBeenCalled();
    });

    it('should reject invalid month', async () => {
      await expect(
        caller.installments.payments.toggle({
          installmentId: 'inst-123',
          month: 13,
          year: 2026,
          isPaid: true,
        })
      ).rejects.toThrow();
    });
  });
});
