import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useNotification } from '@/contexts/NotificationContext';
import { TRPCClientError } from '@trpc/client';
import type { TransactionCreateInput } from '@shared/validators';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  timestamp?: number;
}

/**
 * Friendly error message mapping for tRPC error codes
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof TRPCClientError) {
    const zodErrors = error.data?.zodError?.fieldErrors;
    if (zodErrors) {
      const firstError = Object.values(zodErrors)[0]?.[0];
      if (firstError) return firstError;
    }

    switch (error.data?.code) {
      case 'UNAUTHORIZED':
        return 'Anda perlu login terlebih dahulu';
      case 'BAD_REQUEST':
        return 'Data tidak valid. Periksa kembali input Anda';
      case 'NOT_FOUND':
        return 'Transaksi tidak ditemukan. Mungkin sudah dihapus pengguna lain';
      case 'CONFLICT':
        return 'Konflik data. Silakan refresh dan coba lagi';
      case 'INTERNAL_SERVER_ERROR':
        return 'Terjadi kesalahan pada server. Coba lagi nanti';
      case 'TOO_MANY_REQUESTS':
        return 'Terlalu banyak permintaan. Tunggu beberapa saat';
      default:
        return error.message || 'Gagal memproses transaksi';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Terjadi kesalahan yang tidak diketahui';
};

export function useTransactions() {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotification();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch transactions from database with proper cache settings
  const { data: dbTransactions, isLoading: dbLoading, refetch } = trpc.transactions.list.useQuery(
    { page: 1, limit: 20 },
    {
      enabled: isAuthenticated && !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    }
  );

  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: (data) => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Transaksi Berhasil Ditambahkan',
        message: `${data.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${(data.amount / 100).toLocaleString('id-ID')} telah disimpan`,
        duration: 5000,
      });
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Menambah Transaksi',
        message: errorMsg,
        duration: 6000,
      });
    },
  });

  const updateMutation = trpc.transactions.update.useMutation({
    onSuccess: () => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Transaksi Diperbarui',
        message: 'Perubahan telah disimpan',
        duration: 4000,
      });
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Memperbarui Transaksi',
        message: errorMsg,
        duration: 6000,
      });
    },
  });

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Transaksi Dihapus',
        message: 'Transaksi telah dihapus dengan aman',
        duration: 4000,
      });
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Menghapus Transaksi',
        message: errorMsg,
        duration: 6000,
      });
    },
  });

  // Update transactions from database
  useEffect(() => {
    if (dbTransactions) {
      setTransactions(dbTransactions.data || []);
    }
    setIsLoading(dbLoading);
  }, [dbTransactions, dbLoading]);

  /**
   * Create a new transaction with validation
   */
  const createTransaction = async (transaction: Omit<TransactionCreateInput, 'id'>) => {
    try {
      await createMutation.mutateAsync(transaction);
    } catch (error) {
      // Error already handled in mutation callbacks
      throw error;
    }
  };

  /**
   * Update an existing transaction
   */
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await updateMutation.mutateAsync({
        id,
        ...updates,
      });
    } catch (error) {
      // Error already handled in mutation callbacks
      throw error;
    }
  };

  /**
   * Delete a transaction with confirmation
   */
  const deleteTransaction = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      // Error already handled in mutation callbacks
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
        description: transaction.description || '',
        date: transaction.date,
      });
    }
  };

  return {
    transactions,
    isLoading,
    isLoaded: !isLoading,
    createTransaction,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getBalance,
    getTotalIncome,
    getTotalExpense,
    importTransactions,
    // Mutation states for UI feedback
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
    updateTransaction,
    deleteTransaction,
    addTransaction,
    getBalance,
    getTotalIncome,
    getTotalExpense,
    importTransactions,
  };
}
