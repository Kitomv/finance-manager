import { Transaction } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
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

export default function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Belum ada transaksi. Mulai dengan menambah transaksi baru!</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary">
            <TableHead>Tanggal</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} className="hover:bg-secondary/50">
              <TableCell className="font-medium">
                {new Date(transaction.date).toLocaleDateString('id-ID')}
              </TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>
                <Badge className={CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS['Lainnya']}>
                  {transaction.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={transaction.type === 'income' ? 'default' : 'secondary'}
                  className={
                    transaction.type === 'income'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }
                >
                  {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-amber-600'}>
                  {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                </span>
              </TableCell>
              <TableCell className="text-right space-x-2">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(transaction)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(transaction.id)}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
