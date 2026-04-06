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
import { Saving } from '@/hooks/useSavings';

interface SavingFormProps {
  onSubmit: (data: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isEdit?: boolean;
}

const categories = [
  { value: 'liburan', label: '🏖️ Liburan' },
  { value: 'rumah', label: '🏠 Rumah' },
  { value: 'kendaraan', label: '🚗 Kendaraan' },
  { value: 'pendidikan', label: '📚 Pendidikan' },
  { value: 'darurat', label: '🆘 Dana Darurat' },
  { value: 'lainnya', label: '📦 Lainnya' },
];

export default function SavingForm({ onSubmit, isEdit = false }: SavingFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState('lainnya');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      alert('Nama dan target jumlah harus diisi');
      return;
    }

    onSubmit({
      name,
      description,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      category: category as any,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: targetDate || undefined,
    });

    // Reset form
    setName('');
    setDescription('');
    setTargetAmount('');
    setCurrentAmount('');
    setCategory('lainnya');
    setTargetDate('');
    setOpen(false);
  };

  const remainingAmount = targetAmount && currentAmount ? (parseFloat(targetAmount) - parseFloat(currentAmount)).toLocaleString('id-ID') : targetAmount ? parseFloat(targetAmount).toLocaleString('id-ID') : '0';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {isEdit ? 'Edit Tabungan' : 'Tambah Tabungan'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tabungan' : 'Tambah Target Tabungan'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Ubah detail tabungan Anda' : 'Buat target tabungan baru untuk mencapai tujuan finansial Anda'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Tabungan</Label>
            <Input
              id="name"
              placeholder="Contoh: Liburan ke Bali, Beli Motor"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target Jumlah</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
              <Input
                id="targetAmount"
                type="number"
                placeholder="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Current Amount */}
          <div className="space-y-2">
            <Label htmlFor="currentAmount">Jumlah Saat Ini (Opsional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
              <Input
                id="currentAmount"
                type="number"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Remaining Amount Display */}
          {targetAmount && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">Sisa untuk ditabung:</p>
              <p className="text-lg font-semibold text-primary">Rp {remainingAmount}</p>
            </div>
          )}

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Tanggal (Opsional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Input
              id="description"
              placeholder="Catatan tambahan tentang tabungan ini"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            {isEdit ? 'Simpan Perubahan' : 'Buat Tabungan'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
