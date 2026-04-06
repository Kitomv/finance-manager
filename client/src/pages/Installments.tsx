import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import InstallmentForm from '@/components/InstallmentForm';
import InstallmentCard from '@/components/InstallmentCard';
import InstallmentMaintenance from '@/components/InstallmentMaintenance';
import { useInstallments, Installment } from '@/hooks/useInstallments';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Installments() {
  const {
    installments,
    isLoaded,
    addInstallment,
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
  } = useInstallments();

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  const filteredInstallments = installments.filter((inst) => {
    if (filterStatus === 'all') return true;
    const progress = getProgressPercentage(inst.id);
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
    if (isPaid) {
      markPaymentAsPaid(installmentId, paymentId);
      toast.success('Pembayaran ditandai sebagai terbayar');
    } else {
      markPaymentAsUnpaid(installmentId, paymentId);
      toast.success('Pembayaran ditandai sebagai belum terbayar');
    }
  };

  if (!isLoaded) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalInstallments = installments.length;
  const activeInstallments = installments.filter((i) => getProgressPercentage(i.id) < 100).length;
  const completedInstallments = installments.filter((i) => getProgressPercentage(i.id) === 100).length;
  const totalRemainingAmount = installments.reduce((sum, inst) => sum + getRemainingAmount(inst.id), 0);
  const upcomingPayments = getUpcomingPayments();

  return (
    <DashboardLayout currentPage="dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Manajemen Cicilan</h1>
            <p className="text-muted-foreground">Kelola dan pantau cicilan pembayaran Anda</p>
          </div>
          <div className="flex gap-2">
            <InstallmentMaintenance
              installments={installments}
              onDuplicate={duplicateInstallment}
              onReset={resetInstallment}
              onDeleteAll={deleteAllInstallments}
              onExport={exportInstallments}
            />
            <InstallmentForm onSubmit={handleAddInstallment} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Total Cicilan</p>
            <p className="text-3xl font-bold text-foreground">{totalInstallments}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Cicilan Aktif</p>
            <p className="text-3xl font-bold text-primary">{activeInstallments}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Selesai</p>
            <p className="text-3xl font-bold text-emerald-600">{completedInstallments}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Sisa Pembayaran</p>
            <p className="text-2xl font-bold text-amber-600">Rp {totalRemainingAmount.toLocaleString('id-ID')}</p>
          </Card>
        </div>

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <Card className="p-6 border border-border bg-blue-50">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pembayaran Mendatang</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPayments.slice(0, 6).map((payment) => (
                <div key={payment.id} className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="font-medium text-foreground">{payment.installmentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(2024, payment.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-semibold text-blue-600 mt-2">Rp {payment.amount.toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Filter */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">Filter:</span>
          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-primary text-primary-foreground'
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
          <div className="grid grid-cols-1 gap-6">
            {filteredInstallments.map((installment) => (
              <InstallmentCard
                key={installment.id}
                installment={installment}
                progress={getProgressPercentage(installment.id)}
                totalPaid={getTotalPaidAmount(installment.id)}
                remaining={getRemainingAmount(installment.id)}
                onDelete={handleDeleteInstallment}
                onMarkPayment={handleMarkPayment}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {installments.length === 0
                ? 'Belum ada cicilan. Mulai dengan menambah cicilan baru!'
                : 'Tidak ada cicilan dengan filter yang dipilih.'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
