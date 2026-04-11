import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: number;
  year: number;
  createdAt?: string;
}

export function useBudget() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [useDatabase, setUseDatabase] = useState(false);

  // Try to use tRPC queries
  const { data: dbBudgets, isLoading: dbLoading } = trpc.budgets.list.useQuery({}, {
    enabled: useDatabase,
  });

  const createMutation = trpc.budgets.create.useMutation();
  const updateMutation = trpc.budgets.update.useMutation();
  const deleteMutation = trpc.budgets.delete.useMutation();

  // Load budgets from database or localStorage on mount
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
    const stored = localStorage.getItem('finance-manager-budgets');
    if (stored) {
      try {
        setBudgets(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading budgets:', error);
      }
    }
  }, []);

  // Update budgets when database data changes
  useEffect(() => {
    if (useDatabase && dbBudgets) {
      const formattedBudgets = dbBudgets.map((b: any) => ({
        id: b.id,
        category: b.category,
        limit: b.limit,
        month: b.month,
        year: b.year,
        createdAt: b.createdAt?.toISOString() || new Date().toISOString(),
      }));
      setBudgets(formattedBudgets);
    }
  }, [dbBudgets, useDatabase]);

  // Save budgets to localStorage whenever they change (fallback)
  useEffect(() => {
    if (!useDatabase) {
      localStorage.setItem('finance-manager-budgets', JSON.stringify(budgets));
    }
  }, [budgets, useDatabase]);

  const saveBudgets = (updatedBudgets: Budget[]) => {
    setBudgets(updatedBudgets);
    if (!useDatabase) {
      localStorage.setItem('finance-manager-budgets', JSON.stringify(updatedBudgets));
    }
  };

  const addBudget = async (category: string, limit: number, month: number, year: number) => {
    const newBudget: Budget = {
      id: `budget-${Date.now()}`,
      category,
      limit,
      month,
      year,
      createdAt: new Date().toISOString(),
    };

    if (useDatabase) {
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
        // Fallback to localStorage
        const updated = [...budgets, newBudget];
        saveBudgets(updated);
        toast.success(`Budget untuk ${category} berhasil dibuat`);
      }
    } else {
      const updated = [...budgets, newBudget];
      saveBudgets(updated);
      toast.success(`Budget untuk ${category} berhasil dibuat`);
    }
  };

  const updateBudget = async (id: string, limit: number) => {
    if (useDatabase) {
      try {
        await updateMutation.mutateAsync({
          id,
          limit,
        });
        toast.success('Budget berhasil diperbarui');
      } catch (error) {
        console.error('Failed to update budget:', error);
        // Fallback to localStorage
        const updated = budgets.map(b => (b.id === id ? { ...b, limit } : b));
        saveBudgets(updated);
        toast.success('Budget berhasil diperbarui');
      }
    } else {
      const updated = budgets.map(b => (b.id === id ? { ...b, limit } : b));
      saveBudgets(updated);
      toast.success('Budget berhasil diperbarui');
    }
  };

  const deleteBudget = async (id: string) => {
    if (useDatabase) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success('Budget berhasil dihapus');
      } catch (error) {
        console.error('Failed to delete budget:', error);
        // Fallback to localStorage
        const updated = budgets.filter(b => b.id !== id);
        saveBudgets(updated);
        toast.success('Budget berhasil dihapus');
      }
    } else {
      const updated = budgets.filter(b => b.id !== id);
      saveBudgets(updated);
      toast.success('Budget berhasil dihapus');
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
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetByCategory,
    getBudgetsByMonth,
  };
}
