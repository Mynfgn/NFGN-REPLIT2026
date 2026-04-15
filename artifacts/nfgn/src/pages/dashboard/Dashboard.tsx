import { useGetMemberDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Users, ShoppingBag, ArrowUpRight } from "lucide-react";

export function Dashboard() {
  const { data, isLoading } = useGetMemberDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground">Here's your business at a glance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data?.walletBalance.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data?.totalEarnings.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.teamSize || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{data?.personallyEnrolled || 0} personally enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Retail Customers</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.retailCustomers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active buyers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {data.recentOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${order.total.toFixed(2)}</div>
                      <div className={`text-xs capitalize ${
                        order.status === 'completed' ? 'text-green-600' : 'text-primary'
                      }`}>{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent orders.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentCommissions && data.recentCommissions.length > 0 ? (
              <div className="space-y-4">
                {data.recentCommissions.map(comm => (
                  <div key={comm.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{comm.fromUserName}</div>
                      <div className="text-sm text-muted-foreground">Level {comm.level} • {comm.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+${comm.commissionAmount.toFixed(2)}</div>
                      <div className={`text-xs capitalize ${
                        comm.status === 'approved' ? 'text-green-600' : 'text-yellow-600'
                      }`}>{comm.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent commissions.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
