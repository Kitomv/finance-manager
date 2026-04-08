import { useState, useEffect } from 'react';
import { useActivityLog } from './useActivityLog';
import { trpc } from '@/lib/trpc';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  timestamp?: number;
}

const STORAGE_KEY = 'finance-manager-transactions';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useDatabase, setUseDatabase] = useState(false);

  // Try to use tRPC queries
  const { data: dbTransactions, isLoading: dbLoading } = trpc.transactions.list.useQuery(undefined, {
    enabled: useDatabase,
  });

  const createMutation = trpc.transactions.create.useMutation();
  const updateMutation = trpc.transactions.update.useMutation();
  const deleteMutation = trpc.transactions.delete.useMutation();

  // Load transactions from database or localStorage on mount
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Check if user is authenticated
        const user = await trpc.auth.me.useQuery().data;
        if (user) {
          setUseDatabase(true);
        }
      } catch (error) {
        console.log('Database not available, using localStorage');
      }
    };

    checkDatabase();

    // Load from localStorage as fallback
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

  // Update transactions when database data changes
  useEffect(() => {
    if (useDatabase && dbTransactions) {
      const formattedTransactions = dbTransactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description || '',
        date: t.date,
        timestamp: t.createdAt?.getTime() || Date.now(),
      }));
      setTransactions(formattedTransactions);
    }
  }, [dbTransactions, useDatabase]);

  // Save transactions to localStorage whenever they change (fallback)
  useEffect(() => {
    if (isLoaded && !useDatabase) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoaded, useDatabase]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    if (useDatabase) {
      try {
        await createMutation.mutateAsync({
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
        });
      } catch (error) {
        console.error('Failed to create transaction:', error);
        // Fallback to localStorage
        setTransactions((prev) => [newTransaction, ...prev]);
      }
    } else {
      setTransactions((prev) => [newTransaction, ...prev]);
    }

    return newTransaction;
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'timestamp'>>) => {
    if (useDatabase) {
      try {
        await updateMutation.mutateAsync({
          id,
          ...updates,
        });
      } catch (error) {
        console.error('Failed to update transaction:', error);
        // Fallback to localStorage
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        );
      }
    } else {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    }
  };

  const deleteTransaction = async (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    
    if (useDatabase) {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        // Fallback to localStorage
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      }
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
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
    isLoaded: isLoaded && (!useDatabase || !dbLoading),
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
