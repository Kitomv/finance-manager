import { Saving } from '@/hooks/useSavings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

interface SavingCardProps {
  saving: Saving;
  progress: number;
  remaining: number;
  onDelete: (id: string) => void;
  onAdd: (id: string, amount: number) => void;
  onWithdraw: (id: string, amount: number) => void;
}

const categoryEmoji: Record<string, string> = {
  liburan: '🏖️',
  rumah: '🏠',
  kendaraan: '🚗',
  pendidikan: '📚',
  darurat: '🆘',
  lainnya: '📦',
};

export default function SavingCard({
  saving,
  progress,
  remaining,
  onDelete,
  onAdd,
  onWithdraw,
}: SavingCardProps) {
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const isCompleted = progress === 100;

  const handleAdd = () => {
    const amount = parseFloat(addAmount);
    if (amount > 0) {
      onAdd(saving.id, amount);
      setAddAmount('');
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= saving.currentAmount) {
      onWithdraw(saving.id, amount);
      setWithdrawAmount('');
    }
  };

  const categoryLabel = {
    liburan: 'Liburan',
    rumah: 'Rumah',
    kendaraan: 'Kendaraan',
    pendidikan: 'Pendidikan',
    darurat: 'Dana Darurat',
    lainnya: 'Lainnya',
  }[saving.category];

  return (
    <Card className="p-6 border border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{categoryEmoji[saving.category]}</span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{saving.name}</h3>
                <p className="text-xs text-muted-foreground">{categoryLabel}</p>
              </div>
              {isCompleted && (
                <Badge className="bg-emerald-100 text-emerald-800 ml-auto">Tercapai</Badge>
              )}
            </div>
            {saving.description && (
              <p className="text-sm text-muted-foreground mt-2">{saving.description}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(saving.id)}
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Amount Info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Sudah Ditabung</p>
            <p className="font-semibold text-foreground">Rp {saving.currentAmount.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Target</p>
            <p className="font-semibold text-foreground">Rp {saving.targetAmount.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Sisa</p>
            <p className="font-semibold text-amber-600">Rp {remaining.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm font-semibold text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Target Date */}
        {saving.targetDate && (
          <div className="text-sm text-muted-foreground">
            Target tanggal: <span className="font-medium text-foreground">{new Date(saving.targetDate).toLocaleDateString('id-ID')}</span>
          </div>
        )}

        {/* Add/Withdraw Section */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          {/* Add */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tambah Tabungan</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Rp"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!addAmount || parseFloat(addAmount) <= 0}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tarik Tabungan</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Rp"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > saving.currentAmount}
                className="gap-1"
              >
                <Minus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
