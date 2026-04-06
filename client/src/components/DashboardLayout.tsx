import { ReactNode } from 'react';
import { BarChart3, Settings, Home, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { Link } from 'wouter';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage?: 'dashboard' | 'transactions' | 'analytics' | 'installments' | 'savings' | 'settings';
}

export default function DashboardLayout({ children, currentPage = 'dashboard' }: DashboardLayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
    { id: 'transactions', label: 'Transaksi', icon: TrendingUp, href: '/transactions' },
    { id: 'analytics', label: 'Analitik', icon: BarChart3, href: '/analytics' },
    { id: 'installments', label: 'Cicilan', icon: CreditCard, href: '/installments' },
    { id: 'savings', label: 'Tabungan', icon: TrendingDown, href: '/savings' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Finance</h1>
          </div>
        </div>

        <nav className="px-4 py-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
