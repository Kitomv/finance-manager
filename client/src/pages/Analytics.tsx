import { useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTransactions } from '@/hooks/useTransactions';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const { transactions, isLoaded } = useTransactions();

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });

      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        months[monthKey].income += t.amount;
      } else {
        months[monthKey].expense += t.amount;
      }
    });

    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-12);
  }, [transactions]);

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6'];

  if (!isLoaded) {
    return (
      <DashboardLayout currentPage="analytics">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="analytics">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Analitik Keuangan</h1>
          <p className="text-muted-foreground">Visualisasi detail pengeluaran dan pemasukan Anda</p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Expense by Category */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pengeluaran Berdasarkan Kategori</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: Rp ${value.toLocaleString('id-ID')}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    contentStyle={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Belum ada data pengeluaran
              </div>
            )}
          </div>

          {/* Bar Chart - Monthly Comparison */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pemasukan vs Pengeluaran (12 Bulan Terakhir)</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    contentStyle={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name="Pemasukan" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="#F59E0B" name="Pengeluaran" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Belum ada data transaksi
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Table */}
        {categoryData.length > 0 && (
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Rincian Pengeluaran Kategori</h2>
            <div className="space-y-3">
              {categoryData.map((item, index) => {
                const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(1);
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">Rp {item.value.toLocaleString('id-ID')}</p>
                        <p className="text-sm text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
