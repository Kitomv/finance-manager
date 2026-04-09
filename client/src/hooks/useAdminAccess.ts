import { useAuth } from '@/_core/hooks/useAuth';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook untuk verify admin access
 * Redirect ke home jika user bukan admin
 */
export function useAdminAccess() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  return {
    isAdmin: user?.role === 'admin',
    loading,
    user,
  };
}
