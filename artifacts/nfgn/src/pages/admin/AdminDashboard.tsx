import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingCart, Users, UserCheck } from "lucide-react";

export function AdminDashboard() {
  const { data, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold">Admin Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">System Overview</h1>
          <p className="text-muted-foreground">Key performance metrics and platform health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data?.totalSales.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeMembers || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pro Members</CardTitle>
            <UserCheck className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.proMembers || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="font-serif">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentRegistrations && data.recentRegistrations.length > 0 ? (
              <div className="space-y-4">
                {data.recentRegistrations.map(user => (
                  <div key={user.id} className="flex justify-between items-center border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase font-semibold text-primary">{user.role.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent registrations.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="font-serif">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Pending Payouts</h4>
                  <p className="text-sm text-muted-foreground">Withdrawal requests needing approval</p>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                  {data?.pendingPayouts || 0}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Pending Commissions</h4>
                  <p className="text-sm text-muted-foreground">Commissions waiting for order clearing</p>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                  {data?.pendingCommissions || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
