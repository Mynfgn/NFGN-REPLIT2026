import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useGetMe } from "@workspace/api-client-react";
import { useEffect } from "react";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Public Pages
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/public/Home";
import { Shop } from "@/pages/public/Shop";
import { ProductDetail } from "@/pages/public/ProductDetail";
import { Join } from "@/pages/public/Join";
import { ProJoin } from "@/pages/public/ProJoin";
import { BookAPro } from "@/pages/public/BookAPro";
import { About } from "@/pages/public/About";
import { Contact } from "@/pages/public/Contact";

// Auth Pages
import { Login } from "@/pages/auth/Login";

// Dashboard Pages
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { OrdersPage } from "@/pages/dashboard/Orders";
import { WalletPage } from "@/pages/dashboard/Wallet";
import { CommissionsPage } from "@/pages/dashboard/Commissions";
import { GenealogyPage } from "@/pages/dashboard/Genealogy";
import { MessagesPage } from "@/pages/dashboard/Messages";
import { RegistrationPage } from "@/pages/dashboard/Registration";
import { RegisterNewProMemberPage } from "@/pages/dashboard/RegisterNewProMember";
import { MemberOutreachPage } from "@/pages/dashboard/MemberOutreach";
import { VisionGoalsPage } from "@/pages/dashboard/VisionGoals";
import { TransferFundsPage } from "@/pages/dashboard/TransferFunds";
import { PayoutsPage } from "@/pages/dashboard/Payouts";
import { EarningsPage } from "@/pages/dashboard/Earnings";
import { ProfilePage } from "@/pages/dashboard/Profile";
import { ToolsPage } from "@/pages/dashboard/Tools";
import { GetTheAppPage } from "@/pages/dashboard/GetTheApp";
import { MemberReportsPage } from "@/pages/dashboard/Reports";
import { BasicTrainingPage } from "@/pages/dashboard/BasicTraining";
import { MailboxPage } from "@/pages/dashboard/Mailbox";
import { CompPlanPage } from "@/pages/dashboard/CompPlan";

// Admin Pages
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { UsersPage } from "@/pages/admin/Users";
import { AdminOrdersPage } from "@/pages/admin/Orders";
import { AdminCommissionsPage } from "@/pages/admin/Commissions";
import { AdminPayoutsPage } from "@/pages/admin/Payouts";
import { AdminGenealogyPage } from "@/pages/admin/AdminGenealogy";
import { AdminProductsPage } from "@/pages/admin/Products";
import { AdminCategoriesPage } from "@/pages/admin/Categories";
import { AdminBonusesPage } from "@/pages/admin/Bonuses";
import { ProMemberBonusesPage } from "@/pages/dashboard/ProMemberBonuses";
import { AdminBookingsPage } from "@/pages/admin/Bookings";
import { AdminProfessionalsPage } from "@/pages/admin/Professionals";
import { AdminReportsPage } from "@/pages/admin/Reports";
import AdminSettingsPage from "@/pages/admin/AdminSettings";
import { CompensationSettingsPage } from "@/pages/admin/CompensationSettings";
import { ReferralCommissionsPage } from "@/pages/admin/ReferralCommissions";
import { AffiliateStorefront } from "@/pages/public/AffiliateStorefront";
import { BookingsPage } from "@/pages/dashboard/Bookings";
import { BPPDashboardPage } from "@/pages/dashboard/BPP";
import { AdminBPPPage } from "@/pages/admin/BPP";
import { AdminPromoCodesPage } from "@/pages/admin/PromoCodes";
import { AdminMessagesPage } from "@/pages/admin/AdminMessages";
import { OrdersAwaitingApprovalPage } from "@/pages/admin/OrdersAwaitingApproval";
import { OrdersForApprovalPage } from "@/pages/admin/OrdersForApproval";
import { AdminProfilePage } from "@/pages/admin/AdminProfile";

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
  const { data: me } = useGetMe();
  const [location, setLocation] = useLocation();

  const isAdmin = me && ["super_admin", "admin", "store_admin"].includes(me.role);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (requireAdmin && me && !isAdmin) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, requireAdmin, me, isAdmin, setLocation]);

  if (!isAuthenticated) return null;
  if (requireAdmin && !me) return null;
  if (requireAdmin && me && !isAdmin) return null;
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
      <Route path="/join/pro">
        <PublicLayout><ProJoin /></PublicLayout>
      </Route>

      {/* Public routes */}
      <Route path="/">
        <PublicLayout><Home /></PublicLayout>
      </Route>
      <Route path="/shop">
        <PublicLayout><Shop /></PublicLayout>
      </Route>
      <Route path="/product/:slug">
        <PublicLayout><ProductDetail /></PublicLayout>
      </Route>
      <Route path="/join">
        <PublicLayout><Join /></PublicLayout>
      </Route>
      <Route path="/book">
        <PublicLayout><BookAPro /></PublicLayout>
      </Route>
      <Route path="/about">
        <PublicLayout><About /></PublicLayout>
      </Route>
      <Route path="/contact">
        <PublicLayout><Contact /></PublicLayout>
      </Route>
      <Route path="/rep/:username">
        <AffiliateStorefront />
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
      <Route path="/dashboard/registration">
        <RequireAuth>
          <DashboardLayout><RegistrationPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/register-new-pro">
        <RequireAuth>
          <DashboardLayout><RegisterNewProMemberPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/member-outreach">
        <RequireAuth>
          <DashboardLayout><MemberOutreachPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/tools/vision-goals">
        <RequireAuth>
          <DashboardLayout><VisionGoalsPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/tools/get-the-app">
        <RequireAuth>
          <DashboardLayout><GetTheAppPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/transfer">
        <RequireAuth>
          <DashboardLayout><TransferFundsPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/bpp">
        <RequireAuth>
          <DashboardLayout><BPPDashboardPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/pro-member-bonuses">
        <RequireAuth>
          <DashboardLayout><ProMemberBonusesPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/bookings">
        <RequireAuth>
          <DashboardLayout><BookingsPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/payouts">
        <RequireAuth>
          <DashboardLayout><PayoutsPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/earnings">
        <RequireAuth>
          <DashboardLayout><EarningsPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/mailbox">
        <RequireAuth>
          <DashboardLayout><MailboxPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/comp-plan">
        <RequireAuth>
          <DashboardLayout><CompPlanPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/tools/training">
        <RequireAuth>
          <DashboardLayout><BasicTrainingPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/tools">
        <RequireAuth>
          <DashboardLayout><ToolsPage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/profile">
        <RequireAuth>
          <DashboardLayout><ProfilePage /></DashboardLayout>
        </RequireAuth>
      </Route>
      <Route path="/dashboard/reports">
        <RequireAuth>
          <DashboardLayout><MemberReportsPage /></DashboardLayout>
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
      <Route path="/admin/orders/awaiting">
        <RequireAuth requireAdmin>
          <AdminLayout><OrdersAwaitingApprovalPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/orders/approval">
        <RequireAuth requireAdmin>
          <AdminLayout><OrdersForApprovalPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/commissions">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminCommissionsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/referral-commissions">
        <RequireAuth requireAdmin>
          <AdminLayout><ReferralCommissionsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/compensation">
        <RequireAuth requireAdmin>
          <AdminLayout><CompensationSettingsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/payouts">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminPayoutsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/products">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminProductsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/categories">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminCategoriesPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/bpp">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminBPPPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/bonuses">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminBonusesPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/bookings">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminBookingsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/professionals">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminProfessionalsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/messages">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminMessagesPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/promos">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminPromoCodesPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/settings">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminSettingsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/reports">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminReportsPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/genealogy">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminGenealogyPage /></AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/profile">
        <RequireAuth requireAdmin>
          <AdminLayout><AdminProfilePage /></AdminLayout>
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
