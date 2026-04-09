/**
 * Centralized Zod validators for all API inputs
 * These schemas ensure type-safe and validated data throughout the application
 */

import { z } from 'zod';

// ============================================================================
// UTILITY VALIDATORS
// ============================================================================

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate YYYY-MM-DD format and actual date validity
 */
const dateStringSchema = z
  .string()
  .regex(dateRegex, 'Format tanggal harus YYYY-MM-DD')
  .refine((date) => {
    const d = new Date(date + 'T00:00:00Z');
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Tanggal tidak valid')
  .refine((date) => {
    const d = new Date(date + 'T00:00:00Z');
    return d <= new Date();
  }, 'Tanggal tidak boleh di masa depan');

/**
 * Amount in cents (integer, positive)
 */
const amountSchema = z
  .number({
    required_error: 'Jumlah wajib diisi',
    invalid_type_error: 'Jumlah harus berupa angka',
  })
  .int('Jumlah harus berupa bilangan bulat')
  .positive('Jumlah harus positif')
  .max(999999999, 'Jumlah terlalu besar (max 9,999,999.99)');

/**
 * Category name (1-64 characters, alphanumeric + common punctuation)
 */
const categorySchema = z
  .string()
  .min(1, 'Kategori wajib diisi')
  .max(64, 'Kategori maksimal 64 karakter')
  .regex(
    /^[a-zA-Z0-9\s\-_áàäâãèéëêìíîïòóôõùúûüñç]+$/i,
    'Kategori hanya boleh huruf, angka, spasi, dash, dan underscore'
  );

/**
 * Description (optional, max 500 characters)
 */
const descriptionSchema = z
  .string()
  .max(500, 'Deskripsi maksimal 500 karakter')
  .optional()
  .default('');

/**
 * Name field (1-255 characters)
 */
const nameSchema = z
  .string()
  .min(1, 'Nama wajib diisi')
  .max(255, 'Nama maksimal 255 karakter');

/**
 * Month (1-12)
 */
const monthSchema = z
  .number()
  .int()
  .min(1, 'Bulan harus 1-12')
  .max(12, 'Bulan harus 1-12');

/**
 * Year (2000-2099)
 */
const yearSchema = z
  .number()
  .int()
  .min(2000, 'Tahun minimal 2000')
  .max(2099, 'Tahun maksimal 2099');

// ============================================================================
// TRANSACTION VALIDATORS
// ============================================================================

export const transactionCreateSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipe harus income atau expense' }),
  }),
  amount: amountSchema,
  category: categorySchema,
  description: descriptionSchema,
  date: dateStringSchema,
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;

export const transactionUpdateSchema = z.object({
  id: z.string().min(1, 'ID transaksi wajib diisi'),
  type: z.enum(['income', 'expense']).optional(),
  amount: amountSchema.optional(),
  category: categorySchema.optional(),
  description: descriptionSchema.optional(),
  date: dateStringSchema.optional(),
});

export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;

export const transactionDeleteSchema = z.object({
  id: z.string().min(1, 'ID transaksi wajib diisi'),
});

export type TransactionDeleteInput = z.infer<typeof transactionDeleteSchema>;

// ============================================================================
// INSTALLMENT VALIDATORS
// ============================================================================

export const installmentCreateSchema = z
  .object({
    name: nameSchema,
    totalAmount: amountSchema,
    monthlyAmount: amountSchema,
    startYear: yearSchema,
    startMonth: monthSchema,
    durationMonths: z
      .number()
      .int()
      .min(1, 'Durasi minimal 1 bulan')
      .max(360, 'Durasi maksimal 360 bulan (30 tahun)'),
  })
  .refine(
    (data) => data.monthlyAmount <= data.totalAmount,
    {
      message: 'Jumlah cicilan per bulan tidak boleh lebih dari total',
      path: ['monthlyAmount'],
    }
  );

export type InstallmentCreateInput = z.infer<typeof installmentCreateSchema>;

export const installmentUpdateSchema = z
  .object({
    id: z.string().min(1, 'ID cicilan wajib diisi'),
    name: nameSchema.optional(),
    totalAmount: amountSchema.optional(),
    monthlyAmount: amountSchema.optional(),
    startYear: yearSchema.optional(),
    startMonth: monthSchema.optional(),
    durationMonths: z
      .number()
      .int()
      .min(1, 'Durasi minimal 1 bulan')
      .max(360, 'Durasi maksimal 360 bulan (30 tahun)')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.monthlyAmount && data.totalAmount) {
        return data.monthlyAmount <= data.totalAmount;
      }
      return true;
    },
    {
      message: 'Jumlah cicilan per bulan tidak boleh lebih dari total',
      path: ['monthlyAmount'],
    }
  );

export type InstallmentUpdateInput = z.infer<typeof installmentUpdateSchema>;

export const installmentPaymentToggleSchema = z.object({
  installmentId: z.string().min(1, 'ID cicilan wajib diisi'),
  month: monthSchema,
  year: yearSchema,
  isPaid: z.boolean(),
});

export type InstallmentPaymentToggleInput = z.infer<
  typeof installmentPaymentToggleSchema
>;

export const installmentDeleteSchema = z.object({
  id: z.string().min(1, 'ID cicilan wajib diisi'),
});

export type InstallmentDeleteInput = z.infer<typeof installmentDeleteSchema>;

// ============================================================================
// SAVINGS VALIDATORS
// ============================================================================

export const savingCreateSchema = z.object({
  name: nameSchema,
  category: categorySchema,
  targetAmount: amountSchema,
});

export type SavingCreateInput = z.infer<typeof savingCreateSchema>;

export const savingUpdateSchema = z.object({
  id: z.string().min(1, 'ID tabungan wajib diisi'),
  name: nameSchema.optional(),
  category: categorySchema.optional(),
  targetAmount: amountSchema.optional(),
  currentAmount: amountSchema.optional(),
});

export type SavingUpdateInput = z.infer<typeof savingUpdateSchema>;

export const savingDeleteSchema = z.object({
  id: z.string().min(1, 'ID tabungan wajib diisi'),
});

export type SavingDeleteInput = z.infer<typeof savingDeleteSchema>;

export const savingAddAmountSchema = z.object({
  id: z.string().min(1, 'ID tabungan wajib diisi'),
  amount: amountSchema,
});

export type SavingAddAmountInput = z.infer<typeof savingAddAmountSchema>;

// ============================================================================
// BUDGET VALIDATORS
// ============================================================================

export const budgetCreateSchema = z.object({
  category: categorySchema,
  limit: amountSchema,
  month: monthSchema,
  year: yearSchema,
});

export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;

export const budgetUpdateSchema = z.object({
  id: z.string().min(1, 'ID budget wajib diisi'),
  category: categorySchema.optional(),
  limit: amountSchema.optional(),
  month: monthSchema.optional(),
  year: yearSchema.optional(),
});

export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>;

export const budgetDeleteSchema = z.object({
  id: z.string().min(1, 'ID budget wajib diisi'),
});

export type BudgetDeleteInput = z.infer<typeof budgetDeleteSchema>;

// ============================================================================
// LIST/PAGINATION VALIDATORS
// ============================================================================

export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .positive('Halaman harus positif')
    .default(1),
  limit: z
    .number()
    .int()
    .min(1, 'Limit minimal 1')
    .max(100, 'Limit maksimal 100')
    .default(20),
  sortBy: z.enum(['date', 'amount', 'name']).default('date').optional(),
  order: z.enum(['asc', 'desc']).default('desc').optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const transactionListSchema = paginationSchema.extend({
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
});

export type TransactionListInput = z.infer<typeof transactionListSchema>;

export const installmentListSchema = paginationSchema;
export type InstallmentListInput = z.infer<typeof installmentListSchema>;

export const savingListSchema = paginationSchema;
export type SavingListInput = z.infer<typeof savingListSchema>;

export const budgetListSchema = paginationSchema;
export type BudgetListInput = z.infer<typeof budgetListSchema>;

// ============================================================================
// API RESPONSE VALIDATORS
// ============================================================================

export const paginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
