import { useState } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  onUpdate?: (id: string, data: Partial<Omit<Transaction, 'id' | 'timestamp'>>) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Gaji': 'bg-emerald-100 text-emerald-800',
  'Bonus': 'bg-emerald-100 text-emerald-800',
  'Investasi': 'bg-blue-100 text-blue-800',
  'Bisnis': 'bg-blue-100 text-blue-800',
  'Makanan': 'bg-orange-100 text-orange-800',
  'Transportasi': 'bg-purple-100 text-purple-800',
  'Hiburan': 'bg-pink-100 text-pink-800',
  'Kesehatan': 'bg-red-100 text-red-800',
  'Belanja': 'bg-yellow-100 text-yellow-800',
  'Tagihan': 'bg-gray-100 text-gray-800',
  'Lainnya': 'bg-gray-100 text-gray-800',
};

const CATEGORIES = ['Gaji', 'Bonus', 'Investasi', 'Bisnis', 'Makanan', 'Transportasi', 'Hiburan', 'Kesehatan', 'Belanja', 'Tagihan', 'Lainnya'];

export default function TransactionList({ transactions, onDelete, onEdit, onUpdate }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});

  const handleStartEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditData(transaction);
  };

  const handleSaveEdit = (id: string) => {
    if (onUpdate) {
      onUpdate(id, {
        description: editData.description || '',
        amount: editData.amount || 0,
        category: editData.category || '',
        date: editData.date || '',
      });
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Belum ada transaksi. Mulai dengan menambah transaksi baru!</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary border-b border-border">
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Tanggal</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Deskripsi</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Kategori</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Tipe</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Jumlah</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                {editingId === transaction.id ? (
                  <>
                    {/* Edit Mode - Date */}
                    <td className="px-4 py-3">
                      <Input
                        type="date"
                        value={editData.date || ''}
                        onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </td>

                    {/* Edit Mode - Description */}
                    <td className="px-4 py-3">
                      <Input
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        placeholder="Deskripsi"
                        className="h-8 text-sm"
                      />
                    </td>

                    {/* Edit Mode - Category */}
                    <td className="px-4 py-3">
                      <Select
                        value={editData.category || ''}
                        onValueChange={(value) => setEditData({ ...editData, category: value })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Edit Mode - Type */}
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          editData.type === 'income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }
                      >
                        {editData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                    </td>

                    {/* Edit Mode - Amount */}
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        value={editData.amount || ''}
                        onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) })}
                        placeholder="0"
                        className="h-8 text-sm text-right"
                      />
                    </td>

                    {/* Edit Mode - Actions */}
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEdit(transaction.id)}
                        className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100"
                        title="Simpan"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </>
                ) : (
                  <>
                    {/* View Mode - Date */}
                    <td className="px-4 py-3 font-medium text-sm">
                      {new Date(transaction.date).toLocaleDateString('id-ID')}
                    </td>

                    {/* View Mode - Description */}
                    <td className="px-4 py-3 text-sm">{transaction.description}</td>

                    {/* View Mode - Category */}
                    <td className="px-4 py-3">
                      <Badge className={CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS['Lainnya']}>
                        {transaction.category}
                      </Badge>
                    </td>

                    {/* View Mode - Type */}
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          transaction.type === 'income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }
                      >
                        {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                    </td>

                    {/* View Mode - Amount */}
                    <td className="px-4 py-3 text-right font-semibold text-sm">
                      <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-amber-600'}>
                        {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* View Mode - Actions */}
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(transaction)}
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(transaction.id)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
