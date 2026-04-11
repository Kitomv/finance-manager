import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
<<<<<<< Updated upstream
import { useNotification } from '@/contexts/NotificationContext';
import { TRPCClientError } from '@trpc/client';
=======
import { useAuth } from '@/_core/hooks/useAuth';
>>>>>>> Stashed changes

export interface Saving {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  category: 'liburan' | 'rumah' | 'kendaraan' | 'pendidikan' | 'darurat' | 'lainnya';
  startDate?: string;
  targetDate?: string;
  createdAt?: number;
  updatedAt?: number;
}

<<<<<<< Updated upstream
/**
 * Get friendly error message from tRPC error
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof TRPCClientError) {
    switch (error.data?.code) {
      case 'BAD_REQUEST':
        return 'Data tabungan tidak valid';
      case 'UNAUTHORIZED':
        return 'Anda perlu login terlebih dahulu';
      default:
        return error.message || 'Gagal memproses tabungan';
    }
  }
  return 'Terjadi kesalahan yang tidak diketahui';
};

export function useSavings() {
  const { addNotification } = useNotification();
  const [savings, setSavings] = useState<Saving[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch savings from database
  const { data: dbSavings, isLoading: dbLoading, refetch } = trpc.savings.list.useQuery(
    { page: 1, limit: 50 },
    {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    }
  );

  const createMutation = trpc.savings.create.useMutation({
    onSuccess: (data) => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Target Tabungan Dibuat',
        message: `${data.name} Sebesar Rp ${(data.targetAmount / 100).toLocaleString('id-ID')} telah dibuat`,
        duration: 5000,
      });
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Membuat Target Tabungan',
        message: errorMsg,
        duration: 6000,
      });
    },
  });

  const updateMutation = trpc.savings.update.useMutation({
    onSuccess: () => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Target Tabungan Diperbarui',
        message: 'Perubahan telah disimpan',
        duration: 4000,
      });
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Memperbarui Target Tabungan',
        message: errorMsg,
        duration: 6000,
      });
    },
  });

  const deleteMutation = trpc.savings.delete.useMutation({
    onSuccess: () => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Target Tabungan Dihapus',
        message: 'Target telah dihapus dengan aman',
        duration: 4000,
      });
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Menghapus Target Tabungan',
        message: errorMsg,
        duration: 6000,
      });
=======
export function useSavings() {
  const { user, isAuthenticated } = useAuth();
  const [savings, setSavings] = useState<Saving[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch savings from database via tRPC
  const { data: dbSavings, isLoading: dbLoading, refetch } = trpc.savings.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user,
  });

  const createMutation = trpc.savings.create.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateMutation = trpc.savings.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = trpc.savings.delete.useMutation({
    onSuccess: () => {
      refetch();
>>>>>>> Stashed changes
    },
  });

  // Update savings when database data changes
  useEffect(() => {
<<<<<<< Updated upstream
    if (dbSavings?.data) {
      const formattedSavings = dbSavings.data.map((s: any) => ({
=======
    if (dbSavings) {
      const formattedSavings = dbSavings.map((s: any) => ({
>>>>>>> Stashed changes
        id: s.id,
        name: s.name,
        description: s.description || '',
        targetAmount: s.targetAmount,
        currentAmount: s.currentAmount,
        category: s.category,
        createdAt: s.createdAt?.getTime?.() || Date.now(),
        updatedAt: s.updatedAt?.getTime?.() || Date.now(),
      }));
      setSavings(formattedSavings);
    }
<<<<<<< Updated upstream
    setIsLoaded(!dbLoading);
  }, [dbSavings, dbLoading]);
=======
  }, [dbSavings]);

  // Set loading state
  useEffect(() => {
    setIsLoading(dbLoading);
  }, [dbLoading]);
>>>>>>> Stashed changes

  const addSaving = async (data: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        category: data.category,
        targetAmount: data.targetAmount,
<<<<<<< Updated upstream
      });
    } catch (error) {
      // Error already handled in mutation callbacks
=======
        currentAmount: data.currentAmount,
      });
    } catch (error) {
      console.error('Failed to create saving:', error);
>>>>>>> Stashed changes
      throw error;
    }
  };

  const updateSaving = async (id: string, updates: Partial<Omit<Saving, 'id' | 'createdAt'>>) => {
    try {
      await updateMutation.mutateAsync({
        id,
        ...updates,
      });
    } catch (error) {
<<<<<<< Updated upstream
      // Error already handled in mutation callbacks
=======
      console.error('Failed to update saving:', error);
>>>>>>> Stashed changes
      throw error;
    }
  };

  const deleteSaving = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
<<<<<<< Updated upstream
      // Error already handled in mutation callbacks
      throw error;
    }
  };

  const addToSaving = async (id: string, amount: number) => {
    const saving = savings.find((s) => s.id === id);
    if (!saving) return;

    const newAmount = saving.currentAmount + amount;
    await updateSaving(id, { currentAmount: newAmount });
  };

  const withdrawFromSaving = async (id: string, amount: number) => {
    const saving = savings.find((s) => s.id === id);
    if (!saving) return;

    const newAmount = Math.max(0, saving.currentAmount - amount);
    await updateSaving(id, { currentAmount: newAmount });
  };

  const getTotalSavings = () => {
    return savings.reduce((sum, saving) => sum + saving.currentAmount, 0);
  };

  const getTotalTarget = () => {
    return savings.reduce((sum, saving) => sum + saving.targetAmount, 0);
  };

  const getProgressPercentage = (id: string) => {
    const saving = savings.find((s) => s.id === id);
    if (!saving || saving.targetAmount === 0) return 0;
    return Math.min(100, Math.round((saving.currentAmount / saving.targetAmount) * 100));
  };

  const getRemainingAmount = (id: string) => {
    const saving = savings.find((s) => s.id === id);
    if (!saving) return 0;
    return Math.max(0, saving.targetAmount - saving.currentAmount);
  };

  const getSavingsByCategory = (category: string) => {
    return savings.filter((s) => s.category === category);
  };

  const getCompletedSavings = () => {
    return savings.filter((s) => s.currentAmount >= s.targetAmount);
  };

  const getActiveSavings = () => {
    } else {
      setSavings((prev) => prev.filter((saving) => saving.id !== id));
=======
      console.error('Failed to delete saving:', error);
      throw error;
>>>>>>> Stashed changes
    }
  };

  const addToSaving = async (id: string, amount: number) => {
    const saving = savings.find((s) => s.id === id);
    if (!saving) return;

    const newAmount = saving.currentAmount + amount;
    await updateSaving(id, { currentAmount: newAmount });
  };

  const withdrawFromSaving = async (id: string, amount: number) => {
    const saving = savings.find((s) => s.id === id);
    if (!saving) return;

    const newAmount = Math.max(0, saving.currentAmount - amount);
    await updateSaving(id, { currentAmount: newAmount });
  };

  const getTotalSavings = () => {
    return savings.reduce((sum, saving) => sum + saving.currentAmount, 0);
  };

  const getTotalTarget = () => {
    return savings.reduce((sum, saving) => sum + saving.targetAmount, 0);
  };

  const getProgressPercentage = (id: string) => {
    const saving = savings.find((s) => s.id === id);
    if (!saving || saving.targetAmount === 0) return 0;
    return Math.min(100, Math.round((saving.currentAmount / saving.targetAmount) * 100));
  };

  const getRemainingAmount = (id: string) => {
    const saving = savings.find((s) => s.id === id);
    if (!saving) return 0;
    return Math.max(0, saving.targetAmount - saving.currentAmount);
  };

  const getSavingsByCategory = (category: string) => {
    return savings.filter((s) => s.category === category);
  };

  const getCompletedSavings = () => {
    return savings.filter((s) => s.currentAmount >= s.targetAmount);
  };

  const getActiveSavings = () => {
    return savings.filter((s) => s.currentAmount < s.targetAmount);
  };

  const estimateDaysToTarget = (id: string, dailyAmount: number) => {
    if (dailyAmount <= 0) return null;
    const saving = savings.find((s) => s.id === id);
    if (!saving) return null;
    const remaining = getRemainingAmount(id);
    return Math.ceil(remaining / dailyAmount);
  };

  const importSavings = (importedData: Saving[]) => {
    setSavings((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const newSavings = importedData.filter(
        (s) => !existingIds.has(s.id)
      );
      return [...newSavings, ...prev].sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
    });
  };

  return {
    savings,
    isLoaded: !dbLoading,
    addSaving,
    updateSaving,
    deleteSaving,
    addToSaving,
    withdrawFromSaving,
    getTotalSavings,
    getTotalTarget,
    getProgressPercentage,
    getRemainingAmount,
    getSavingsByCategory,
    getCompletedSavings,
    getActiveSavings,
    estimateDaysToTarget,
    importSavings,
  };
}
