import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ActivityLog() {
  const { logs, getRecentLogs, getLogsByType, getLogsByAction, clearLogs, exportLogs } = useActivityLog();
  const [filterType, setFilterType] = useState<'all' | 'transaction' | 'installment' | 'saving'>('all');
  const [filterAction, setFilterAction] = useState<'all' | 'create' | 'update' | 'delete'>('all');

  const filteredLogs = logs.filter((log) => {
    const typeMatch = filterType === 'all' || log.type === filterType;
    const actionMatch = filterAction === 'all' || log.action === filterAction;
    return typeMatch && actionMatch;
  });

  const handleClearLogs = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua log aktivitas? Tindakan ini tidak dapat dibatalkan.')) {
      clearLogs();
      toast.success('Semua log aktivitas berhasil dihapus');
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

  return (
    <DashboardLayout currentPage="activity-log">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Log Aktivitas</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Pantau semua perubahan data di aplikasi Anda</p>
        </div>

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
            <Button
              onClick={handleClearLogs}
              variant="destructive"
              className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua
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
                        {new Date(log.timestamp).toLocaleString('id-ID')}
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
    </DashboardLayout>
  );
}
