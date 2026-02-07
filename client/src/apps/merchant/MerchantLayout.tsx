import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Store, Home, FileText, CreditCard, BarChart3, Settings, 
  ArrowRight, User, Bell, Menu, X, Code, Webhook
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface MerchantLayoutProps {
  children: ReactNode;
  onBack: () => void;
}

const navItems = [
  { path: "/merchant", icon: Home, label: "لوحة التحكم", labelEn: "Dashboard" },
  { path: "/merchant/transactions", icon: CreditCard, label: "المعاملات", labelEn: "Transactions" },
  { path: "/merchant/reports", icon: BarChart3, label: "التقارير", labelEn: "Reports" },
  { path: "/merchant/api", icon: Code, label: "API", labelEn: "API Keys" },
  { path: "/merchant/webhooks", icon: Webhook, label: "Webhooks", labelEn: "Webhooks" },
  { path: "/merchant/settings", icon: Settings, label: "الإعدادات", labelEn: "Settings" },
];

export default function MerchantLayout({ children, onBack }: MerchantLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onBack}
                data-testid="btn-back-to-selector"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-none">دربي للأعمال</h1>
                  <p className="text-xs text-muted-foreground">بوابة التجار</p>
                </div>
              </div>

              <Badge variant="outline" className="hidden sm:flex">
                business.darbi.co
              </Badge>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                      data-testid={`nav-${item.path.split('/').pop()}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="btn-notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" data-testid="btn-profile">
                <User className="h-5 w-5" />
              </Button>
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

          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t">
              <div className="grid grid-cols-3 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full flex-col h-auto py-3 gap-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 دربي للأعمال - بوابة التجار</p>
          <p className="text-xs mt-1">business.darbi.co</p>
        </div>
      </footer>
    </div>
  );
}
