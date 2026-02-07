import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { detectAppFromHost, isSubdomainMode } from "@/lib/app-detector";

import AppSelector from "@/apps/AppSelector";
import CustomerLayout from "@/apps/customer/CustomerLayout";
import MerchantLayout from "@/apps/merchant/MerchantLayout";
import AdminLayout from "@/apps/admin/AdminLayout";
import MerchantLanding from "@/apps/merchant/MerchantLanding";

import Home from "@/pages/home";
import Invoices from "@/pages/invoices";
import Journey from "@/pages/journey";
import Snafi from "@/pages/snafi";
import SettingsPage from "@/pages/settings";
import Design from "@/pages/design";
import FuelRequest from "@/pages/fuel-request";
import CashierPOS from "@/pages/cashier-pos";
import MerchantPortal from "@/pages/merchant-portal";
import AdminDashboard from "@/pages/admin-dashboard";
import RolesDemo from "@/pages/roles-demo";
import SamaMonitoring from "@/pages/sama-monitoring";
import NotFound from "@/pages/not-found";

function CustomerRouterSubdomain() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/fuel-request" component={FuelRequest} />
      <Route path="/journey" component={Journey} />
      <Route path="/snafi" component={Snafi} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/design" component={Design} />
      <Route component={Home} />
    </Switch>
  );
}

function MerchantRouterSubdomain() {
  return (
    <Switch>
      <Route path="/" component={MerchantLanding} />
      <Route path="/dashboard" component={MerchantPortal} />
      <Route path="/transactions" component={MerchantPortal} />
      <Route path="/reports" component={MerchantPortal} />
      <Route path="/api" component={MerchantPortal} />
      <Route path="/webhooks" component={MerchantPortal} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={MerchantLanding} />
    </Switch>
  );
}

function AdminRouterSubdomain() {
  return (
    <Switch>
      <Route path="/" component={AdminDashboard} />
      <Route path="/users" component={AdminDashboard} />
      <Route path="/staff" component={AdminDashboard} />
      <Route path="/roles" component={RolesDemo} />
      <Route path="/invoices" component={AdminDashboard} />
      <Route path="/approvals" component={AdminDashboard} />
      <Route path="/risk" component={AdminDashboard} />
      <Route path="/merchants" component={AdminDashboard} />
      <Route path="/branches" component={AdminDashboard} />
      <Route path="/pos" component={CashierPOS} />
      <Route path="/monitoring" component={SamaMonitoring} />
      <Route path="/sandbox" component={SamaMonitoring} />
      <Route path="/reports" component={AdminDashboard} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={AdminDashboard} />
    </Switch>
  );
}

function CustomerRouter() {
  return (
    <Switch>
      <Route path="/customer" component={Home} />
      <Route path="/customer/invoices" component={Invoices} />
      <Route path="/customer/fuel-request" component={FuelRequest} />
      <Route path="/customer/journey" component={Journey} />
      <Route path="/customer/snafi" component={Snafi} />
      <Route path="/customer/settings" component={SettingsPage} />
      <Route path="/customer/design" component={Design} />
      <Route component={Home} />
    </Switch>
  );
}

function MerchantRouter() {
  return (
    <Switch>
      <Route path="/merchant" component={MerchantPortal} />
      <Route path="/merchant/transactions" component={MerchantPortal} />
      <Route path="/merchant/reports" component={MerchantPortal} />
      <Route path="/merchant/api" component={MerchantPortal} />
      <Route path="/merchant/webhooks" component={MerchantPortal} />
      <Route path="/merchant/settings" component={SettingsPage} />
      <Route component={MerchantPortal} />
    </Switch>
  );
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminDashboard} />
      <Route path="/admin/staff" component={AdminDashboard} />
      <Route path="/admin/roles" component={RolesDemo} />
      <Route path="/admin/invoices" component={AdminDashboard} />
      <Route path="/admin/approvals" component={AdminDashboard} />
      <Route path="/admin/risk" component={AdminDashboard} />
      <Route path="/admin/merchants" component={AdminDashboard} />
      <Route path="/admin/branches" component={AdminDashboard} />
      <Route path="/admin/pos" component={CashierPOS} />
      <Route path="/admin/monitoring" component={SamaMonitoring} />
      <Route path="/admin/sandbox" component={SamaMonitoring} />
      <Route path="/admin/reports" component={AdminDashboard} />
      <Route path="/admin/settings" component={SettingsPage} />
      <Route component={AdminDashboard} />
    </Switch>
  );
}

function CustomerApp() {
  const [, setLocation] = useLocation();
  const handleBack = () => setLocation("/");
  
  return (
    <CustomerLayout onBack={handleBack}>
      <CustomerRouter />
    </CustomerLayout>
  );
}

function CustomerAppSubdomain() {
  const handleBack = () => {
    window.location.href = "https://darbby.co";
  };
  
  return (
    <CustomerLayout onBack={handleBack}>
      <CustomerRouterSubdomain />
    </CustomerLayout>
  );
}

function MerchantApp() {
  const [, setLocation] = useLocation();
  const handleBack = () => setLocation("/");
  
  return (
    <MerchantLayout onBack={handleBack}>
      <MerchantRouter />
    </MerchantLayout>
  );
}

function MerchantAppSubdomain() {
  return <MerchantRouterSubdomain />;
}

function AdminApp() {
  const [, setLocation] = useLocation();
  const handleBack = () => setLocation("/");
  
  return (
    <AdminLayout onBack={handleBack}>
      <AdminRouter />
    </AdminLayout>
  );
}

function AdminAppSubdomain() {
  const handleBack = () => {
    window.location.href = "https://darbby.co";
  };
  
  return (
    <AdminLayout onBack={handleBack}>
      <AdminRouterSubdomain />
    </AdminLayout>
  );
}

function SelectorPage() {
  const [, setLocation] = useLocation();
  
  const handleSelectApp = (app: "customer" | "merchant" | "admin") => {
    setLocation(`/${app}`);
  };
  
  return <AppSelector onSelectApp={handleSelectApp} />;
}

function SubdomainApp() {
  const appType = detectAppFromHost();
  
  switch (appType) {
    case "merchant":
      return <MerchantAppSubdomain />;
    case "admin":
      return <AdminAppSubdomain />;
    case "customer":
      return <CustomerAppSubdomain />;
    default:
      return <SelectorPage />;
  }
}

function App() {
  const subdomainMode = isSubdomainMode();
  
  if (subdomainMode) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <SubdomainApp />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Switch>
            <Route path="/" component={SelectorPage} />
            <Route path="/customer" component={CustomerApp} />
            <Route path="/customer/:rest*" component={CustomerApp} />
            <Route path="/merchant" component={MerchantApp} />
            <Route path="/merchant/:rest*" component={MerchantApp} />
            <Route path="/admin" component={AdminApp} />
            <Route path="/admin/:rest*" component={AdminApp} />
            <Route component={SelectorPage} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
