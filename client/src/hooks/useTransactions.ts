import { useState, useEffect } from 'react';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  timestamp: number;
}

const STORAGE_KEY = 'finance-manager-transactions';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTransactions(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse transactions from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
    return newTransaction;
  };

  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id' | 'timestamp'>>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const getTotalIncome = () => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = () => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpense();
  };

  const getTransactionsByMonth = (year: number, month: number) => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  };

  const importTransactions = (importedData: Transaction[]) => {
    setTransactions((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newTransactions = importedData.filter(
        (t) => !existingIds.has(t.id)
      );
      return [...newTransactions, ...prev].sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      );
    });
  };

  return {
    transactions,
    isLoaded,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTotalIncome,
    getTotalExpense,
    getBalance,
    getTransactionsByMonth,
    importTransactions,
  };
}
