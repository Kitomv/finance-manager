import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useNotification } from '@/contexts/NotificationContext';
import { TRPCClientError } from '@trpc/client';

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

/**
 * Get friendly error message from tRPC error
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof TRPCClientError) {
    switch (error.data?.code) {
      case 'BAD_REQUEST':
        return 'Data cicilan tidak valid';
      case 'UNAUTHORIZED':
        return 'Anda perlu login terlebih dahulu';
      default:
        return error.message || 'Gagal memproses cicilan';
    }
  }
  return 'Terjadi kesalahan yang tidak diketahui';
};

export function useInstallments() {
  const { addNotification } = useNotification();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch installments from database
  const { data: dbInstallments, isLoading: dbLoading, refetch } = trpc.installments.list.useQuery(
    { page: 1, limit: 50 },
    {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    }
  );

  const createMutation = trpc.installments.create.useMutation({
    onSuccess: (data) => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Cicilan Berhasil Dibuat',
        message: `${data.name} telah ditambahkan untuk ${data.durationMonths} bulan`,
        duration: 5000,
      });
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Membuat Cicilan',
        message: errorMsg,
        duration: 6000,
      });
    },
  });

  const deleteMutation = trpc.installments.delete.useMutation({
    onSuccess: () => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Cicilan Dihapus',
        message: 'Cicilan telah dihapus dengan aman',
        duration: 4000,
      });
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Menghapus Cicilan',
        message: errorMsg,
        duration: 6000,
      });
    },
  });

  const paymentToggleMutation = trpc.installments.payments.toggle.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Memperbarui Status Pembayaran',
        message: errorMsg,
        duration: 6000,
      });
    },
  });

  // Update installments when database data changes
  useEffect(() => {
    if (dbInstallments?.data) {
      const formattedInstallments = dbInstallments.data.map((inst: any) => ({
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
    setIsLoaded(!dbLoading);
  }, [dbInstallments, dbLoading]);

  const addInstallment = async (data: Omit<Installment, 'id' | 'createdAt' | 'payments'>) => {
    const totalMonths = data.totalMonths || data.durationMonths || 12;
    
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
      // Error already handled in mutation callbacks
      throw error;
    }
  };

  const deleteInstallment = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      // Error already handled in mutation callbacks
      throw error;
    }
  };

  const togglePayment = async (
    installmentId: string,
    month: number,
    year: number,
    isPaid: boolean
  ) => {
    try {
      await paymentToggleMutation.mutateAsync({
        installmentId,
        month,
        year,
        isPaid,
      });
    } catch (error) {
      // Error already handled in mutation callbacks
      throw error;
    }
  };

  return {
    installments,
    isLoading: dbLoading,
    isLoaded,
    addInstallment,
    deleteInstallment,
    togglePayment,
    // Mutation states
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingPayment: paymentToggleMutation.isPending,
    createError: createMutation.error,
    deleteError: deleteMutation.error,
    toggleError: paymentToggleMutation.error,
  };
}

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
