import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { Installment } from '@/hooks/useInstallments';

interface InstallmentFormProps {
  onSubmit: (data: Omit<Installment, 'id' | 'createdAt' | 'payments'>) => void;
  isEdit?: boolean;
}

export default function InstallmentForm({ onSubmit, isEdit = false }: InstallmentFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [startMonth, setStartMonth] = useState(String(new Date().getMonth() + 1));
  const [startYear, setStartYear] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalAmount || !totalMonths) {
      alert('Nama, jumlah total, dan jumlah bulan harus diisi');
      return;
    }

    const total = parseFloat(totalAmount);
    const months = parseInt(totalMonths);
    const monthlyAmount = total / months;

    onSubmit({
      name,
      totalAmount: total,
      monthlyAmount,
      totalMonths: months,
      startMonth: parseInt(startMonth),
      startYear: parseInt(startYear),
      description,
    });

    // Reset form
    setName('');
    setTotalAmount('');
    setTotalMonths('');
    setStartMonth(String(new Date().getMonth() + 1));
    setStartYear(String(new Date().getFullYear()));
    setDescription('');
    setOpen(false);
  };

  const monthlyAmount = totalAmount && totalMonths ? (parseFloat(totalAmount) / parseInt(totalMonths)).toLocaleString('id-ID') : '0';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {isEdit ? 'Edit Cicilan' : 'Tambah Cicilan'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Cicilan' : 'Tambah Cicilan Baru'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Ubah detail cicilan Anda' : 'Catat cicilan pembayaran Anda'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Cicilan</Label>
            <Input
              id="name"
              placeholder="Contoh: Motor, Rumah, Laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Jumlah Total</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
              <Input
                id="totalAmount"
                type="number"
                placeholder="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Total Months */}
          <div className="space-y-2">
            <Label htmlFor="totalMonths">Jumlah Bulan</Label>
            <Input
              id="totalMonths"
              type="number"
              placeholder="12"
              value={totalMonths}
              onChange={(e) => setTotalMonths(e.target.value)}
              min="1"
            />
          </div>

          {/* Monthly Amount Display */}
          {totalAmount && totalMonths && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">Cicilan per bulan:</p>
              <p className="text-lg font-semibold text-primary">Rp {monthlyAmount}</p>
            </div>
          )}

          {/* Start Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startMonth">Bulan Mulai</Label>
              <select
                id="startMonth"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleDateString('id-ID', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startYear">Tahun Mulai</Label>
              <select
                id="startYear"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Input
              id="description"
              placeholder="Catatan tambahan tentang cicilan ini"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            {isEdit ? 'Simpan Perubahan' : 'Tambah Cicilan'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
