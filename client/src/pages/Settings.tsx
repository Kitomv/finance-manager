import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Trash2, Download } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';

export default function Settings() {
  const { transactions } = useTransactions();

  const handleExportData = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Data berhasil diunduh');
  };

  const handleClearData = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
      localStorage.removeItem('finance-manager-transactions');
      window.location.reload();
    }
  };

  return (
    <DashboardLayout currentPage="settings">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola data dan preferensi aplikasi Anda</p>
        </div>

        {/* Data Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Manajemen Data</h2>
          <div className="space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Ekspor Data</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Unduh semua data transaksi Anda dalam format JSON
                </p>
              </div>
              <Button onClick={handleExportData} className="gap-2">
                <Download className="w-4 h-4" />
                Ekspor
              </Button>
            </div>

            {/* Clear Data */}
            <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">Hapus Semua Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hapus semua transaksi dan data aplikasi. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClearData}
                variant="destructive"
                className="gap-2 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </Button>
            </div>
          </div>
        </Card>

        {/* App Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Informasi Aplikasi</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nama Aplikasi</span>
              <span className="font-medium text-foreground">Personal Finance Manager</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Versi</span>
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Transaksi</span>
              <span className="font-medium text-foreground">{transactions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Penyimpanan Data</span>
              <span className="font-medium text-foreground">Local Storage</span>
            </div>
          </div>
        </Card>

        {/* Help */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Bantuan</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Dashboard:</strong> Lihat ringkasan keuangan Anda dengan grafik pemasukan dan pengeluaran.
            </p>
            <p>
              <strong className="text-foreground">Transaksi:</strong> Tambah, edit, atau hapus transaksi pemasukan dan pengeluaran Anda.
            </p>
            <p>
              <strong className="text-foreground">Analitik:</strong> Analisis detail pengeluaran Anda berdasarkan kategori dan bulan.
            </p>
            <p>
              <strong className="text-foreground">Pengaturan:</strong> Kelola data aplikasi dan preferensi Anda.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
