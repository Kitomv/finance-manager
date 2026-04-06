import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function Transactions() {
  const { transactions, isLoaded, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const handleAddTransaction = (data: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, data);
      toast.success('Transaksi berhasil diperbarui');
      setEditingTransaction(null);
    } else {
      addTransaction(data);
      toast.success(`${data.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil ditambahkan`);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    toast.success('Transaksi berhasil dihapus');
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  if (!isLoaded) {
    return (
      <DashboardLayout currentPage="transactions">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="transactions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Manajemen Transaksi</h1>
            <p className="text-muted-foreground">Kelola semua transaksi pemasukan dan pengeluaran Anda</p>
          </div>
          <TransactionForm
            onSubmit={handleAddTransaction}
            initialData={editingTransaction || undefined}
            isEdit={!!editingTransaction}
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">Filter:</span>
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Transaksi</SelectItem>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
          {editingTransaction && (
            <Button
              variant="outline"
              onClick={() => setEditingTransaction(null)}
              className="ml-auto"
            >
              Batalkan Edit
            </Button>
          )}
        </div>

        {/* Transaction List */}
        <TransactionList
          transactions={filteredTransactions}
          onDelete={handleDeleteTransaction}
          onEdit={handleEditTransaction}
        />
      </div>
    </DashboardLayout>
  );
}
