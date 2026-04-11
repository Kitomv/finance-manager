import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  timestamp?: number;
}

export function useTransactions() {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch transactions from database
  const { data: dbTransactions, isLoading: dbLoading, refetch } = trpc.transactions.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user,
  });

  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateMutation = trpc.transactions.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Update transactions from database
  useEffect(() => {
    if (dbTransactions) {
      setTransactions(dbTransactions as Transaction[]);
    }
    setIsLoading(dbLoading);
  }, [dbTransactions, dbLoading]);

  const createTransaction = async (transaction: Omit<Transaction, 'id'>) => {
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
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await updateMutation.mutateAsync({
        id,
        ...updates,
      });
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  };

  // Helper methods for backward compatibility
  const addTransaction = createTransaction;
  const getBalance = () => {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  };
  const getTotalIncome = () => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  };
  const getTotalExpense = () => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  };
  const importTransactions = async (data: Transaction[]) => {
    for (const transaction of data) {
      await createTransaction({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
      });
    }
  };

  return {
    transactions,
    isLoading,
    isLoaded: !isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    addTransaction,
    getBalance,
    getTotalIncome,
    getTotalExpense,
    importTransactions,
  };
}
