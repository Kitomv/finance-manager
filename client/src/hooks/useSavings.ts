import { useState, useEffect } from 'react';

export interface Saving {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: 'liburan' | 'rumah' | 'kendaraan' | 'pendidikan' | 'darurat' | 'lainnya';
  startDate: string;
  targetDate?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'finance-manager-savings';

export function useSavings() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load savings from localStorage on mount
  useEffect(() => {
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

  // Save savings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savings));
    }
  }, [savings, isLoaded]);

  const addSaving = (data: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSaving: Saving = {
      ...data,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSavings((prev) => [newSaving, ...prev]);
    return newSaving;
  };

  const updateSaving = (id: string, updates: Partial<Omit<Saving, 'id' | 'createdAt'>>) => {
    setSavings((prev) =>
      prev.map((saving) =>
        saving.id === id
          ? { ...saving, ...updates, updatedAt: Date.now() }
          : saving
      )
    );
  };

  const deleteSaving = (id: string) => {
    setSavings((prev) => prev.filter((saving) => saving.id !== id));
  };

  const addToSaving = (id: string, amount: number) => {
    setSavings((prev) =>
      prev.map((saving) =>
        saving.id === id
          ? {
              ...saving,
              currentAmount: saving.currentAmount + amount,
              updatedAt: Date.now(),
            }
          : saving
      )
    );
  };

  const withdrawFromSaving = (id: string, amount: number) => {
    setSavings((prev) =>
      prev.map((saving) =>
        saving.id === id
          ? {
              ...saving,
              currentAmount: Math.max(0, saving.currentAmount - amount),
              updatedAt: Date.now(),
            }
          : saving
      )
    );
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
    isLoaded,
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
