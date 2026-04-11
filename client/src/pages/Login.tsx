import { useState } from 'react';
import { useAccessControl } from '@/contexts/AccessControlContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAccessControl();
  const [, navigate] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (login(username, password)) {
        toast.success('Login berhasil!');
        navigate('/');
      } else {
        toast.error('Username atau password salah');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Finance Manager</h1>
            <p className="text-muted-foreground">Kelola keuangan Anda dengan mudah</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="text-base"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="text-base"
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Sedang login...' : 'Login'}
            </Button>
          </form>


        </Card>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-8">
          Aplikasi manajemen keuangan pribadi yang aman dan mudah digunakan
        </p>
      </div>
    </div>
  );
}
