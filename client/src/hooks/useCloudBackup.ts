import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { toast } from 'sonner';

export interface BackupMetadata {
  userId: number;
  timestamp: string;
  version: string;
  dataSize: number;
  recordCounts: {
    transactions: number;
    installments: number;
    savings: number;
    budgets: number;
  };
  compressed: boolean;
  encrypted: boolean;
}

export interface BackupResult {
  key: string;
  url: string;
  metadata: BackupMetadata;
}

/**
 * Hook untuk mengelola cloud backup
 * Menyediakan fungsi untuk membuat, restore, dan list backups
 */
export function useCloudBackup() {
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // tRPC mutations
  const createBackupMutation = trpc.backup.create.useMutation();
  const restoreBackupMutation = trpc.backup.restore.useMutation();
  const listBackupsMutation = trpc.backup.list.useQuery();

  /**
   * Buat backup baru ke cloud storage
   */
  const createBackup = async (): Promise<BackupResult | null> => {
    setIsCreating(true);
    try {
      const result = await createBackupMutation.mutateAsync();
      toast.success(`Backup berhasil dibuat! (${result.metadata.recordCounts.transactions} transaksi, ${result.metadata.recordCounts.installments} cicilan)`);
      return result;
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Gagal membuat backup');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Restore data dari backup
   */
  const restoreBackup = async (backupKey: string): Promise<boolean> => {
    setIsRestoring(true);
    try {
      const result = await restoreBackupMutation.mutateAsync({ backupKey });
      toast.success('Backup berhasil di-restore!');
      // Reload page untuk menampilkan data yang di-restore
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast.error('Gagal me-restore backup');
      return false;
    } finally {
      setIsRestoring(false);
    }
  };

  /**
   * List semua backup untuk user
   */
  const listBackups = () => {
    return listBackupsMutation.data || [];
  };

  return {
    createBackup,
    restoreBackup,
    listBackups,
    isCreating,
    isRestoring,
    isLoadingBackups: listBackupsMutation.isLoading,
  };
}
