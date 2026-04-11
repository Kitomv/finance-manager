import { useRef, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, Download, Upload, History, Shield } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useInstallments } from '@/hooks/useInstallments';
import { useSavings } from '@/hooks/useSavings';
import { useActivityLog } from '@/hooks/useActivityLog';
import CloudBackupManager from '@/components/CloudBackupManager';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const { transactions, importTransactions } = useTransactions();
  const { installments, importInstallments } = useInstallments();
  const { savings, importSavings } = useSavings();
  const { logs, getRecentLogs, getLogsByType, getLogsByAction, exportLogs } = useActivityLog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'activity' | 'backup'>('general');
  const [filterType, setFilterType] = useState<'all' | 'transaction' | 'installment' | 'saving'>('all');
  const [filterAction, setFilterAction] = useState<'all' | 'create' | 'update' | 'delete'>('all');
  
  // tRPC mutations for delete all
  const deleteAllTransactionsMutation = trpc.transactions.deleteAll.useMutation();
  const deleteAllInstallmentsMutation = trpc.installments.deleteAll.useMutation();
  const deleteAllSavingsMutation = trpc.savings.deleteAll.useMutation();
  const deleteAllBudgetsMutation = trpc.budgets.deleteAll.useMutation();

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

  const handleClearData = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus SEMUA data (transaksi, cicilan, tabungan, budget)? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    
    try {
      // Delete all data from database
      await Promise.all([
        deleteAllTransactionsMutation.mutateAsync(),
        deleteAllInstallmentsMutation.mutateAsync(),
        deleteAllSavingsMutation.mutateAsync(),
        deleteAllBudgetsMutation.mutateAsync(),
      ]);
      
      toast.success('Semua data berhasil dihapus');
    } catch (error) {
      console.error('Failed to delete all data:', error);
      toast.error('Gagal menghapus data. Silakan coba lagi.');
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'bg-blue-100 text-blue-800';
      case 'installment':
        return 'bg-purple-100 text-purple-800';
      case 'saving':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-emerald-100 text-emerald-800';
      case 'update':
        return 'bg-amber-100 text-amber-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Tambah';
      case 'update':
        return 'Ubah';
      case 'delete':
        return 'Hapus';
      default:
        return action;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'Transaksi';
      case 'installment':
        return 'Cicilan';
      case 'saving':
        return 'Tabungan';
      default:
        return type;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const typeMatch = filterType === 'all' || log.type === filterType;
    const actionMatch = filterAction === 'all' || log.action === filterAction;
    return typeMatch && actionMatch;
  });

  return (
    <DashboardLayout currentPage="settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Pengaturan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Kelola data dan preferensi aplikasi Anda</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Umum
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            Log Aktivitas
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Download className="w-4 h-4" />
            Cloud Backup
          </button>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Data Management - Only for Admin */}
            {user?.role === 'admin' ? (
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
            ) : user && (user as any).role === 'admin' ? null : (
              <Card className="p-4 sm:p-6 border-amber-200 bg-amber-50">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="font-medium text-amber-900">Akses Terbatas</h3>
                    <p className="text-sm text-amber-700 mt-1">Anda tidak memiliki izin untuk mengakses fitur Manajemen Data.</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Security */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-foreground mb-4">Keamanan</h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Kelola pengaturan keamanan akun Anda</p>
                <ChangePasswordDialog />
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
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Log</div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">{logs.length}</div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Transaksi</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{getLogsByType('transaction').length}</div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Cicilan</div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{getLogsByType('installment').length}</div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Tabungan</div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">{getLogsByType('saving').length}</div>
              </Card>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <label className="text-xs sm:text-sm font-medium text-foreground block mb-2">Tipe</label>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="transaction">Transaksi</SelectItem>
                    <SelectItem value="installment">Cicilan</SelectItem>
                    <SelectItem value="saving">Tabungan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-xs sm:text-sm font-medium text-foreground block mb-2">Aksi</label>
                <Select value={filterAction} onValueChange={(value: any) => setFilterAction(value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Aksi</SelectItem>
                    <SelectItem value="create">Tambah</SelectItem>
                    <SelectItem value="update">Ubah</SelectItem>
                    <SelectItem value="delete">Hapus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-6 sm:pt-0">
                <Button
                  onClick={exportLogs}
                  variant="outline"
                  className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Download className="w-4 h-4" />
                  Ekspor
                </Button>

              </div>
            </div>

            {/* Activity Log List */}
            <Card className="p-0 overflow-hidden">
              {filteredLogs.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <p className="text-muted-foreground text-sm">Tidak ada log aktivitas yang sesuai dengan filter</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-secondary border-b border-border">
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground">Waktu</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground">Tipe</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground">Aksi</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground">Deskripsi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('id-ID')}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <Badge className={getTypeColor(log.type)} variant="outline">
                              {getTypeLabel(log.type)}
                            </Badge>
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <Badge className={getActionColor(log.action)} variant="outline">
                              {getActionLabel(log.action)}
                            </Badge>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-foreground">
                            {log.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Pagination Info */}
            {filteredLogs.length > 0 && (
              <div className="text-center text-xs sm:text-sm text-muted-foreground">
                Menampilkan {filteredLogs.length} dari {logs.length} log aktivitas
              </div>
            )}
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <CloudBackupManager />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
