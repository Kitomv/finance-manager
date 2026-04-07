import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: number;
  year: number;
  createdAt: string;
}

export function useBudget() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Load budgets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('finance-manager-budgets');
    if (stored) {
      try {
        setBudgets(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading budgets:', error);
      }
    }
  }, []);

  // Save budgets to localStorage
  const saveBudgets = (updatedBudgets: Budget[]) => {
    setBudgets(updatedBudgets);
    localStorage.setItem('finance-manager-budgets', JSON.stringify(updatedBudgets));
  };

  const addBudget = (category: string, limit: number, month: number, year: number) => {
    const newBudget: Budget = {
      id: `budget-${Date.now()}`,
      category,
      limit,
      month,
      year,
      createdAt: new Date().toISOString(),
    };
    const updated = [...budgets, newBudget];
    saveBudgets(updated);
    toast.success(`Budget untuk ${category} berhasil dibuat`);
  };

  const updateBudget = (id: string, limit: number) => {
    const updated = budgets.map(b => (b.id === id ? { ...b, limit } : b));
    saveBudgets(updated);
    toast.success('Budget berhasil diperbarui');
  };

  const deleteBudget = (id: string) => {
    const updated = budgets.filter(b => b.id !== id);
    saveBudgets(updated);
    toast.success('Budget berhasil dihapus');
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
