import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';

interface TransactionFormProps {
  onSubmit: (data: Omit<Transaction, 'id' | 'timestamp'>) => void;
  initialData?: Omit<Transaction, 'id' | 'timestamp'>;
  isEdit?: boolean;
}

const INCOME_CATEGORIES = ['Gaji', 'Bonus', 'Investasi', 'Bisnis', 'Lainnya'];
const EXPENSE_CATEGORIES = ['Makanan', 'Transportasi', 'Hiburan', 'Kesehatan', 'Belanja', 'Tagihan', 'Lainnya'];

export default function TransactionForm({ onSubmit, initialData, isEdit = false }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description) {
      alert('Semua field harus diisi');
      return;
    }

    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
    });

    // Reset form
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Ubah detail transaksi Anda' : 'Catat pemasukan atau pengeluaran Anda'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('');
              }}
              className={`p-3 rounded-lg border-2 transition-all font-medium ${
                type === 'income'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-border bg-background text-foreground hover:border-border'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('');
              }}
              className={`p-3 rounded-lg border-2 transition-all font-medium ${
                type === 'expense'
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-border bg-background text-foreground hover:border-border'
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              placeholder="Contoh: Belanja kebutuhan sehari-hari"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            {isEdit ? 'Simpan Perubahan' : 'Tambah Transaksi'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
