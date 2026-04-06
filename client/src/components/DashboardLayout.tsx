import { ReactNode, useState } from 'react';
import { BarChart3, Settings, Home, TrendingUp, TrendingDown, CreditCard, Menu, X } from 'lucide-react';
import { useLocation } from 'wouter';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage?: 'dashboard' | 'transactions' | 'analytics' | 'installments' | 'savings' | 'settings';
}

export default function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Auto-detect current page from URL if not provided
  const getActivePageFromUrl = () => {
    if (location === '/') return 'dashboard';
    if (location === '/transactions') return 'transactions';
    if (location === '/analytics') return 'analytics';
    if (location === '/installments') return 'installments';
    if (location === '/savings') return 'savings';
    if (location === '/settings') return 'settings';
    return 'dashboard';
  };
  
  const activePage = currentPage || getActivePageFromUrl();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
    { id: 'transactions', label: 'Transaksi', icon: TrendingUp, href: '/transactions' },
    { id: 'analytics', label: 'Analitik', icon: BarChart3, href: '/analytics' },
    { id: 'installments', label: 'Cicilan', icon: CreditCard, href: '/installments' },
    { id: 'savings', label: 'Tabungan', icon: TrendingDown, href: '/savings' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-sidebar border-r border-sidebar-border shadow-sm flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Finance</h1>
          </div>
        </div>

        <nav className="px-4 py-8 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border shadow-lg md:hidden z-50 transform transition-transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Finance</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-sidebar-foreground hover:bg-secondary p-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-sidebar border-b border-sidebar-border p-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-sidebar-foreground hover:bg-secondary p-2 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sidebar-foreground">Finance</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden bg-sidebar border-t border-sidebar-border flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
                className={`flex flex-col items-center justify-center py-3 px-2 flex-1 transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-secondary'
                }`}
                title={item.label}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1 text-center truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
