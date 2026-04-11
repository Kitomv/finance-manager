import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Plus, Trash2, Edit2, Mail, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';

export default function UserManagement() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch users from admin API
  const { data: users = [], isLoading, refetch } = trpc.admin.getAllUsers.useQuery(
    { limit: 100, offset: 0 },
    {
      enabled: user?.role === 'admin',
    }
  );

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout currentPage="settings">
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center max-w-md">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Akses Ditolak</h2>
            <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'user':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'user':
        return 'User';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout currentPage="settings">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Memuat data user...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manajemen User</h1>
            <p className="text-muted-foreground mt-2">Kelola user dan permission sistem</p>
          </div>
        </div>

        {/* User List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Username</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Dibuat</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{u.name || u.username || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.email || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge className={getRoleColor(u.role || 'user')}>
                        {getRoleLabel(u.role || 'user')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {u.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
                                toast.info('Fitur delete user akan diimplementasikan via tRPC');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {users.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Tidak ada user yang ditemukan</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
