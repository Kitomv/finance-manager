import { useState, useEffect } from 'react';

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: 'transaction' | 'installment' | 'saving';
  action: 'create' | 'update' | 'delete';
  description: string;
  details: Record<string, any>;
}

const STORAGE_KEY = 'finance-manager-activity-log';
const MAX_LOGS = 500; // Limit to prevent localStorage from getting too large

export function useActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load logs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLogs(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse activity logs from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save logs to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }
  }, [logs, isLoaded]);

  const addLog = (
    type: 'transaction' | 'installment' | 'saving',
    action: 'create' | 'update' | 'delete',
    description: string,
    details: Record<string, any> = {}
  ) => {
    const newLog: ActivityLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      action,
      description,
      details,
    };

    setLogs((prev) => {
      const updated = [newLog, ...prev];
      // Keep only the most recent MAX_LOGS entries
      return updated.slice(0, MAX_LOGS);
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogsByType = (type: 'transaction' | 'installment' | 'saving') => {
    return logs.filter((log) => log.type === type);
  };

  const getLogsByAction = (action: 'create' | 'update' | 'delete') => {
    return logs.filter((log) => log.action === action);
  };

  const getLogsByDateRange = (startDate: number, endDate: number) => {
    return logs.filter((log) => log.timestamp >= startDate && log.timestamp <= endDate);
  };

  const getRecentLogs = (limit: number = 50) => {
    return logs.slice(0, limit);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    logs,
    isLoaded,
    addLog,
    clearLogs,
    getLogsByType,
    getLogsByAction,
    getLogsByDateRange,
    getRecentLogs,
    exportLogs,
  };
}
