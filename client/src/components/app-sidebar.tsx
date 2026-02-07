import { Link, useLocation } from "wouter";
import { Fuel, Receipt, Map, Cpu, Home, Settings, FileCode, Users, Store, Send, Building2, Shield, Crown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "الرئيسية",
    url: "/",
    icon: Home,
  },
  {
    title: "طلب وقود",
    url: "/fuel-request",
    icon: Send,
  },
  {
    title: "تقسيط الفواتير",
    url: "/invoices",
    icon: Receipt,
  },
  {
    title: "صمم رحلتك",
    url: "/journey",
    icon: Map,
  },
  {
    title: "محرك سنافي",
    url: "/snafi",
    icon: Cpu,
  },
  {
    title: "نقطة البيع",
    url: "/cashier",
    icon: Store,
  },
];

const settingsItems = [
  {
    title: "لوحة التحكم",
    url: "/admin",
    icon: Shield,
  },
  {
    title: "الهيكل التنظيمي",
    url: "/roles",
    icon: Crown,
  },
  {
    title: "بوابة التجار",
    url: "/merchant",
    icon: Building2,
  },
  {
    title: "الإعدادات",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "مخططات التصميم",
    url: "/design",
    icon: FileCode,
  },
  {
    title: "للمستثمرين",
    url: "/investors",
    icon: Users,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Fuel className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold text-sidebar-foreground">
              دربي
            </span>
            <span className="text-xs text-muted-foreground">
              ادفع لاحقاً
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>الخدمات</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} data-testid={`link-${item.url.replace("/", "") || "home"}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>النظام</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} data-testid={`link-${item.url.replace("/", "")}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
        <div className="text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
          نظام تقسيط الوقود المتكامل
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
