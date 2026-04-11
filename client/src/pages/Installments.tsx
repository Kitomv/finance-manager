import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import InstallmentForm from '@/components/InstallmentForm';
import InstallmentCard from '@/components/InstallmentCard';

import { useInstallments, Installment } from '@/hooks/useInstallments';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Installments() {
  const {
    installments,
    isLoaded,
    addInstallment,
    deleteInstallment,
    togglePayment,
    markPaymentAsUnpaid,
    getTotalPaidAmount,
    getRemainingAmount,
    getProgressPercentage,
    getUpcomingPayments,
  } = useInstallments();

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  const filteredInstallments = installments.filter((inst) => {
    if (filterStatus === 'all') return true;
    const progress = getProgressPercentage(inst);
    if (filterStatus === 'active') return progress < 100;
    return progress === 100;
  });

  const handleAddInstallment = (data: Omit<Installment, 'id' | 'createdAt' | 'payments'>) => {
    addInstallment(data);
    toast.success('Cicilan berhasil ditambahkan');
  };

  const handleDeleteInstallment = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus cicilan ini?')) {
      deleteInstallment(id);
      toast.success('Cicilan berhasil dihapus');
    }
  };

  const handleMarkPayment = (installmentId: string, paymentId: string, isPaid: boolean) => {
    // Parse month and year from paymentId (format: "month-year")
    const [month, year] = paymentId.split('-').map(Number);
    if (isPaid) {
      togglePayment(installmentId, month, year, true);
      toast.success('Pembayaran ditandai sebagai terbayar');
    } else {
      markPaymentAsUnpaid(installmentId, month, year);
      toast.success('Pembayaran ditandai sebagai belum terbayar');
    }
  };

  if (!isLoaded) {
    return (
      <DashboardLayout currentPage="installments">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalInstallments = installments.length;
  const activeInstallments = installments.filter((i) => getProgressPercentage(i) < 100).length;
  const completedInstallments = installments.filter((i) => getProgressPercentage(i) === 100).length;
  const totalRemainingAmount = installments.reduce((sum, inst) => sum + getRemainingAmount(inst), 0);
  const upcomingPayments = getUpcomingPayments();

  return (
    <DashboardLayout currentPage="installments">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manajemen Cicilan</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Kelola dan pantau cicilan pembayaran Anda dengan mudah</p>
          </div>
          <InstallmentForm onSubmit={handleAddInstallment} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="p-4 sm:p-6 border border-border bg-gradient-to-br from-slate-50 to-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Total Cicilan</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalInstallments}</p>
              </div>
              <div className="text-3xl sm:text-4xl text-slate-200">📋</div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6 border border-border bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cicilan Aktif</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">{activeInstallments}</p>
              </div>
              <div className="text-3xl sm:text-4xl text-blue-200">⚡</div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6 border border-border bg-gradient-to-br from-emerald-50 to-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Selesai</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{completedInstallments}</p>
              </div>
              <div className="text-3xl sm:text-4xl text-emerald-200">✓</div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6 border border-border bg-gradient-to-br from-amber-50 to-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sisa Pembayaran</p>
                <p className="text-lg sm:text-2xl font-bold text-amber-600">Rp {totalRemainingAmount.toLocaleString('id-ID')}</p>
              </div>
              <div className="text-3xl sm:text-4xl text-amber-200">💰</div>
            </div>
          </Card>
        </div>

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <Card className="p-4 sm:p-6 border border-border bg-gradient-to-r from-blue-50 to-indigo-50 mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-lg sm:text-xl">📅</span>
              Pembayaran Mendatang
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {upcomingPayments.slice(0, 6).map((payment) => (
                <div key={payment.id} className="bg-white p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                  <p className="font-semibold text-foreground text-sm">{payment.installmentName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(payment.year, payment.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-bold text-blue-600 mt-3 text-lg">Rp {payment.amount.toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-semibold text-foreground">Filter:</span>
          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filterStatus === status
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {status === 'all' ? 'Semua' : status === 'active' ? 'Aktif' : 'Selesai'}
              </button>
            ))}
          </div>
        </div>

        {/* Installments List */}
        {filteredInstallments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredInstallments.map((installment) => (
              <InstallmentCard
                key={installment.id}
                installment={installment}
                progress={getProgressPercentage(installment)}
                totalPaid={getTotalPaidAmount(installment)}
                remaining={getRemainingAmount(installment)}
                onDelete={handleDeleteInstallment}
                onMarkPayment={handleMarkPayment}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 border border-dashed border-border bg-slate-50">
            <div className="text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-muted-foreground">
                {installments.length === 0
                  ? 'Belum ada cicilan. Mulai dengan menambah cicilan baru!'
                  : 'Tidak ada cicilan dengan filter yang dipilih.'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
