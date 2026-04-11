import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTransaction, getUserTransactions, updateTransaction, deleteTransaction, getDb } from './db';

describe('Transactions Router', () => {
  const testUserId = 999;
  const testTransactionId = `test-transaction-${Date.now()}`;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      console.warn('Database not available for testing');
    }
  });

  it('should create a transaction', async () => {
    const db = await getDb();
    if (!db) {
      console.warn('Skipping test: database not available');
      return;
    }

    const result = await createTransaction({
      id: testTransactionId,
      userId: testUserId,
      type: 'income',
      amount: 100000,
      category: 'Gaji',
      description: 'Test transaction',
      date: '2026-04-07',
    });

    expect(result).toBeDefined();
  });

  it('should get user transactions', async () => {
    const db = await getDb();
    if (!db) {
      console.warn('Skipping test: database not available');
      return;
    }

    const transactions = await getUserTransactions(testUserId);
    expect(Array.isArray(transactions)).toBe(true);
  });

  it('should update a transaction', async () => {
    const db = await getDb();
    if (!db) {
      console.warn('Skipping test: database not available');
      return;
    }

    const result = await updateTransaction(testTransactionId, testUserId, {
      amount: 150000,
      description: 'Updated test transaction',
    });

    expect(result).toBeDefined();
  });

  it('should delete a transaction', async () => {
    const db = await getDb();
    if (!db) {
      console.warn('Skipping test: database not available');
      return;
    }

    const result = await deleteTransaction(testTransactionId);
    expect(result).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup
    const db = await getDb();
    if (db) {
      try {
        await deleteTransaction(testTransactionId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
});
