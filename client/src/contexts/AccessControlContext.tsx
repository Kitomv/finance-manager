import React, { createContext, useContext, useState, useEffect } from 'react';

export type AccessLevel = 'admin' | 'user' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  accessLevel: AccessLevel;
  createdAt: string;
}

export interface Permissions {
  canViewDashboard: boolean;
  canCreateTransaction: boolean;
  canEditTransaction: boolean;
  canDeleteTransaction: boolean;
  canViewAnalytics: boolean;
  canManageInstallments: boolean;
  canManageSavings: boolean;
  canViewActivityLog: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canImportData: boolean;
  canClearData: boolean;
}

interface AccessControlContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  createUser: (username: string, email: string, accessLevel: AccessLevel) => void;
  deleteUser: (userId: string) => void;
  updateUserAccessLevel: (userId: string, accessLevel: AccessLevel) => void;
  getPermissions: (accessLevel: AccessLevel) => Permissions;
  hasPermission: (permission: keyof Permissions) => boolean;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

const PERMISSIONS_MAP: Record<AccessLevel, Permissions> = {
  admin: {
    canViewDashboard: true,
    canCreateTransaction: true,
    canEditTransaction: true,
    canDeleteTransaction: true,
    canViewAnalytics: true,
    canManageInstallments: true,
    canManageSavings: true,
    canViewActivityLog: true,
    canManageUsers: true,
    canExportData: true,
    canImportData: true,
    canClearData: true,
  },
  user: {
    canViewDashboard: true,
    canCreateTransaction: true,
    canEditTransaction: true,
    canDeleteTransaction: false,
    canViewAnalytics: true,
    canManageInstallments: true,
    canManageSavings: true,
    canViewActivityLog: true,
    canManageUsers: false,
    canExportData: true,
    canImportData: false,
    canClearData: false,
  },
  viewer: {
    canViewDashboard: true,
    canCreateTransaction: false,
    canEditTransaction: false,
    canDeleteTransaction: false,
    canViewAnalytics: true,
    canManageInstallments: false,
    canManageSavings: false,
    canViewActivityLog: false,
    canManageUsers: false,
    canExportData: false,
    canImportData: false,
    canClearData: false,
  },
};

export function AccessControlProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    const storedCurrentUser = localStorage.getItem('finance-manager-current-user');
    const storedUsers = localStorage.getItem('finance-manager-users');

    if (storedCurrentUser) {
      setCurrentUser(JSON.parse(storedCurrentUser));
    }

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Create default admin user
      const defaultAdmin: User = {
        id: '1',
        username: 'admin',
        email: 'admin@finance.local',
        accessLevel: 'admin',
        createdAt: new Date().toISOString(),
      };
      setUsers([defaultAdmin]);
      localStorage.setItem('finance-manager-users', JSON.stringify([defaultAdmin]));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Simple password check (in production, use proper authentication)
    const user = users.find(u => u.username === username);
    if (user && password === 'password') {
      setCurrentUser(user);
      localStorage.setItem('finance-manager-current-user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('finance-manager-current-user');
  };

  const createUser = (username: string, email: string, accessLevel: AccessLevel) => {
    const newUser: User = {
      id: Date.now().toString(),
      username,
      email,
      accessLevel,
      createdAt: new Date().toISOString(),
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('finance-manager-users', JSON.stringify(updatedUsers));
  };

  const deleteUser = (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('finance-manager-users', JSON.stringify(updatedUsers));
  };

  const updateUserAccessLevel = (userId: string, accessLevel: AccessLevel) => {
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, accessLevel } : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('finance-manager-users', JSON.stringify(updatedUsers));

    // Update current user if it's the same
    if (currentUser?.id === userId) {
      const updatedUser = { ...currentUser, accessLevel };
      setCurrentUser(updatedUser);
      localStorage.setItem('finance-manager-current-user', JSON.stringify(updatedUser));
    }
  };

  const getPermissions = (accessLevel: AccessLevel): Permissions => {
    return PERMISSIONS_MAP[accessLevel];
  };

  const hasPermission = (permission: keyof Permissions): boolean => {
    if (!currentUser) return false;
    const permissions = getPermissions(currentUser.accessLevel);
    return permissions[permission];
  };

  return (
    <AccessControlContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        createUser,
        deleteUser,
        updateUserAccessLevel,
        getPermissions,
        hasPermission,
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControl must be used within AccessControlProvider');
  }
  return context;
}
