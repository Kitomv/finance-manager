import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
<<<<<<< Updated upstream
import { useNotification } from '@/contexts/NotificationContext';
import { TRPCClientError } from '@trpc/client';
=======
import { useAuth } from '@/_core/hooks/useAuth';
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
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
=======
export function useInstallments() {
  const { user, isAuthenticated } = useAuth();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch installments from database
  const { data: dbInstallments, isLoading: dbLoading, refetch } = trpc.installments.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user,
  });

  const createMutation = trpc.installments.create.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = trpc.installments.delete.useMutation({
    onSuccess: () => {
      refetch();
>>>>>>> Stashed changes
    },
  });

  const paymentToggleMutation = trpc.installments.payments.toggle.useMutation({
    onSuccess: () => {
      refetch();
    },
<<<<<<< Updated upstream
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      addNotification({
        type: 'error',
        title: 'Gagal Memperbarui Status Pembayaran',
        message: errorMsg,
        duration: 6000,
      });
    },
=======
>>>>>>> Stashed changes
  });

  // Update installments from database
  useEffect(() => {
<<<<<<< Updated upstream
    if (dbInstallments?.data) {
      const formattedInstallments = dbInstallments.data.map((inst: any) => ({
=======
    if (dbInstallments) {
      const formattedInstallments = dbInstallments.map((inst: any) => ({
>>>>>>> Stashed changes
        id: inst.id,
        name: inst.name,
        totalAmount: inst.totalAmount,
        monthlyAmount: inst.monthlyAmount,
        totalMonths: inst.durationMonths,
        durationMonths: inst.durationMonths,
        startMonth: inst.startMonth,
        startYear: inst.startYear,
        description: inst.description,
        payments: inst.payments || [],
        createdAt: inst.createdAt?.getTime?.() || new Date(inst.createdAt).getTime(),
        completedAt: inst.completedAt?.getTime?.() || (inst.completedAt ? new Date(inst.completedAt).getTime() : undefined),
      }));
      setInstallments(formattedInstallments);
    }
<<<<<<< Updated upstream
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
=======
    setIsLoading(dbLoading);
  }, [dbInstallments, dbLoading]);

  const addInstallment = async (installment: Omit<Installment, 'id'>) => {
    try {
      await createMutation.mutateAsync({
        name: installment.name,
        totalAmount: installment.totalAmount,
        monthlyAmount: installment.monthlyAmount,
        startYear: installment.startYear,
        startMonth: installment.startMonth,
        durationMonths: installment.durationMonths || installment.totalMonths || 12,
      });
    } catch (error) {
      console.error('Failed to add installment:', error);
      throw error;
    }
>>>>>>> Stashed changes
  };
}

  const deleteInstallment = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      console.error('Failed to delete installment:', error);
      throw error;
    }
  };

  const togglePayment = async (installmentId: string, month: number, year: number, isPaid: boolean) => {
    try {
      // Find payment ID from installment payments
      const installment = installments.find(i => i.id === installmentId);
      if (!installment || !installment.payments) throw new Error('Installment not found');
      
      const payment = installment.payments.find(p => p.month === month && p.year === year);
      if (!payment) throw new Error('Payment not found');
      
      await paymentToggleMutation.mutateAsync({
        paymentId: payment.id,
        isPaid: isPaid ? 1 : 0,
      });
    } catch (error) {
      console.error('Failed to toggle payment:', error);
      throw error;
    }
  };

  const getInstallmentProgress = (installment: Installment) => {
    if (!installment.payments) return 0;
    const paidCount = installment.payments.filter((p) => p.isPaid).length;
    return (paidCount / installment.payments.length) * 100;
  };

  const getProgressPercentage = (installment: Installment) => {
    return getInstallmentProgress(installment);
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const upcoming: any[] = [];
    
    installments.forEach((inst) => {
      if (!inst.payments) return;
      inst.payments.forEach((payment) => {
        if (!payment.isPaid) {
          const paymentDate = new Date(today.getFullYear(), payment.month - 1, 1);
          if (paymentDate >= today) {
            upcoming.push({
              installmentId: inst.id,
              installmentName: inst.name,
              month: payment.month,
              year: payment.year,
              amount: payment.amount,
              date: paymentDate,
            });
          }
        }
      });
    });
    
    return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getRemainingAmount = (installment: Installment) => {
    if (!installment.payments) return installment.totalAmount;
    const paidCount = installment.payments.filter((p) => p.isPaid).length;
    return installment.totalAmount - (paidCount * installment.monthlyAmount);
  };

  const markPaymentAsUnpaid = async (installmentId: string, month: number, year: number) => {
    try {
      await togglePayment(installmentId, month, year, false);
    } catch (error) {
      console.error('Failed to mark payment as unpaid:', error);
      throw error;
    }
  };

  const getTotalPaidAmount = (installment: Installment) => {
    if (!installment.payments) return 0;
    const paidCount = installment.payments.filter((p) => p.isPaid).length;
    return Math.round(paidCount * installment.monthlyAmount);
  };

  const importInstallments = async (data: Installment[]) => {
    for (const installment of data) {
      await addInstallment({
        name: installment.name,
        totalAmount: installment.totalAmount,
        monthlyAmount: installment.monthlyAmount,
        startYear: installment.startYear,
        startMonth: installment.startMonth,
        durationMonths: installment.durationMonths || installment.totalMonths || 12,
      });
    }
  };

  return {
    installments,
    isLoading,
    isLoaded: !isLoading,
    addInstallment,
    deleteInstallment,
    togglePayment,
    getInstallmentProgress,
    getProgressPercentage,
    getRemainingAmount,
    markPaymentAsUnpaid,
    getTotalPaidAmount,
    getUpcomingPayments,
    importInstallments,
  };
}
