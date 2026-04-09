import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Users, Activity, BarChart3, ChevronRight } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';

export default function AdminDashboard() {
  const { isAdmin, loading } = useAdminAccess();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  // Check admin access
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You do not have permission to access the admin dashboard. Only administrators can view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch admin data
  const { data: stats } = trpc.admin.getAdminStats.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery({
    limit: 10,
    offset: currentPage * 10,
  });
  const { data: activityLogs, isLoading: logsLoading } = trpc.admin.getAllActivityLogs.useQuery({
    limit: 50,
    offset: 0,
  });
  const { data: selectedUserDetails } = trpc.admin.getUserDetails.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();

  const handleRoleChange = async (userId: number, newRole: 'user' | 'admin') => {
    try {
      await updateRoleMutation.mutateAsync({ userId, newRole });
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const filteredLogs = activityLogs?.filter((log) => {
    if (activityFilter === 'all') return true;
    return log.type === activityFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and monitor system activity</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{stats.totalAdmins} administrators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Total across all users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivityCount}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBudgets}</div>
              <p className="text-xs text-muted-foreground">Active budgets</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all system users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />

              <div className="space-y-2">
                {usersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                ) : users && users.length > 0 ? (
                  users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{u.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div>{u.transactionCount} transactions</div>
                          <div className="text-muted-foreground">{u.savingCount} savings</div>
                        </div>

                        <Select
                          value={u.role}
                          onValueChange={(value) => handleRoleChange(u.id, value as 'user' | 'admin')}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>

                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No users found</p>
                )}
              </div>

              {/* Pagination */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage + 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!users || users.length < 10}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Details */}
          {selectedUserDetails && (
            <Card>
              <CardHeader>
                <CardTitle>User Details: {selectedUserDetails.user.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">{selectedUserDetails.user.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Role</div>
                    <div className="text-sm text-muted-foreground">{selectedUserDetails.user.role}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Created</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedUserDetails.user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Last Sign In</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedUserDetails.user.lastSignedIn).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">User Data Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Transactions: {selectedUserDetails.transactions.length}</div>
                    <div>Installments: {selectedUserDetails.installments.length}</div>
                    <div>Savings: {selectedUserDetails.savings.length}</div>
                    <div>Budgets: {selectedUserDetails.budgets.length}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Recent Activity</div>
                  <div className="space-y-2">
                    {selectedUserDetails.activityLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="text-xs text-muted-foreground">
                        <div>{log.description}</div>
                        <div className="text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Log</CardTitle>
              <CardDescription>Monitor all user activities across the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="transaction">Transactions</SelectItem>
                  <SelectItem value="installment">Installments</SelectItem>
                  <SelectItem value="saving">Savings</SelectItem>
                  <SelectItem value="budget">Budgets</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading activity logs...</p>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{log.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            User: {log.userName || log.userEmail || `ID: ${log.userId}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {log.type}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No activity logs found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
