import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

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

const STORAGE_KEY = 'finance-manager-savings';

export function useSavings() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useDatabase, setUseDatabase] = useState(false);

  // Try to use tRPC queries
  const { data: dbSavings, isLoading: dbLoading } = trpc.savings.list.useQuery(undefined, {
    enabled: useDatabase,
  });

  const createMutation = trpc.savings.create.useMutation();
  const updateMutation = trpc.savings.update.useMutation();
  const deleteMutation = trpc.savings.delete.useMutation();

  // Load savings from database or localStorage on mount
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
        setSavings(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse savings from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Update savings when database data changes
  useEffect(() => {
    if (useDatabase && dbSavings) {
      const formattedSavings = dbSavings.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: '',
        targetAmount: s.targetAmount,
        currentAmount: s.currentAmount,
        category: s.category,
        createdAt: s.createdAt?.getTime() || Date.now(),
        updatedAt: s.updatedAt?.getTime() || Date.now(),
      }));
      setSavings(formattedSavings);
    }
  }, [dbSavings, useDatabase]);

  // Save savings to localStorage whenever they change (fallback)
  useEffect(() => {
    if (isLoaded && !useDatabase) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savings));
    }
  }, [savings, isLoaded, useDatabase]);

  const addSaving = async (data: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSaving: Saving = {
      ...data,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (useDatabase) {
      try {
        await createMutation.mutateAsync({
          name: data.name,
          category: data.category,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
        });
      } catch (error) {
        console.error('Failed to create saving:', error);
        // Fallback to localStorage
        setSavings((prev) => [newSaving, ...prev]);
      }
    } else {
      setSavings((prev) => [newSaving, ...prev]);
    }

    return newSaving;
  };

  const updateSaving = async (id: string, updates: Partial<Omit<Saving, 'id' | 'createdAt'>>) => {
    if (useDatabase) {
      try {
        await updateMutation.mutateAsync({
          id,
          ...updates,
        });
      } catch (error) {
        console.error('Failed to update saving:', error);
        // Fallback to localStorage
        setSavings((prev) =>
          prev.map((saving) =>
            saving.id === id
              ? { ...saving, ...updates, updatedAt: Date.now() }
              : saving
          )
        );
      }
    } else {
      setSavings((prev) =>
        prev.map((saving) =>
          saving.id === id
            ? { ...saving, ...updates, updatedAt: Date.now() }
            : saving
        )
      );
    }
  };

  const deleteSaving = async (id: string) => {
    if (useDatabase) {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error) {
        console.error('Failed to delete saving:', error);
        // Fallback to localStorage
        setSavings((prev) => prev.filter((saving) => saving.id !== id));
      }
    } else {
      setSavings((prev) => prev.filter((saving) => saving.id !== id));
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
    isLoaded: isLoaded && (!useDatabase || !dbLoading),
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
