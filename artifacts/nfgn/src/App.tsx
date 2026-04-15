import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Public Pages
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/public/Home";
import { Shop } from "@/pages/public/Shop";
import { Join } from "@/pages/public/Join";
import { BookAPro } from "@/pages/public/BookAPro";

// Auth Pages
import { Login } from "@/pages/auth/Login";

// Dashboard Pages
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { OrdersPage } from "@/pages/dashboard/Orders";
import { WalletPage } from "@/pages/dashboard/Wallet";
import { CommissionsPage } from "@/pages/dashboard/Commissions";
import { GenealogyPage } from "@/pages/dashboard/Genealogy";
import { MessagesPage } from "@/pages/dashboard/Messages";

// Admin Pages
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { UsersPage } from "@/pages/admin/Users";
import { AdminOrdersPage } from "@/pages/admin/Orders";
import { AdminCommissionsPage } from "@/pages/admin/Commissions";
import { AdminPayoutsPage } from "@/pages/admin/Payouts";

// Stubs for pages still being built
const Stub = ({ name }: { name: string }) => (
  <div className="p-8 border rounded-lg m-4 text-center bg-card">
    <h2 className="text-2xl font-bold font-serif mb-2">{name}</h2>
    <p className="text-muted-foreground">This page is coming soon.</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function RequireAuth({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/register">
        <PublicLayout><Join /></PublicLayout>
      </Route>

      {/* Public routes */}
      <Route path="/">
        <PublicLayout><Home /></PublicLayout>
      </Route>
      <Route path="/shop">
        <PublicLayout><Shop /></PublicLayout>
      </Route>
      <Route path="/join">
        <PublicLayout><Join /></PublicLayout>
      </Route>
      <Route path="/book">
        <PublicLayout><BookAPro /></PublicLayout>
      </Route>
      <Route path="/about">
        <PublicLayout><Stub name="About NFGN" /></PublicLayout>
      </Route>
      <Route path="/contact">
        <PublicLayout><Stub name="Contact Us" /></PublicLayout>
      </Route>
      <Route path="/rep/:username">
        <PublicLayout><Stub name="Affiliate Storefront" /></PublicLayout>
      </Route>

      {/* Dashboard routes */}
      <Route path="/dashboard">
        <RequireAuth>
          <DashboardLayout><Dashboard /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/orders">
        <RequireAuth>
          <DashboardLayout><OrdersPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/wallet">
        <RequireAuth>
          <DashboardLayout><WalletPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/commissions">
        <RequireAuth>
          <DashboardLayout><CommissionsPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/genealogy">
        <RequireAuth>
          <DashboardLayout><GenealogyPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/messages">
        <RequireAuth>
          <DashboardLayout><MessagesPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/bookings">
        <RequireAuth>
          <DashboardLayout><Stub name="My Bookings" /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/payouts">
        <RequireAuth>
          <DashboardLayout><Stub name="Payout Requests" /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/profile">
        <RequireAuth>
          <DashboardLayout><Stub name="My Profile" /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/reports">
        <RequireAuth>
          <DashboardLayout><Stub name="Reports" /></DashboardLayout>
        </RequireAuth>
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminDashboard /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/users">
        <RequireAuth requireAdmin>
          <AdminLayout><UsersPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/orders">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminOrdersPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/commissions">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminCommissionsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/payouts">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminPayoutsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/products">
        <RequireAuth requireAdmin>
          <AdminLayout><Stub name="Manage Products" /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/categories">
        <RequireAuth requireAdmin>
          <AdminLayout><Stub name="Manage Categories" /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/bookings">
        <RequireAuth requireAdmin>
          <AdminLayout><Stub name="Manage Bookings" /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/professionals">
        <RequireAuth requireAdmin>
          <AdminLayout><Stub name="Manage Professionals" /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/messages">
        <RequireAuth requireAdmin>
          <AdminLayout><Stub name="Admin Messages" /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/promos">
        <RequireAuth requireAdmin>
          <AdminLayout><Stub name="Promo Codes" /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/settings">
        <RequireAuth requireAdmin>
          <AdminLayout><Stub name="System Settings" /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/reports">
        <RequireAuth requireAdmin>
          <AdminLayout><Stub name="Admin Reports" /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/genealogy">
        <RequireAuth requireAdmin>
          <AdminLayout><Stub name="Global Genealogy" /></AdminLayout>
        </RequireAuth>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
