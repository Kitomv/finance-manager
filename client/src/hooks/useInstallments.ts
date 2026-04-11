import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export interface InstallmentPayment {
  id: string;
  month: number;
  year: number;
  amount: number;
  isPaid: boolean | number;
  paidDate?: string;
}

export interface Installment {
  id: string;
  name: string;
  totalAmount: number;
  monthlyAmount: number;
  totalMonths?: number;
  durationMonths?: number;
  startMonth: number;
  startYear: number;
  description?: string;
  payments?: InstallmentPayment[];
  createdAt?: number;
  completedAt?: number;
}

const STORAGE_KEY = 'finance-manager-installments';

export function useInstallments() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useDatabase, setUseDatabase] = useState(false);

  // Try to use tRPC queries
  const { data: dbInstallments, isLoading: dbLoading } = trpc.installments.list.useQuery(undefined, {
    enabled: useDatabase,
  });

  const createMutation = trpc.installments.create.useMutation();
  const deleteMutation = trpc.installments.delete.useMutation();
  const paymentToggleMutation = trpc.installments.payments.toggle.useMutation();

  // Load installments from database or localStorage on mount
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
        setInstallments(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse installments from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Update installments when database data changes
  useEffect(() => {
    if (useDatabase && dbInstallments) {
      const formattedInstallments = dbInstallments.map((inst: any) => ({
        id: inst.id,
        name: inst.name,
        totalAmount: inst.totalAmount,
        monthlyAmount: inst.monthlyAmount,
        totalMonths: inst.durationMonths,
        durationMonths: inst.durationMonths,
        startMonth: inst.startMonth,
        startYear: inst.startYear,
        description: '',
        payments: [],
        createdAt: inst.createdAt?.getTime() || Date.now(),
      }));
      setInstallments(formattedInstallments);
    }
  }, [dbInstallments, useDatabase]);

  // Save installments to localStorage whenever they change (fallback)
  useEffect(() => {
    if (isLoaded && !useDatabase) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(installments));
    }
  }, [installments, isLoaded, useDatabase]);

  const addInstallment = async (data: Omit<Installment, 'id' | 'createdAt' | 'payments'>) => {
    const totalMonths = data.totalMonths || data.durationMonths || 12;
    
    // Generate payment schedule for localStorage
    const payments: InstallmentPayment[] = [];
    for (let i = 0; i < totalMonths; i++) {
      const month = (data.startMonth + i - 1) % 12 + 1;
      const year = data.startYear + Math.floor((data.startMonth + i - 1) / 12);
      payments.push({
        id: `${Date.now()}-${i}`,
        month,
        year,
        amount: data.monthlyAmount,
        isPaid: false,
      });
    }

    const newInstallment: Installment = {
      ...data,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      payments,
      totalMonths,
    };

    if (useDatabase) {
      try {
        await createMutation.mutateAsync({
          name: data.name,
          totalAmount: data.totalAmount,
          monthlyAmount: data.monthlyAmount,
          startMonth: data.startMonth,
          startYear: data.startYear,
          durationMonths: totalMonths,
        });
      } catch (error) {
        console.error('Failed to create installment:', error);
        // Fallback to localStorage
        setInstallments((prev) => [newInstallment, ...prev]);
      }
    } else {
      setInstallments((prev) => [newInstallment, ...prev]);
    }

    return newInstallment;
  };

  const updateInstallment = (id: string, updates: Partial<Omit<Installment, 'id' | 'createdAt'>>) => {
    setInstallments((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, ...updates } : inst))
    );
  };

  const deleteInstallment = async (id: string) => {
    if (useDatabase) {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error) {
        console.error('Failed to delete installment:', error);
        // Fallback to localStorage
        setInstallments((prev) => prev.filter((inst) => inst.id !== id));
      }
    } else {
      setInstallments((prev) => prev.filter((inst) => inst.id !== id));
    }
  };

  const markPaymentAsPaid = async (installmentId: string, paymentId: string) => {
    if (useDatabase) {
      try {
        await paymentToggleMutation.mutateAsync({
          paymentId,
          isPaid: 1,
        });
      } catch (error) {
        console.error('Failed to mark payment as paid:', error);
      }
    } else {
      setInstallments((prev) =>
        prev.map((inst) => {
          if (inst.id === installmentId) {
            const updatedPayments = inst.payments?.map((p) =>
              p.id === paymentId
                ? { ...p, isPaid: true, paidDate: new Date().toISOString().split('T')[0] }
                : p
            ) || [];

            // Check if all payments are paid
            const allPaid = updatedPayments.every((p) => p.isPaid);
            return {
              ...inst,
              payments: updatedPayments,
              completedAt: allPaid ? Date.now() : inst.completedAt,
            };
          }
          return inst;
        })
      );
    }
  };

  const markPaymentAsUnpaid = async (installmentId: string, paymentId: string) => {
    if (useDatabase) {
      try {
        await paymentToggleMutation.mutateAsync({
          paymentId,
          isPaid: 0,
        });
      } catch (error) {
        console.error('Failed to mark payment as unpaid:', error);
      }
    } else {
      setInstallments((prev) =>
        prev.map((inst) => {
          if (inst.id === installmentId) {
            const updatedPayments = inst.payments?.map((p) =>
              p.id === paymentId
                ? { ...p, isPaid: false, paidDate: undefined }
                : p
            ) || [];

            return {
              ...inst,
              payments: updatedPayments,
              completedAt: undefined,
            };
          }
          return inst;
        })
      );
    }
  };

  const getTotalPaidAmount = (installmentId: string) => {
    const installment = installments.find((i) => i.id === installmentId);
    if (!installment) return 0;
    return installment.payments
      ?.filter((p) => p.isPaid)
      .reduce((sum, p) => sum + p.amount, 0) || 0;
  };

  const getRemainingAmount = (installmentId: string) => {
    const installment = installments.find((i) => i.id === installmentId);
    if (!installment) return 0;
    return installment.totalAmount - getTotalPaidAmount(installmentId);
  };

  const getProgressPercentage = (installmentId: string) => {
    const installment = installments.find((i) => i.id === installmentId);
    if (!installment) return 0;
    const totalMonths = installment.totalMonths || installment.durationMonths || 12;
    const paidCount = installment.payments?.filter((p) => p.isPaid).length || 0;
    return Math.round((paidCount / totalMonths) * 100);
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const upcoming: Array<InstallmentPayment & { installmentName: string }> = [];

    installments.forEach((inst) => {
      inst.payments?.forEach((payment) => {
        if (!payment.isPaid && (payment.year > currentYear || (payment.year === currentYear && payment.month >= currentMonth))) {
          upcoming.push({
            ...payment,
            installmentName: inst.name,
          });
        }
      });
    });

    return upcoming.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  };

  const duplicateInstallment = (installment: Installment) => {
    const newInstallment = addInstallment({
      name: `${installment.name} (Duplikat)`,
      totalAmount: installment.totalAmount,
      monthlyAmount: installment.monthlyAmount,
      totalMonths: installment.totalMonths,
      startMonth: installment.startMonth,
      startYear: installment.startYear,
      description: installment.description,
    });
    return newInstallment;
  };

  const resetInstallment = (id: string) => {
    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.id === id) {
          const resetPayments = inst.payments?.map((p) => ({
            ...p,
            isPaid: false,
            paidDate: undefined,
          })) || [];
          return {
            ...inst,
            payments: resetPayments,
            completedAt: undefined,
          };
        }
        return inst;
      })
    );
  };

  const deleteAllInstallments = () => {
    setInstallments([]);
  };

  const exportInstallments = () => {
    const dataStr = JSON.stringify(installments, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cicilan-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importInstallments = (importedData: Installment[]) => {
    setInstallments((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const newInstallments = importedData.filter(
        (i) => !existingIds.has(i.id)
      );
      return [...newInstallments, ...prev].sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
    });
  };

  return {
    installments,
    isLoaded: isLoaded && (!useDatabase || !dbLoading),
    addInstallment,
    updateInstallment,
    deleteInstallment,
    markPaymentAsPaid,
    markPaymentAsUnpaid,
    getTotalPaidAmount,
    getRemainingAmount,
    getProgressPercentage,
    getUpcomingPayments,
    duplicateInstallment,
    resetInstallment,
    deleteAllInstallments,
    exportInstallments,
    importInstallments,
  };
}
