import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Home, Users, FileCheck, CreditCard, BarChart3, Settings, 
  ArrowRight, User, Bell, Menu, X, Building2, AlertTriangle,
  Handshake, MapPin, CheckCircle, Crown, Lock, Eye, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
  onBack: () => void;
}

const navGroups = [
  {
    title: "الرئيسية",
    items: [
      { path: "/admin", icon: Home, label: "لوحة التحكم" },
    ]
  },
  {
    title: "إدارة المستخدمين",
    items: [
      { path: "/admin/users", icon: Users, label: "العملاء" },
      { path: "/admin/staff", icon: Shield, label: "الموظفين" },
      { path: "/admin/roles", icon: Crown, label: "الأدوار والصلاحيات" },
    ]
  },
  {
    title: "العمليات",
    items: [
      { path: "/admin/invoices", icon: FileCheck, label: "الفواتير" },
      { path: "/admin/approvals", icon: CheckCircle, label: "الموافقات" },
      { path: "/admin/risk", icon: AlertTriangle, label: "المخاطر" },
    ]
  },
  {
    title: "الشركاء",
    items: [
      { path: "/admin/merchants", icon: Handshake, label: "التجار" },
      { path: "/admin/branches", icon: MapPin, label: "الفروع" },
      { path: "/admin/pos", icon: CreditCard, label: "نقاط البيع" },
    ]
  },
  {
    title: "الرقابة والامتثال",
    items: [
      { path: "/admin/monitoring", icon: Activity, label: "رقابة ساما" },
      { path: "/admin/sandbox", icon: Eye, label: "البيئة التجريبية" },
    ]
  },
  {
    title: "التقارير",
    items: [
      { path: "/admin/reports", icon: BarChart3, label: "التقارير" },
      { path: "/admin/settings", icon: Settings, label: "الإعدادات" },
    ]
  }
];

export default function AdminLayout({ children, onBack }: AdminLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              data-testid="btn-back-to-selector"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex"
              data-testid="btn-toggle-sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none">دربي - الإدارة</h1>
                <p className="text-xs text-muted-foreground">لوحة الموظفين</p>
              </div>
            </div>

            <Badge variant="secondary" className="hidden sm:flex gap-1">
              <Lock className="h-3 w-3" />
              admin.darbi.internal
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" data-testid="btn-notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
              <User className="h-4 w-4" />
              <span className="text-sm">أحمد محمد</span>
              <Badge variant="outline" className="text-xs">مدير النظام</Badge>
            </div>
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="btn-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={cn(
          "hidden md:block border-l bg-muted/30 transition-all duration-300 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          <nav className="p-4 space-y-6">
            {navGroups.map((group) => (
              <div key={group.title}>
                {sidebarOpen && (
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    return (
                      <Link key={item.path} href={item.path}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3",
                            !sidebarOpen && "justify-center px-2"
                          )}
                          data-testid={`nav-${item.path.split('/').pop()}`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {sidebarOpen && <span>{item.label}</span>}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <aside className="fixed right-0 top-16 bottom-0 w-72 bg-background border-l overflow-y-auto">
              <nav className="p-4 space-y-6">
                {navGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.path;
                        return (
                          <Link key={item.path} href={item.path}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className="w-full justify-start gap-3"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
