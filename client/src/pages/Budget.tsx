import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useBudget } from '@/hooks/useBudget';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, Plus, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  'Makanan',
  'Transportasi',
  'Hiburan',
  'Belanja',
  'Kesehatan',
  'Pendidikan',
  'Utilitas',
  'Lainnya',
];

export default function Budget() {
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudget();
  const { transactions } = useTransactions();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthBudgets = budgets.filter(b => b.month === month && b.year === year);

  const handleAddBudget = () => {
    if (!category || !limit) return;
    if (editingId) {
      updateBudget(editingId, parseFloat(limit));
      setEditingId(null);
    } else {
      addBudget(category, parseFloat(limit), month, year);
    }
    setCategory('');
    setLimit('');
    setIsOpen(false);
  };

  const handleEdit = (b: typeof budgets[0]) => {
    setEditingId(b.id);
    setCategory(b.category);
    setLimit(b.limit.toString());
    setIsOpen(true);
  };

  const calculateSpent = (category: string) => {
    return transactions
      .filter(t => t.type === 'expense' && t.category === category && 
        new Date(t.date).getMonth() + 1 === month &&
        new Date(t.date).getFullYear() === year)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'destructive';
    if (percentage >= 80) return 'warning';
    return 'default';
  };

  return (
    <DashboardLayout currentPage="budget">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manajemen Budget</h1>
            <p className="text-sm text-muted-foreground mt-1">Atur dan pantau budget pengeluaran Anda</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => {
                setEditingId(null);
                setCategory('');
                setLimit('');
              }}>
                <Plus className="w-4 h-4" />
                Tambah Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Budget' : 'Tambah Budget Baru'}</DialogTitle>
                <DialogDescription>
                  {editingId ? 'Ubah limit budget' : 'Buat budget baru untuk kategori pengeluaran'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {!editingId && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Kategori</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Bulan</label>
                      <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <SelectItem key={m} value={m.toString()}>
                              {new Date(2024, m - 1).toLocaleDateString('id-ID', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Tahun</label>
                      <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Limit Budget</label>
                  <Input
                    type="number"
                    placeholder="Masukkan limit budget"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                    Batal
                  </Button>
                  <Button onClick={handleAddBudget} className="flex-1">
                    {editingId ? 'Simpan Perubahan' : 'Tambah Budget'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Month Selector */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(2024, m - 1).toLocaleDateString('id-ID', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Budget List */}
        {monthBudgets.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada budget untuk bulan ini</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {monthBudgets.map(budget => {
              const spent = calculateSpent(budget.category);
              const percentage = getProgressPercentage(spent, budget.limit);
              const statusColor = getStatusColor(percentage);

              return (
                <Card key={budget.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{budget.category}</h3>
                        <Badge variant={statusColor === 'destructive' ? 'destructive' : statusColor === 'warning' ? 'secondary' : 'default'}>
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Rp {spent.toLocaleString('id-ID')} dari Rp {budget.limit.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(budget)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBudget(budget.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        statusColor === 'destructive'
                          ? 'bg-destructive'
                          : statusColor === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {percentage >= 80 && (
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950 rounded text-xs text-amber-700 dark:text-amber-200">
                      ⚠️ Anda sudah menggunakan {percentage.toFixed(0)}% dari budget
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
