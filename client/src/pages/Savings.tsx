import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SavingForm from '@/components/SavingForm';
import SavingCard from '@/components/SavingCard';
import { useSavings, Saving } from '@/hooks/useSavings';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Savings() {
  const {
    savings,
    isLoaded,
    addSaving,
    deleteSaving,
    addToSaving,
    withdrawFromSaving,
    getTotalSavings,
    getTotalTarget,
    getProgressPercentage,
    getRemainingAmount,
    getCompletedSavings,
    getActiveSavings,
  } = useSavings();

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  const filteredSavings = savings.filter((saving) => {
    if (filterStatus === 'all') return true;
    const progress = getProgressPercentage(saving.id);
    if (filterStatus === 'active') return progress < 100;
    return progress === 100;
  });

  const handleAddSaving = (data: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => {
    addSaving(data);
    toast.success('Target tabungan berhasil ditambahkan');
  };

  const handleDeleteSaving = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tabungan ini?')) {
      deleteSaving(id);
      toast.success('Tabungan berhasil dihapus');
    }
  };

  const handleAddToSaving = (id: string, amount: number) => {
    addToSaving(id, amount);
    toast.success(`Rp ${amount.toLocaleString('id-ID')} berhasil ditambahkan`);
  };

  const handleWithdrawFromSaving = (id: string, amount: number) => {
    withdrawFromSaving(id, amount);
    toast.success(`Rp ${amount.toLocaleString('id-ID')} berhasil ditarik`);
  };

  if (!isLoaded) {
    return (
      <DashboardLayout currentPage="savings">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalSavings = getTotalSavings();
  const totalTarget = getTotalTarget();
  const activeSavings = getActiveSavings();
  const completedSavings = getCompletedSavings();
  const overallProgress = totalTarget > 0 ? Math.round((totalSavings / totalTarget) * 100) : 0;

  // Prepare chart data
  const chartData = savings.map((saving) => ({
    name: saving.name,
    value: saving.currentAmount,
  }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <DashboardLayout currentPage="savings">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Target Tabungan</h1>
            <p className="text-muted-foreground">Kelola dan pantau target tabungan Anda</p>
          </div>
          <SavingForm onSubmit={handleAddSaving} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Total Ditabung</p>
            <p className="text-3xl font-bold text-primary">Rp {totalSavings.toLocaleString('id-ID')}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Total Target</p>
            <p className="text-3xl font-bold text-foreground">Rp {totalTarget.toLocaleString('id-ID')}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Tabungan Aktif</p>
            <p className="text-3xl font-bold text-blue-600">{activeSavings.length}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Tercapai</p>
            <p className="text-3xl font-bold text-emerald-600">{completedSavings.length}</p>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Progress Keseluruhan</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Pencapaian</span>
              <span className="text-sm font-semibold text-primary">{overallProgress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Rp {totalSavings.toLocaleString('id-ID')} dari Rp {totalTarget.toLocaleString('id-ID')}
            </p>
          </div>
        </Card>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Distribusi Tabungan</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: Rp ${value.toLocaleString('id-ID')}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
              </PieChart>
            </ResponsiveContainer>
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
                {status === 'all' ? 'Semua' : status === 'active' ? 'Aktif' : 'Tercapai'}
              </button>
            ))}
          </div>
        </div>

        {/* Savings List */}
        {filteredSavings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredSavings.map((saving) => (
              <SavingCard
                key={saving.id}
                saving={saving}
                progress={getProgressPercentage(saving.id)}
                remaining={getRemainingAmount(saving.id)}
                onDelete={handleDeleteSaving}
                onAdd={handleAddToSaving}
                onWithdraw={handleWithdrawFromSaving}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {savings.length === 0
                ? 'Belum ada target tabungan. Mulai dengan menambah target baru!'
                : 'Tidak ada tabungan dengan filter yang dipilih.'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
