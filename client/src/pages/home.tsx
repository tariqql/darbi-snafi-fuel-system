import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Receipt, Map, Cpu, TrendingUp, Fuel, CreditCard, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Invoice, JourneyPlan, TankMeasurement } from "@shared/schema";

export default function Home() {
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: journeys = [] } = useQuery<JourneyPlan[]>({
    queryKey: ["/api/journeys"],
  });

  const { data: measurements = [] } = useQuery<TankMeasurement[]>({
    queryKey: ["/api/tank-measurements"],
  });

  const activeInvoices = invoices.filter((inv) => inv.status === "active");
  const totalOwed = activeInvoices.reduce((sum, inv) => sum + (inv.amount - (inv.paidInstallments || 0) * inv.monthlyAmount), 0);
  const latestMeasurement = measurements[0];

  const services = [
    {
      title: "تقسيط الفواتير",
      description: "قسّط فاتورة الوقود على دفعات شهرية مريحة",
      icon: Receipt,
      href: "/invoices",
      color: "bg-primary",
      stats: `${activeInvoices.length} فاتورة نشطة`,
    },
    {
      title: "صمم رحلتك",
      description: "خطط لمسارك واكتشف أفضل المحطات على الطريق",
      icon: Map,
      href: "/journey",
      color: "bg-chart-3",
      stats: `${journeys.length} رحلة محفوظة`,
    },
    {
      title: "محرك سنافي",
      description: "ذكاء اصطناعي لقياس وتوقع استهلاك الوقود",
      icon: Cpu,
      href: "/snafi",
      color: "bg-chart-1",
      stats: latestMeasurement ? `${Math.round(latestMeasurement.fuelPercentage)}% مستوى الخزان` : "لا توجد قراءات",
    },
  ];

  return (
    <div className="min-h-full p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          مرحباً بك في دربي
        </h1>
        <p className="text-muted-foreground">
          نظام تقسيط وقود السيارات المتكامل - دربي وادفع لاحقاً
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستحق</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-owed">
              {totalOwed.toFixed(2)} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              من {activeInvoices.length} فاتورة نشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير النشطة</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-invoices">
              {activeInvoices.length}
            </div>
            <p className="text-xs text-muted-foreground">
              فاتورة قيد السداد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">الرحلات المحفوظة</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-saved-journeys">
              {journeys.length}
            </div>
            <p className="text-xs text-muted-foreground">
              رحلة مخططة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">مستوى الخزان</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tank-level">
              {latestMeasurement ? `${Math.round(latestMeasurement.fuelPercentage)}%` : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestMeasurement ? `${latestMeasurement.estimatedRange?.toFixed(0) || "--"} كم متبقي` : "أضف قراءة جديدة"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">الخدمات المتاحة</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title} className="overflow-hidden hover-elevate transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${service.color}`}>
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription className="text-xs">{service.stats}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{service.description}</p>
                <Button asChild className="w-full gap-2">
                  <Link href={service.href} data-testid={`button-go-to-${service.href.replace("/", "")}`}>
                    انتقل للخدمة
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-gradient-to-l from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
          <div className="space-y-1 text-center md:text-right">
            <h3 className="text-lg font-semibold">هل تحتاج تعبئة وقود؟</h3>
            <p className="text-sm text-muted-foreground">
              دربي وادفع لاحقاً بأقساط شهرية مريحة بدون فوائد
            </p>
          </div>
          <Button size="lg" asChild className="gap-2">
            <Link href="/invoices" data-testid="button-start-installment">
              <Fuel className="h-5 w-5" />
              ابدأ التقسيط الآن
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
