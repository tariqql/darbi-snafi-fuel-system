import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { SandboxConfig, MoneyFlowLog, LimitBreach } from "@shared/schema";
import {
  Activity, Shield, AlertTriangle, TrendingUp, DollarSign,
  Users, Eye, Clock, ArrowDownRight, ArrowUpRight,
  Fuel, Building2, RefreshCw, Play, Ban, CheckCircle2,
  FileText, BarChart3, Loader2, Search, Download
} from "lucide-react";

type MonitoringData = {
  stats: {
    totalTransactions: number;
    totalAmount: number;
    activeUsers: number;
    flaggedTransactions: number;
    limitBreachCount: number;
  };
  config: SandboxConfig | null;
  recentTransactions: MoneyFlowLog[];
  recentBreaches: LimitBreach[];
  environment: string;
};

function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    customer_debit: "خصم من العميل",
    escrow_receipt: "استلام وسيط",
    station_settlement: "تسوية محطة",
    commission_earned: "عمولة دربي",
    limit_breach: "تجاوز حد",
    transaction_blocked: "عملية محظورة",
  };
  return labels[type] || type;
}

function eventCategoryBadge(category: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    payment: "default",
    settlement: "secondary",
    revenue: "outline",
    risk: "destructive",
  };
  const labels: Record<string, string> = {
    payment: "دفع",
    settlement: "تسوية",
    revenue: "إيراد",
    risk: "مخاطر",
  };
  return (
    <Badge variant={variants[category] || "secondary"} data-testid={`badge-category-${category}`}>
      {labels[category] || category}
    </Badge>
  );
}

function breachTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    daily_limit: "الحد اليومي",
    weekly_limit: "الحد الأسبوعي",
    monthly_limit: "الحد الشهري",
    max_single_transaction: "حد العملية الواحدة",
  };
  return labels[type] || type;
}

export default function SamaMonitoring() {
  const { toast } = useToast();
  const [simUserId, setSimUserId] = useState("test-user-001");
  const [simAmount, setSimAmount] = useState("150");
  const [simStationId, setSimStationId] = useState("station-001");

  const { data: monitoringData, isLoading, refetch } = useQuery<{ success: boolean; data: MonitoringData }>({
    queryKey: ["/api/sandbox/monitoring"],
    refetchInterval: 10000,
  });

  const simulateMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number; stationId: string; merchantId: string; fuelType: string; liters: number }) => {
      const response = await apiRequest("POST", "/api/sandbox/simulate-transaction", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "تمت العملية بنجاح",
          description: `تم تنفيذ عملية بمبلغ ${simAmount} ريال`,
        });
      } else {
        toast({
          title: "تم حظر العملية",
          description: data.message || "تجاوز حدود العمليات",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/monitoring"] });
    },
    onError: () => {
      toast({ title: "خطأ في تنفيذ العملية", variant: "destructive" });
    }
  });

  const handleSimulate = () => {
    simulateMutation.mutate({
      userId: simUserId,
      amount: parseFloat(simAmount),
      stationId: simStationId,
      merchantId: "merchant-001",
      fuelType: "gasoline_91",
      liters: parseFloat(simAmount) / 2.18,
    });
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await fetch("/api/generate-pdf");
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Darby_SAMA_Application.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "تم تحميل الملف بنجاح", description: "تم إنشاء ملف PDF لطلب ترخيص ساما" });
    } catch {
      toast({ title: "خطأ في إنشاء الملف", description: "حدث خطأ أثناء إنشاء ملف PDF", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  const monitoring = monitoringData?.data;
  const stats = monitoring?.stats;
  const config = monitoring?.config;

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl" data-testid="sama-monitoring-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">لوحة رقابة ساما - البيئة التجريبية</h1>
          <p className="text-sm text-muted-foreground mt-1">مراقبة العمليات لحظياً وإدارة المخاطر - Sandbox Environment</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" data-testid="badge-environment">
            <Shield className="w-3 h-3 ml-1" />
            {config?.isActive ? "البيئة التجريبية نشطة" : "غير نشطة"}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading} data-testid="button-download-pdf">
            {pdfLoading ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Download className="w-4 h-4 ml-1" />}
            {pdfLoading ? "جاري الإنشاء..." : "تحميل PDF"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 ml-1" />
            تحديث
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card data-testid="card-total-transactions">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي العمليات</p>
                    <p className="text-2xl font-bold mt-1">{stats?.totalTransactions || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-amount">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي المبالغ</p>
                    <p className="text-2xl font-bold mt-1">{(stats?.totalAmount || 0).toLocaleString("ar-SA")} <span className="text-sm font-normal">ريال</span></p>
                  </div>
                  <DollarSign className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-active-users">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">المستخدمون النشطون</p>
                    <p className="text-2xl font-bold mt-1">{stats?.activeUsers || 0} <span className="text-sm font-normal text-muted-foreground">/ {config?.maxUsers || 500}</span></p>
                  </div>
                  <Users className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-flagged">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">عمليات مشبوهة</p>
                    <p className="text-2xl font-bold mt-1">{stats?.flaggedTransactions || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-breaches">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">تجاوز الحدود</p>
                    <p className="text-2xl font-bold mt-1">{stats?.limitBreachCount || 0}</p>
                  </div>
                  <Ban className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1" data-testid="card-sandbox-config">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                <CardTitle className="text-base">إعدادات البيئة التجريبية</CardTitle>
                <Shield className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الحد الأقصى للمستخدمين</span>
                  <span className="text-sm font-medium" data-testid="text-max-users">{config?.maxUsers || 500}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الحد الأقصى للتجار</span>
                  <span className="text-sm font-medium" data-testid="text-max-merchants">{config?.maxMerchants || 20}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">حد العملية الواحدة</span>
                  <span className="text-sm font-medium" data-testid="text-max-transaction">{config?.maxTransactionAmount || 500} ريال</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الحد اليومي</span>
                  <span className="text-sm font-medium" data-testid="text-daily-limit">{config?.dailyTransactionLimit || 1000} ريال</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الحد الشهري</span>
                  <span className="text-sm font-medium" data-testid="text-monthly-limit">{config?.monthlyTransactionLimit || 5000} ريال</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">البيئة</span>
                    <Badge variant="outline" data-testid="badge-env-type">
                      <Eye className="w-3 h-3 ml-1" />
                      Sandbox
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2" data-testid="card-simulate">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                <CardTitle className="text-base">محاكاة عملية تجريبية</CardTitle>
                <Play className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  تنفيذ عملية شراء وقود تجريبية لاختبار مسار الأموال وحدود العمليات
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">معرف المستخدم</label>
                    <Input
                      value={simUserId}
                      onChange={(e) => setSimUserId(e.target.value)}
                      placeholder="test-user-001"
                      data-testid="input-sim-user-id"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">المبلغ (ريال)</label>
                    <Input
                      type="number"
                      value={simAmount}
                      onChange={(e) => setSimAmount(e.target.value)}
                      placeholder="150"
                      data-testid="input-sim-amount"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">معرف المحطة</label>
                    <Input
                      value={simStationId}
                      onChange={(e) => setSimStationId(e.target.value)}
                      placeholder="station-001"
                      data-testid="input-sim-station"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSimulate}
                  disabled={simulateMutation.isPending}
                  data-testid="button-simulate"
                >
                  {simulateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Play className="w-4 h-4 ml-2" />
                  )}
                  تنفيذ العملية التجريبية
                </Button>

                {simulateMutation.data && (
                  <div className="mt-4 border rounded-md p-3">
                    <h4 className="text-sm font-medium mb-2">
                      {simulateMutation.data.success ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" /> نتيجة العملية - ناجحة
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <Ban className="w-4 h-4" /> نتيجة العملية - محظورة
                        </span>
                      )}
                    </h4>
                    {simulateMutation.data.success && simulateMutation.data.transaction && (
                      <div className="space-y-2">
                        {simulateMutation.data.transaction.steps.map((step: { step: number; type: string; amount: number; descriptionAr: string }) => (
                          <div key={step.step} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{step.step}</Badge>
                              <span>{step.descriptionAr}</span>
                            </div>
                            <span className="font-medium">{step.amount.toFixed(2)} ريال</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!simulateMutation.data.success && simulateMutation.data.breaches && (
                      <div className="space-y-1">
                        {simulateMutation.data.breaches.map((b: string) => (
                          <Badge key={b} variant="destructive">{breachTypeLabel(b)}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-money-flow">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  سجل تدفق الأموال
                </CardTitle>
                <Badge variant="outline">{monitoring?.recentTransactions?.length || 0} سجل</Badge>
              </CardHeader>
              <CardContent>
                {(!monitoring?.recentTransactions || monitoring.recentTransactions.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد عمليات بعد</p>
                    <p className="text-xs mt-1">استخدم المحاكاة لإنشاء عمليات تجريبية</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {monitoring.recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`flex items-center justify-between p-2 rounded-md border ${tx.flagged ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" : ""}`}
                        data-testid={`row-transaction-${tx.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {tx.eventType === "customer_debit" && <ArrowDownRight className="w-4 h-4 text-red-500 shrink-0" />}
                          {tx.eventType === "station_settlement" && <ArrowUpRight className="w-4 h-4 text-green-500 shrink-0" />}
                          {tx.eventType === "escrow_receipt" && <Building2 className="w-4 h-4 text-blue-500 shrink-0" />}
                          {tx.eventType === "commission_earned" && <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />}
                          {(tx.eventType === "limit_breach" || tx.eventType === "transaction_blocked") && <Ban className="w-4 h-4 text-red-500 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{eventTypeLabel(tx.eventType)}</p>
                            <p className="text-xs text-muted-foreground truncate">{tx.descriptionAr || tx.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 mr-2">
                          {eventCategoryBadge(tx.eventCategory)}
                          <span className="text-sm font-bold whitespace-nowrap">
                            {tx.amount?.toFixed(2)} <span className="text-xs font-normal">ريال</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-breaches-log">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  سجل تجاوز الحدود
                </CardTitle>
                <Badge variant="destructive">{monitoring?.recentBreaches?.length || 0} تجاوز</Badge>
              </CardHeader>
              <CardContent>
                {(!monitoring?.recentBreaches || monitoring.recentBreaches.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد تجاوزات</p>
                    <p className="text-xs mt-1">حدود العمليات آمنة</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {monitoring.recentBreaches.map((breach) => (
                      <div
                        key={breach.id}
                        className="p-2 rounded-md border border-red-200 dark:border-red-900"
                        data-testid={`row-breach-${breach.id}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="destructive">{breachTypeLabel(breach.breachType)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {breach.createdAt ? new Date(breach.createdAt).toLocaleString("ar-SA") : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">المبلغ المطلوب: <strong>{breach.attemptedAmount} ريال</strong></span>
                          <span className="text-muted-foreground">الحد: <strong>{breach.limitAmount} ريال</strong></span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          المستخدم: {breach.userId} | الاستخدام الحالي: {breach.currentUsage} ريال
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-money-path">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                مسار الأموال - من العميل إلى المحطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6">
                <div className="flex flex-col items-center text-center p-4 rounded-md border min-w-[120px]">
                  <Users className="w-8 h-8 mb-2 text-blue-500" />
                  <p className="text-sm font-medium">العميل</p>
                  <p className="text-xs text-muted-foreground">خصم المبلغ</p>
                </div>

                <div className="flex items-center">
                  <div className="w-8 sm:w-16 h-0.5 bg-border" />
                  <ArrowDownRight className="w-5 h-5 text-muted-foreground rotate-90 sm:rotate-0" />
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-md border border-amber-300 dark:border-amber-800 min-w-[120px]">
                  <Building2 className="w-8 h-8 mb-2 text-amber-500" />
                  <p className="text-sm font-medium">دربي (وسيط)</p>
                  <p className="text-xs text-muted-foreground">حساب الضمان</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">عمولة 3%</p>
                </div>

                <div className="flex items-center">
                  <div className="w-8 sm:w-16 h-0.5 bg-border" />
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground rotate-90 sm:rotate-0" />
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-md border min-w-[120px]">
                  <Fuel className="w-8 h-8 mb-2 text-green-500" />
                  <p className="text-sm font-medium">المحطة</p>
                  <p className="text-xs text-muted-foreground">تسوية المبلغ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 border-t pt-4">
                <div className="text-center p-2">
                  <p className="text-xs text-muted-foreground">الخطوة 1</p>
                  <p className="text-sm font-medium">طلب التقسيط</p>
                  <p className="text-xs text-muted-foreground">تحقق من الهوية والأهلية</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-muted-foreground">الخطوة 2</p>
                  <p className="text-sm font-medium">خصم من العميل</p>
                  <p className="text-xs text-muted-foreground">إلى حساب دربي الوسيط</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-muted-foreground">الخطوة 3</p>
                  <p className="text-sm font-medium">تسوية المحطة</p>
                  <p className="text-xs text-muted-foreground">97% للمحطة</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-muted-foreground">الخطوة 4</p>
                  <p className="text-sm font-medium">عمولة دربي</p>
                  <p className="text-xs text-muted-foreground">3% إيراد المنصة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}