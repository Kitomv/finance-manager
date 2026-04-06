import { useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Trash2, Download, Upload } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useInstallments } from '@/hooks/useInstallments';
import { useSavings } from '@/hooks/useSavings';
import { toast } from 'sonner';

export default function Settings() {
  const { transactions, importTransactions } = useTransactions();
  const { installments, importInstallments } = useInstallments();
  const { savings, importSavings } = useSavings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    const allData = {
      transactions,
      installments,
      savings,
      exportDate: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Semua data berhasil diunduh');
  };

  const handleClearData = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus SEMUA data (transaksi, cicilan, tabungan)? Tindakan ini tidak dapat dibatalkan.')) {
      localStorage.removeItem('finance-manager-transactions');
      localStorage.removeItem('finance-manager-installments');
      localStorage.removeItem('finance-manager-savings');
      window.location.reload();
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Check if it's new format (object with transactions, installments, savings)
        if (importedData.transactions && typeof importedData.transactions === 'object') {
          // New format: backup file
          let totalImported = 0;
          
          if (Array.isArray(importedData.transactions)) {
            importTransactions(importedData.transactions);
            totalImported += importedData.transactions.length;
            toast.success(`${importedData.transactions.length} transaksi berhasil diimport`);
          }
          if (Array.isArray(importedData.installments)) {
            importInstallments(importedData.installments);
            totalImported += importedData.installments.length;
            toast.success(`${importedData.installments.length} cicilan berhasil diimport`);
          }
          if (Array.isArray(importedData.savings)) {
            importSavings(importedData.savings);
            totalImported += importedData.savings.length;
            toast.success(`${importedData.savings.length} tabungan berhasil diimport`);
          }
          
          if (totalImported === 0) {
            toast.error('Tidak ada data yang diimport.');
          }
        } else if (Array.isArray(importedData)) {
          // Old format: array of transactions only
          const isValid = importedData.every(
            (item: any) =>
              item.id &&
              item.type &&
              item.amount &&
              item.category &&
              item.date
          );

          if (!isValid) {
            toast.error('Struktur data tidak valid.');
            return;
          }

          importTransactions(importedData);
          toast.success(`${importedData.length} transaksi berhasil diimport`);
        } else {
          toast.error('Format JSON tidak valid.');
        }
      } catch (error) {
        toast.error('Gagal membaca file JSON. Pastikan format file benar.');
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout currentPage="settings">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Pengaturan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Kelola data dan preferensi aplikasi Anda</p>
        </div>

        {/* Data Management */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-foreground mb-4">Manajemen Data</h2>
          <div className="space-y-4">
            {/* Import Data */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-secondary rounded-lg">
              <div>
                <h3 className="font-medium text-foreground text-sm sm:text-base">Impor Data</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Impor semua data (transaksi, cicilan, tabungan) dari file backup JSON
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4" />
                  Impor
                </Button>
              </div>
            </div>

            {/* Export Data */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-secondary rounded-lg">
              <div>
                <h3 className="font-medium text-foreground text-sm sm:text-base">Ekspor Data</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Unduh semua data (transaksi, cicilan, tabungan) dalam format JSON
                </p>
              </div>
              <Button onClick={handleExportData} className="gap-2 w-full sm:w-auto">
                <Download className="w-4 h-4" />
                Ekspor
              </Button>
            </div>

            {/* Clear Data */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground text-sm sm:text-base">Hapus Semua Data</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Hapus semua transaksi, cicilan, dan tabungan. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClearData}
                variant="destructive"
                className="gap-2 flex-shrink-0 w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </Button>
            </div>
          </div>
        </Card>

        {/* App Info */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-foreground mb-4">Informasi Aplikasi</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nama Aplikasi</span>
              <span className="font-medium text-foreground">Personal Finance Manager</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Versi</span>
              <span className="font-medium text-foreground">2.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Transaksi</span>
              <span className="font-medium text-foreground">{transactions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Cicilan</span>
              <span className="font-medium text-foreground">{installments.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Tabungan</span>
              <span className="font-medium text-foreground">{savings.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Penyimpanan Data</span>
              <span className="font-medium text-foreground">Local Storage</span>
            </div>
          </div>
        </Card>

        {/* Help */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-foreground mb-4">Bantuan</h2>
          <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
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
              <strong className="text-foreground">Cicilan:</strong> Kelola cicilan pembayaran dengan tracking pembayaran per bulan.
            </p>
            <p>
              <strong className="text-foreground">Tabungan:</strong> Buat target tabungan dan pantau progress mencapai target Anda.
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
