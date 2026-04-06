import { useState, useEffect } from 'react';

export interface InstallmentPayment {
  id: string;
  month: number;
  year: number;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
}

export interface Installment {
  id: string;
  name: string;
  totalAmount: number;
  monthlyAmount: number;
  totalMonths: number;
  startMonth: number;
  startYear: number;
  description: string;
  payments: InstallmentPayment[];
  createdAt: number;
  completedAt?: number;
}

const STORAGE_KEY = 'finance-manager-installments';

export function useInstallments() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load installments from localStorage on mount
  useEffect(() => {
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

  // Save installments to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(installments));
    }
  }, [installments, isLoaded]);

  const addInstallment = (data: Omit<Installment, 'id' | 'createdAt' | 'payments'>) => {
    // Generate payment schedule
    const payments: InstallmentPayment[] = [];
    for (let i = 0; i < data.totalMonths; i++) {
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
    };

    setInstallments((prev) => [newInstallment, ...prev]);
    return newInstallment;
  };

  const updateInstallment = (id: string, updates: Partial<Omit<Installment, 'id' | 'createdAt'>>) => {
    setInstallments((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, ...updates } : inst))
    );
  };

  const deleteInstallment = (id: string) => {
    setInstallments((prev) => prev.filter((inst) => inst.id !== id));
  };

  const markPaymentAsPaid = (installmentId: string, paymentId: string) => {
    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.id === installmentId) {
          const updatedPayments = inst.payments.map((p) =>
            p.id === paymentId
              ? { ...p, isPaid: true, paidDate: new Date().toISOString().split('T')[0] }
              : p
          );

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
  };

  const markPaymentAsUnpaid = (installmentId: string, paymentId: string) => {
    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.id === installmentId) {
          const updatedPayments = inst.payments.map((p) =>
            p.id === paymentId
              ? { ...p, isPaid: false, paidDate: undefined }
              : p
          );

          return {
            ...inst,
            payments: updatedPayments,
            completedAt: undefined,
          };
        }
        return inst;
      })
    );
  };

  const getTotalPaidAmount = (installmentId: string) => {
    const installment = installments.find((i) => i.id === installmentId);
    if (!installment) return 0;
    return installment.payments
      .filter((p) => p.isPaid)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getRemainingAmount = (installmentId: string) => {
    const installment = installments.find((i) => i.id === installmentId);
    if (!installment) return 0;
    return installment.totalAmount - getTotalPaidAmount(installmentId);
  };

  const getProgressPercentage = (installmentId: string) => {
    const installment = installments.find((i) => i.id === installmentId);
    if (!installment) return 0;
    const paidCount = installment.payments.filter((p) => p.isPaid).length;
    return Math.round((paidCount / installment.totalMonths) * 100);
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const upcoming: Array<InstallmentPayment & { installmentName: string }> = [];

    installments.forEach((inst) => {
      inst.payments.forEach((payment) => {
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

  return {
    installments,
    isLoaded,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    markPaymentAsPaid,
    markPaymentAsUnpaid,
    getTotalPaidAmount,
    getRemainingAmount,
    getProgressPercentage,
    getUpcomingPayments,
  };
}
