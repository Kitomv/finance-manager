import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotification } from '@/contexts/NotificationContext';

export default function NotificationDemo() {
  const { addNotification } = useNotification();

  const showSuccessNotification = () => {
    addNotification({
      type: 'success',
      title: 'Sukses!',
      message: 'Transaksi berhasil ditambahkan ke aplikasi Anda.',
      duration: 5000,
    });
  };

  const showErrorNotification = () => {
    addNotification({
      type: 'error',
      title: 'Terjadi Kesalahan',
      message: 'Gagal menyimpan data. Silakan coba lagi.',
      duration: 5000,
    });
  };

  const showWarningNotification = () => {
    addNotification({
      type: 'warning',
      title: 'Peringatan',
      message: 'Cicilan Anda akan jatuh tempo dalam 3 hari.',
      duration: 5000,
    });
  };

  const showInfoNotification = () => {
    addNotification({
      type: 'info',
      title: 'Informasi',
      message: 'Target tabungan Anda sudah mencapai 80% dari target.',
      duration: 5000,
    });
  };

  const showPersistentNotification = () => {
    addNotification({
      type: 'warning',
      title: 'Notifikasi Penting',
      message: 'Notifikasi ini akan tetap ditampilkan sampai Anda menutupnya.',
      duration: 0, // Persistent
    });
  };

  const showNotificationWithAction = () => {
    addNotification({
      type: 'info',
      title: 'Cicilan Baru',
      message: 'Anda memiliki cicilan baru yang perlu dikonfirmasi.',
      duration: 0,
      action: {
        label: 'Lihat Cicilan',
        onClick: () => {
          window.location.href = '/installments';
        },
      },
    });
  };

  return (
    <DashboardLayout currentPage="activity-log">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Demo Notifikasi Custom</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Coba berbagai jenis notifikasi yang tersedia</p>
        </div>

        {/* Notification Types */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-foreground mb-4">Jenis Notifikasi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Button
              onClick={showSuccessNotification}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Success Notification
            </Button>
            <Button
              onClick={showErrorNotification}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Error Notification
            </Button>
            <Button
              onClick={showWarningNotification}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Warning Notification
            </Button>
            <Button
              onClick={showInfoNotification}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Info Notification
            </Button>
          </div>
        </Card>

        {/* Advanced Features */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-foreground mb-4">Fitur Lanjutan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Button
              onClick={showPersistentNotification}
              variant="outline"
            >
              Persistent Notification
            </Button>
            <Button
              onClick={showNotificationWithAction}
              variant="outline"
            >
              Notification with Action
            </Button>
          </div>
        </Card>

        {/* Documentation */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-foreground mb-4">Cara Menggunakan</h2>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">1. Import Hook</h3>
              <pre className="bg-secondary p-3 rounded-lg overflow-x-auto">
                <code>{`import { useNotification } from '@/contexts/NotificationContext';`}</code>
              </pre>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">2. Gunakan Hook</h3>
              <pre className="bg-secondary p-3 rounded-lg overflow-x-auto">
                <code>{`const { addNotification } = useNotification();`}</code>
              </pre>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">3. Tampilkan Notifikasi</h3>
              <pre className="bg-secondary p-3 rounded-lg overflow-x-auto text-xs">
                <code>{`addNotification({
  type: 'success',
  title: 'Sukses!',
  message: 'Data berhasil disimpan.',
  duration: 5000, // optional, default 5000ms
  action: { // optional
    label: 'Undo',
    onClick: () => { /* handle action */ }
  }
});`}</code>
              </pre>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Tipe Notifikasi</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>success</strong> - Untuk aksi yang berhasil</li>
                <li><strong>error</strong> - Untuk kesalahan atau kegagalan</li>
                <li><strong>warning</strong> - Untuk peringatan atau alert</li>
                <li><strong>info</strong> - Untuk informasi umum</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
