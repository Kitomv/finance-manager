import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useInstallments } from '@/hooks/useInstallments';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { toast } from 'sonner';

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const { transactions, isLoaded, addTransaction, deleteTransaction, getTotalIncome, getTotalExpense, getBalance } = useTransactions();
  const { installments, getProgressPercentage, getUpcomingPayments } = useInstallments();
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate chart data from transactions
  useEffect(() => {
    if (!isLoaded) return;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const data = last7Days.map((date) => {
      const dayTransactions = transactions.filter((t) => t.date === date);
      const income = dayTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        income,
        expense,
      };
    });

    setChartData(data);
  }, [transactions, isLoaded]);

  const handleAddTransaction = (data: Omit<Transaction, 'id' | 'timestamp'>) => {
    addTransaction(data);
    toast.success(`${data.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil ditambahkan`);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    toast.success('Transaksi berhasil dihapus');
  };

  const upcomingPayments = getUpcomingPayments();
  const activeInstallments = installments.filter((i) => getProgressPercentage(i.id) < 100).length;

  if (!isLoaded) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();
  const balance = getBalance();
  const recentTransactions = transactions.slice(0, 10);

  return (
    <DashboardLayout currentPage="dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard Keuangan</h1>
            <p className="text-muted-foreground">Pantau pemasukan dan pengeluaran Anda</p>
          </div>
          <TransactionForm onSubmit={handleAddTransaction} />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Saldo Total"
            value={balance}
            icon={Wallet}
            color="emerald"
          />
          <StatCard
            title="Total Pemasukan"
            value={totalIncome}
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard
            title="Total Pengeluaran"
            value={totalExpense}
            icon={TrendingDown}
            color="amber"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pemasukan vs Pengeluaran (7 Hari Terakhir)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip
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
          </div>

          {/* Line Chart */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Trend Saldo (7 Hari Terakhir)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.map((d, i) => ({
                ...d,
                balance: chartData.slice(0, i + 1).reduce((sum, day) => sum + day.income - day.expense, 0),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  name="Saldo"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Installments */}
        {upcomingPayments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Cicilan Mendatang</h2>
            <Card className="p-6 border border-border bg-blue-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {upcomingPayments.slice(0, 4).map((payment) => (
                  <div key={payment.id} className="bg-white p-4 rounded-lg border border-blue-200">
                    <p className="font-medium text-foreground text-sm">{payment.installmentName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(2024, payment.month - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })}
                    </p>
                    <p className="font-bold text-blue-600 mt-2">Rp {payment.amount.toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>
              <Link href="/installments">
                <Button variant="outline" size="sm" className="gap-2 mt-4">
                  <CreditCard className="w-4 h-4" />
                  Lihat Semua Cicilan ({activeInstallments} aktif)
                </Button>
              </Link>
            </Card>
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Transaksi Terbaru</h2>
          <TransactionList
            transactions={recentTransactions}
            onDelete={handleDeleteTransaction}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
