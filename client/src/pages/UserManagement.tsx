import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAccessControl, AccessLevel } from '@/contexts/AccessControlContext';
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
import { Users, Plus, Trash2, Edit2, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function UserManagement() {
  const { users, createUser, deleteUser, updateUserAccessLevel, hasPermission, currentUser } = useAccessControl();
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState<AccessLevel>('user');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAccessLevel, setEditAccessLevel] = useState<AccessLevel>('user');
  const [isOpen, setIsOpen] = useState(false);

  if (!hasPermission('canManageUsers')) {
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

  const handleCreateUser = () => {
    if (!newUsername.trim() || !newEmail.trim()) {
      toast.error('Username dan email harus diisi');
      return;
    }

    if (users.some(u => u.username === newUsername)) {
      toast.error('Username sudah digunakan');
      return;
    }

    createUser(newUsername, newEmail, newAccessLevel);
    toast.success('User berhasil dibuat');
    setNewUsername('');
    setNewEmail('');
    setNewAccessLevel('user');
    setIsOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('Anda tidak bisa menghapus akun sendiri');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      deleteUser(userId);
      toast.success('User berhasil dihapus');
    }
  };

  const handleUpdateAccessLevel = (userId: string, newLevel: AccessLevel) => {
    if (userId === currentUser?.id && newLevel !== currentUser.accessLevel) {
      toast.error('Anda tidak bisa mengubah level akses sendiri');
      return;
    }

    updateUserAccessLevel(userId, newLevel);
    toast.success('Level akses berhasil diperbarui');
    setEditingUserId(null);
  };

  const getAccessLevelColor = (level: AccessLevel) => {
    switch (level) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'user':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelLabel = (level: AccessLevel) => {
    switch (level) {
      case 'admin':
        return 'Admin';
      case 'user':
        return 'User';
      case 'viewer':
        return 'Viewer';
      default:
        return level;
    }
  };

  return (
    <DashboardLayout currentPage="settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Users className="w-8 h-8" />
              Manajemen User
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Kelola pengguna dan level akses mereka</p>
          </div>

          {/* Create User Button */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat User Baru</DialogTitle>
                <DialogDescription>Tambahkan user baru dengan level akses yang sesuai</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Username</label>
                  <Input
                    placeholder="Masukkan username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="Masukkan email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Level Akses</label>
                  <Select value={newAccessLevel} onValueChange={(value: any) => setNewAccessLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCreateUser} className="w-full">
                  Buat User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total User</div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{users.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Admin</div>
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{users.filter(u => u.accessLevel === 'admin').length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">User</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{users.filter(u => u.accessLevel === 'user').length}</div>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground">Username</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground">Level Akses</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground">Dibuat</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-xs sm:text-sm font-medium text-foreground">
                      {user.username}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">Anda</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      {editingUserId === user.id ? (
                        <Select
                          value={editAccessLevel}
                          onValueChange={(value: any) => setEditAccessLevel(value)}
                        >
                          <SelectTrigger className="w-32 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getAccessLevelColor(user.accessLevel)}>
                          {getAccessLevelLabel(user.accessLevel)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {editingUserId === user.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUpdateAccessLevel(user.id, editAccessLevel)}
                              className="text-xs"
                            >
                              Simpan
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUserId(null)}
                              className="text-xs"
                            >
                              Batal
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingUserId(user.id);
                                setEditAccessLevel(user.accessLevel);
                              }}
                              className="text-xs"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-xs text-destructive hover:text-destructive"
                              disabled={user.id === currentUser?.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Access Levels Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Tingkatan Akses</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-foreground mb-1">Admin</h4>
              <p className="text-sm text-muted-foreground">Akses penuh ke semua fitur termasuk manajemen user, ekspor/impor data, dan hapus semua data.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-foreground mb-1">User</h4>
              <p className="text-sm text-muted-foreground">Dapat membuat dan mengedit transaksi, mengelola cicilan dan tabungan, serta melihat analitik. Tidak dapat menghapus atau mengimpor data.</p>
            </div>
            <div className="border-l-4 border-gray-500 pl-4">
              <h4 className="font-semibold text-foreground mb-1">Viewer</h4>
              <p className="text-sm text-muted-foreground">Hanya dapat melihat dashboard dan analitik. Tidak dapat membuat, mengedit, atau menghapus data apapun.</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
