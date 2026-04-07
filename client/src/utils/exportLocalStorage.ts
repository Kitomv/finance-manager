/**
 * Export localStorage data to JSON file
 * This utility helps users export their data from localStorage
 * so it can be migrated to the database
 */

export interface LocalStorageData {
  transactions?: any[];
  installments?: any[];
  savings?: any[];
  budgets?: any[];
  exportDate: string;
}

export function exportLocalStorageData(): LocalStorageData {
  const data: LocalStorageData = {
    exportDate: new Date().toISOString(),
  };

  // Export transactions
  const transactions = localStorage.getItem('finance-manager-transactions');
  if (transactions) {
    try {
      data.transactions = JSON.parse(transactions);
    } catch (error) {
      console.error('Failed to parse transactions:', error);
    }
  }

  // Export installments
  const installments = localStorage.getItem('finance-manager-installments');
  if (installments) {
    try {
      data.installments = JSON.parse(installments);
    } catch (error) {
      console.error('Failed to parse installments:', error);
    }
  }

  // Export savings
  const savings = localStorage.getItem('finance-manager-savings');
  if (savings) {
    try {
      data.savings = JSON.parse(savings);
    } catch (error) {
      console.error('Failed to parse savings:', error);
    }
  }

  // Export budgets
  const budgets = localStorage.getItem('finance-manager-budgets');
  if (budgets) {
    try {
      data.budgets = JSON.parse(budgets);
    } catch (error) {
      console.error('Failed to parse budgets:', error);
    }
  }

  return data;
}

export function downloadLocalStorageData(): void {
  const data = exportLocalStorageData();
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `finance-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
