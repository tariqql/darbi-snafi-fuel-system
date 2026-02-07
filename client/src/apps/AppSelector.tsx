import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, Store, Shield, Users, Fuel, CreditCard, 
  BarChart3, Settings, ArrowLeft, Lock, Globe
} from "lucide-react";

interface AppSelectorProps {
  onSelectApp: (app: "customer" | "merchant" | "admin") => void;
}

export default function AppSelector({ onSelectApp }: AppSelectorProps) {
  const apps = [
    {
      id: "customer" as const,
      nameAr: "تطبيق العملاء",
      nameEn: "Customer App",
      domain: "darbi.co",
      description: "تطبيق العملاء لطلب تقسيط الوقود وإدارة الفواتير",
      color: "from-orange-500 to-amber-600",
      icon: Smartphone,
      features: ["طلب التقسيط", "إدارة الفواتير", "محرك سنافي", "صمم رحلتك"],
      users: "العملاء الأفراد",
      status: "live"
    },
    {
      id: "merchant" as const,
      nameAr: "بوابة التجار",
      nameEn: "Merchant Portal",
      domain: "business.darbi.co",
      description: "بوابة التجار والشركاء لإدارة المعاملات والتقارير",
      color: "from-blue-500 to-indigo-600",
      icon: Store,
      features: ["إدارة المعاملات", "API التكامل", "التقارير المالية", "إعدادات الحساب"],
      users: "التجار والشركاء",
      status: "live"
    },
    {
      id: "admin" as const,
      nameAr: "لوحة الموظفين",
      nameEn: "Admin Dashboard",
      domain: "admin.darbi.internal",
      description: "لوحة التحكم الإدارية للموظفين وإدارة النظام",
      color: "from-purple-500 to-violet-600",
      icon: Shield,
      features: ["إدارة المستخدمين", "الموافقات", "التقارير", "الإعدادات"],
      users: "الموظفين والمدراء",
      status: "internal"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30" dir="rtl">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Fuel className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2" data-testid="text-main-title">
            منصة دربي
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Darbi BNPL Platform
          </p>
          <p className="text-muted-foreground">
            نظام تقسيط الوقود المتكامل - اختر التطبيق المناسب
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <Card 
                key={app.id}
                className="relative overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => onSelectApp(app.id)}
                data-testid={`card-app-${app.id}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center mb-3`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <Badge 
                      variant={app.status === "internal" ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {app.status === "internal" ? (
                        <><Lock className="h-3 w-3 ml-1" /> داخلي</>
                      ) : (
                        <><Globe className="h-3 w-3 ml-1" /> عام</>
                      )}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{app.nameAr}</CardTitle>
                  <CardDescription className="text-sm">
                    {app.nameEn}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {app.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{app.users}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      <span className="font-mono">{app.domain}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {app.features.map((feature, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  <Button 
                    className={`w-full bg-gradient-to-r ${app.color} hover:opacity-90`}
                    data-testid={`btn-open-${app.id}`}
                  >
                    الدخول للتطبيق
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">3</div>
                  <div className="text-xs text-muted-foreground">تطبيقات</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">27</div>
                  <div className="text-xs text-muted-foreground">دور وظيفي</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">14</div>
                  <div className="text-xs text-muted-foreground">قسم إداري</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">400+</div>
                  <div className="text-xs text-muted-foreground">موديل سيارة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 دربي - جميع الحقوق محفوظة</p>
          <p className="mt-1">Darbi BNPL - Buy Now Pay Later for Fuel</p>
        </div>
      </div>
    </div>
  );
}
