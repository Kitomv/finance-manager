import { useCloudBackup } from '@/hooks/useCloudBackup';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cloud, Download, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function CloudBackupManager() {
  const { createBackup, restoreBackup, listBackups, isCreating, isRestoring, isLoadingBackups } = useCloudBackup();
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  const backups = listBackups();

  const handleCreateBackup = async () => {
    const result = await createBackup();
    if (result) {
      // Refresh backup list
      window.location.reload();
    }
  };

  const handleRestoreBackup = async (backupKey: string) => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin me-restore backup ini? Data saat ini akan diganti dengan data dari backup.'
    );
    if (confirmed) {
      await restoreBackup(backupKey);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Cloud className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Cloud Backup</h3>
          <p className="text-sm text-muted-foreground">Kelola backup data Anda di cloud storage</p>
        </div>
      </div>

      {/* Create Backup Button */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
              Buat backup otomatis dari semua data keuangan Anda ke cloud storage
            </p>
            <Button
              onClick={handleCreateBackup}
              disabled={isCreating}
              className="gap-2"
              size="sm"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat backup...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Buat Backup Sekarang
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Backups List */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">Riwayat Backup</h4>
        
        {isLoadingBackups ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : backups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada backup. Buat backup pertama Anda sekarang.
          </p>
        ) : (
          <div className="space-y-2">
            {backups.map((backup: any) => (
              <div
                key={backup.key}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{new Date(backup.metadata.timestamp).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-muted-foreground">
                    {backup.metadata.recordCounts.transactions} transaksi, {backup.metadata.recordCounts.installments} cicilan
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setSelectedBackup(backup.key)}
                    >
                      <Download className="w-4 h-4" />
                      Restore
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Restore Backup</DialogTitle>
                      <DialogDescription>
                        Apakah Anda yakin ingin me-restore backup ini? Data saat ini akan diganti dengan data dari backup tanggal {new Date(backup.metadata.timestamp).toLocaleString('id-ID')}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline">Batal</Button>
                      <Button
                        onClick={() => {
                          handleRestoreBackup(backup.key);
                        }}
                        disabled={isRestoring}
                        className="gap-2"
                      >
                        {isRestoring ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Restore
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info */}
      <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 dark:text-amber-100">
            <p className="font-medium mb-2">Informasi Penting:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Backup disimpan di cloud storage yang aman</li>
              <li>Data dikompresi untuk menghemat ruang penyimpanan</li>
              <li>Anda dapat me-restore backup kapan saja</li>
              <li>Backup lama akan dihapus secara otomatis setelah 30 hari</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
