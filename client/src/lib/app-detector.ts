export type AppType = "customer" | "merchant" | "admin" | "selector";

export function detectAppFromHost(): AppType {
  const host = window.location.hostname;
  
  // Check subdomain
  if (host.startsWith("partners.") || host.startsWith("business.") || host.startsWith("merchant.")) {
    return "merchant";
  }
  
  if (host.startsWith("admin.") || host.startsWith("dashboard.")) {
    return "admin";
  }
  
  // For development/localhost, check URL path
  const path = window.location.pathname;
  if (path.startsWith("/customer")) return "customer";
  if (path.startsWith("/merchant")) return "merchant";
  if (path.startsWith("/admin")) return "admin";
  
  // Default: show selector on main domain
  return "selector";
}

export function isSubdomainMode(): boolean {
  const host = window.location.hostname;
  return host.startsWith("partners.") || 
         host.startsWith("business.") || 
         host.startsWith("merchant.") ||
         host.startsWith("admin.") || 
         host.startsWith("dashboard.");
}

export function getAppConfig() {
  const appType = detectAppFromHost();
  
  const configs = {
    customer: {
      appType: "customer" as const,
      appName: "تطبيق العملاء",
      appNameEn: "Customer App",
      domain: "darbby.co",
      color: "from-orange-500 to-amber-600"
    },
    merchant: {
      appType: "merchant" as const,
      appName: "بوابة التجار",
      appNameEn: "Merchant Portal",
      domain: "partners.darbby.co",
      color: "from-blue-500 to-indigo-600"
    },
    admin: {
      appType: "admin" as const,
      appName: "لوحة الموظفين",
      appNameEn: "Admin Dashboard",
      domain: "admin.darbby.co",
      color: "from-purple-500 to-violet-600"
    },
    selector: {
      appType: "selector" as const,
      appName: "منصة دربي",
      appNameEn: "Darby Platform",
      domain: "darbby.co",
      color: "from-orange-500 to-amber-600"
    }
  };
  
  return configs[appType];
}
