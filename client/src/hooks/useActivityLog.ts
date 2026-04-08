import { trpc } from '@/lib/trpc';
import { useMemo } from 'react';

export interface ActivityLog {
  id: string;
  userId: number;
  type: 'transaction' | 'installment' | 'saving' | 'budget' | 'backup';
  action: 'create' | 'update' | 'delete' | 'restore';
  description: string;
  createdAt: Date;
}

/**
 * Hook untuk mengakses activity logs dari database
 * Menggantikan localStorage-based activity logging
 */
export function useActivityLog() {
  // Fetch activity logs dari database via tRPC
  const { data: logs = [], isLoading } = trpc.activityLogs.list.useQuery();

  // Convert database logs to frontend format
  const formattedLogs = useMemo(() => {
    return (logs || []).map(log => ({
      ...log,
      createdAt: new Date(log.createdAt),
    }));
  }, [logs]);

  /**
   * Get logs by type
   */
  const getLogsByType = (type: 'transaction' | 'installment' | 'saving' | 'budget' | 'backup') => {
    return formattedLogs.filter((log) => log.type === type);
  };

  /**
   * Get logs by action
   */
  const getLogsByAction = (action: 'create' | 'update' | 'delete' | 'restore') => {
    return formattedLogs.filter((log) => log.action === action);
  };

  /**
   * Get logs by date range
   */
  const getLogsByDateRange = (startDate: Date, endDate: Date) => {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    return formattedLogs.filter((log) => {
      const logTime = log.createdAt.getTime();
      return logTime >= startTime && logTime <= endTime;
    });
  };

  /**
   * Get recent logs
   */
  const getRecentLogs = (limit: number = 50) => {
    return formattedLogs.slice(0, limit);
  };

  /**
   * Export logs as JSON
   */
  const exportLogs = () => {
    const dataStr = JSON.stringify(formattedLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    logs: formattedLogs,
    isLoaded: !isLoading,
    getLogsByType,
    getLogsByAction,
    getLogsByDateRange,
    getRecentLogs,
    exportLogs,
  };
}
