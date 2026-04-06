import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Wrench, Copy, RotateCcw, Trash2, Download } from 'lucide-react';
import { Installment } from '@/hooks/useInstallments';
import { toast } from 'sonner';

interface InstallmentMaintenanceProps {
  installments: Installment[];
  onDuplicate: (installment: Installment) => void;
  onReset: (id: string) => void;
  onDeleteAll: () => void;
  onExport: () => void;
}

export default function InstallmentMaintenance({
  installments,
  onDuplicate,
  onReset,
  onDeleteAll,
  onExport,
}: InstallmentMaintenanceProps) {
  const [open, setOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

  const handleDuplicate = (installment: Installment) => {
    onDuplicate(installment);
    toast.success(`Cicilan "${installment.name}" berhasil diduplikasi`);
    setSelectedInstallment(null);
  };

  const handleReset = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin mereset cicilan "${name}"? Semua pembayaran akan ditandai sebagai belum terbayar.`)) {
      onReset(id);
      toast.success('Cicilan berhasil direset');
      setSelectedInstallment(null);
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('Apakah Anda YAKIN ingin menghapus SEMUA cicilan? Tindakan ini tidak dapat dibatalkan!')) {
      if (window.confirm('Konfirmasi sekali lagi: Hapus semua cicilan?')) {
        onDeleteAll();
        toast.success('Semua cicilan berhasil dihapus');
        setOpen(false);
      }
    }
  };

  const completedCount = installments.filter((i) => i.payments.every((p) => p.isPaid)).length;
  const activeCount = installments.length - completedCount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wrench className="w-4 h-4" />
          Maintenance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Maintenance Cicilan</DialogTitle>
          <DialogDescription>
            Kelola dan pelihara data cicilan Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Cicilan</p>
              <p className="text-2xl font-bold text-foreground">{installments.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Aktif</p>
              <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Selesai</p>
              <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            </Card>
          </div>

          {/* Duplicate Installment */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Duplikasi Cicilan
            </h3>
            <p className="text-sm text-muted-foreground">
              Buat salinan dari cicilan yang sudah ada dengan parameter yang sama
            </p>
            {installments.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {installments.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{inst.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rp {inst.totalAmount.toLocaleString('id-ID')} / {inst.totalMonths} bulan
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicate(inst)}
                      className="gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Duplikasi
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Tidak ada cicilan untuk diduplikasi</p>
            )}
          </div>

          {/* Reset Installment */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset Cicilan
            </h3>
            <p className="text-sm text-muted-foreground">
              Tandai semua pembayaran cicilan sebagai belum terbayar
            </p>
            {installments.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {installments.map((inst) => {
                  const paidCount = inst.payments.filter((p) => p.isPaid).length;
                  if (paidCount === 0) return null;
                  return (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">{inst.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {paidCount} dari {inst.totalMonths} bulan sudah terbayar
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReset(inst.id, inst.name)}
                        className="gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Tidak ada cicilan untuk direset</p>
            )}
          </div>

          {/* Bulk Actions */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-semibold text-foreground">Aksi Massal</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={onExport}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Ekspor Semua
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAll}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Semua
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
