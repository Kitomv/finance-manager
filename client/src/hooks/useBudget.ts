import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: number;
  year: number;
  createdAt?: string;
}

export function useBudget() {
  const { user, isAuthenticated } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch budgets from database via tRPC
  const { data: dbBudgets, isLoading: dbLoading, refetch } = trpc.budgets.list.useQuery({}, {
    enabled: isAuthenticated && !!user,
  });

  const createMutation = trpc.budgets.create.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateMutation = trpc.budgets.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = trpc.budgets.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Update budgets when database data changes
  useEffect(() => {
    if (dbBudgets) {
      const formattedBudgets = dbBudgets.map((b: any) => ({
        id: b.id,
        category: b.category,
        limit: b.limit,
        month: b.month,
        year: b.year,
        createdAt: b.createdAt?.toISOString?.() || new Date().toISOString(),
      }));
      setBudgets(formattedBudgets);
    }
  }, [dbBudgets]);

  // Set loading state
  useEffect(() => {
    setIsLoading(dbLoading);
  }, [dbLoading]);

  const addBudget = async (category: string, limit: number, month: number, year: number) => {
    try {
      await createMutation.mutateAsync({
        category,
        limit,
        month,
        year,
      });
      toast.success(`Budget untuk ${category} berhasil dibuat`);
    } catch (error) {
      console.error('Failed to create budget:', error);
      toast.error('Gagal membuat budget');
      throw error;
    }
  };

  const updateBudget = async (id: string, limit: number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        limit,
      });
      toast.success('Budget berhasil diperbarui');
    } catch (error) {
      console.error('Failed to update budget:', error);
      toast.error('Gagal memperbarui budget');
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('Budget berhasil dihapus');
    } catch (error) {
      console.error('Failed to delete budget:', error);
      toast.error('Gagal menghapus budget');
      throw error;
    }
  };

  const getBudgetByCategory = (category: string, month: number, year: number) => {
    return budgets.find(b => b.category === category && b.month === month && b.year === year);
  };

  const getBudgetsByMonth = (month: number, year: number) => {
    return budgets.filter(b => b.month === month && b.year === year);
  };

  return {
    budgets,
    isLoading,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetByCategory,
    getBudgetsByMonth,
  };
}
