import { Installment } from '@/hooks/useInstallments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface InstallmentCardProps {
  installment: Installment;
  progress: number;
  totalPaid: number;
  remaining: number;
  onDelete: (id: string) => void;
  onMarkPayment: (installmentId: string, paymentId: string, isPaid: boolean) => void;
}

export default function InstallmentCard({
  installment,
  progress,
  totalPaid,
  remaining,
  onDelete,
  onMarkPayment,
}: InstallmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const paidCount = installment.payments.filter((p) => p.isPaid).length;
  const isCompleted = progress === 100;

  return (
    <Card className="p-6 border border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">{installment.name}</h3>
              {isCompleted && (
                <Badge className="bg-emerald-100 text-emerald-800">Selesai</Badge>
              )}
            </div>
            {installment.description && (
              <p className="text-sm text-muted-foreground">{installment.description}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(installment.id)}
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Amount Info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="font-semibold text-foreground">Rp {installment.totalAmount.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Per Bulan</p>
            <p className="font-semibold text-foreground">Rp {installment.monthlyAmount.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Durasi</p>
            <p className="font-semibold text-foreground">{installment.totalMonths} Bulan</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Progress Pembayaran</span>
            <span className="text-sm font-semibold text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{paidCount} dari {installment.totalMonths} bulan terbayar</span>
            <span>Rp {totalPaid.toLocaleString('id-ID')} / Rp {installment.totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Sisa Pembayaran */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700 mb-1">Sisa Pembayaran</p>
          <p className="text-lg font-bold text-amber-900">Rp {remaining.toLocaleString('id-ID')}</p>
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full gap-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Sembunyikan Jadwal Pembayaran
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Tampilkan Jadwal Pembayaran ({paidCount}/{installment.totalMonths})
            </>
          )}
        </Button>

        {/* Payment Schedule */}
        {expanded && (
          <div className="space-y-2 border-t border-border pt-4">
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {installment.payments.map((payment) => {
                const monthName = new Date(2024, payment.month - 1).toLocaleDateString('id-ID', {
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={payment.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      payment.isPaid
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-secondary border-border'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{monthName}</p>
                      <p className="text-xs text-muted-foreground">
                        Rp {payment.amount.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={payment.isPaid ? 'default' : 'outline'}
                      onClick={() => onMarkPayment(installment.id, payment.id, !payment.isPaid)}
                      className="text-xs"
                    >
                      {payment.isPaid ? '✓ Terbayar' : 'Tandai Bayar'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
