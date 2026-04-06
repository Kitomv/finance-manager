import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTransactions } from '@/hooks/useTransactions';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Analytics() {
  const { transactions, isLoaded } = useTransactions();
  const [selectedMonth, setSelectedMonth] = useState<string>('');

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
    const months: Record<string, { income: number; expense: number; balance: number }> = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });

      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expense: 0, balance: 0 };
      }

      if (t.type === 'income') {
        months[monthKey].income += t.amount;
      } else {
        months[monthKey].expense += t.amount;
      }
      months[monthKey].balance = months[monthKey].income - months[monthKey].expense;
    });

    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-12);
  }, [transactions]);

  // Get current month analytics
  const currentMonthKey = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
  const currentMonthData = monthlyData.find((m) => m.month === currentMonthKey);
  
  // Get previous month for comparison
  const previousMonthData = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  // Monthly category breakdown
  const monthlyCategories = useMemo(() => {
    if (!selectedMonth) return null;

    const categories: Record<string, number> = {};
    transactions
      .filter((t) => {
        const date = new Date(t.date);
        const monthKey = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
        return t.type === 'expense' && monthKey === selectedMonth;
      })
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedMonth]);

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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Analitik Keuangan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Visualisasi detail pengeluaran dan pemasukan Anda</p>
        </div>

        {/* Current Month Summary */}
        {currentMonthData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="p-4 sm:p-6 border border-border bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pemasukan Bulan Ini</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">Rp {currentMonthData.income.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-3xl sm:text-4xl text-blue-200">📈</div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 border border-border bg-gradient-to-br from-amber-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pengeluaran Bulan Ini</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-600">Rp {currentMonthData.expense.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-3xl sm:text-4xl text-amber-200">📉</div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 border border-border bg-gradient-to-br from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Saldo Bulan Ini</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${currentMonthData.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Rp {currentMonthData.balance.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-3xl sm:text-4xl text-emerald-200">💰</div>
              </div>
            </Card>
          </div>
        )}

        {/* Month-over-Month Comparison */}
        {currentMonthData && previousMonthData && (
          <Card className="p-4 sm:p-6 border border-border">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Perbandingan Bulan Sebelumnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Perubahan Pemasukan</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {((currentMonthData.income - previousMonthData.income) / previousMonthData.income * 100).toFixed(1)}%
                  </span>
                  {currentMonthData.income >= previousMonthData.income ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>

              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Perubahan Pengeluaran</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {((currentMonthData.expense - previousMonthData.expense) / previousMonthData.expense * 100).toFixed(1)}%
                  </span>
                  {currentMonthData.expense <= previousMonthData.expense ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>

              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Perubahan Saldo</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {((currentMonthData.balance - previousMonthData.balance) / Math.abs(previousMonthData.balance) * 100).toFixed(1)}%
                  </span>
                  {currentMonthData.balance >= previousMonthData.balance ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Line Chart - Monthly Balance Trend */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Tren Saldo (12 Bulan)</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    contentStyle={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#10B981" strokeWidth={2} name="Saldo" dot={{ fill: '#10B981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Belum ada data transaksi
              </div>
            )}
          </div>

          {/* Bar Chart - Monthly Comparison */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Pemasukan vs Pengeluaran (12 Bulan)</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
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

        {/* Pie Chart - Expense by Category */}
        <div className="bg-card rounded-xl p-4 sm:p-6 border border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Pengeluaran Berdasarkan Kategori</h2>
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

        {/* Monthly Selector and Category Breakdown */}
        <div className="bg-card rounded-xl p-4 sm:p-6 border border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Rincian Pengeluaran Kategori</h2>
          
          {/* Month Selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">Pilih Bulan:</label>
            <select
              value={selectedMonth || currentMonthKey}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {monthlyData.map((m) => (
                <option key={m.month} value={m.month}>
                  {m.month}
                </option>
              ))}
            </select>
          </div>

          {/* Category Breakdown */}
          {monthlyCategories && monthlyCategories.length > 0 ? (
            <div className="space-y-3">
              {monthlyCategories.map((item, index) => {
                const total = monthlyCategories.reduce((sum, c) => sum + c.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(1);
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 sm:w-32 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">Rp {item.value.toLocaleString('id-ID')}</p>
                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Tidak ada data pengeluaran untuk bulan yang dipilih</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
