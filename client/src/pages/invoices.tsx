import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Receipt, CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { Invoice, FuelStation } from "@shared/schema";

export default function Invoices() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    stationId: "",
    fuelType: "95",
    liters: "",
    totalInstallments: "3",
  });

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: stations = [] } = useQuery<FuelStation[]>({
    queryKey: ["/api/stations"],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsDialogOpen(false);
      setFormData({ stationId: "", fuelType: "95", liters: "", totalInstallments: "3" });
      toast({
        title: "تم إنشاء الفاتورة",
        description: "تم إنشاء فاتورة التقسيط بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الفاتورة",
        variant: "destructive",
      });
    },
  });

  const payInstallmentMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiRequest("POST", `/api/invoices/${invoiceId}/pay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "تم السداد",
        description: "تم سداد القسط بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء سداد القسط",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const station = stations.find(s => s.id === formData.stationId);
    if (!station) return;

    const liters = parseFloat(formData.liters);
    const amount = liters * (station.pricePerLiter || 0);
    const totalInstallments = parseInt(formData.totalInstallments);
    const monthlyAmount = amount / totalInstallments;

    createInvoiceMutation.mutate({
      userId: "user-1",
      stationId: formData.stationId,
      fuelType: formData.fuelType,
      liters,
      amount,
      totalInstallments,
      monthlyAmount,
      status: "active",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const getStatusBadge = (status: string, paid: number, total: number) => {
    if (status === "completed" || paid >= total) {
      return <Badge variant="default" className="bg-chart-3 text-primary-foreground">مكتملة</Badge>;
    }
    if (paid > 0) {
      return <Badge variant="default" className="bg-chart-1 text-primary-foreground">قيد السداد</Badge>;
    }
    return <Badge variant="default">جديدة</Badge>;
  };

  const activeInvoices = invoices.filter(inv => inv.status === "active");
  const completedInvoices = invoices.filter(inv => inv.status === "paid" || (inv.paidAmount || 0) >= inv.totalAmount);

  return (
    <div className="min-h-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-invoices-title">تقسيط الفواتير</h1>
          <p className="text-muted-foreground">إدارة فواتير الوقود وخطط التقسيط</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-new-invoice">
              <Plus className="h-4 w-4" />
              فاتورة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء فاتورة تقسيط جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل عملية التعبئة لإنشاء خطة تقسيط
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="station">محطة الوقود</Label>
                <Select
                  value={formData.stationId}
                  onValueChange={(value) => setFormData({ ...formData, stationId: value })}
                >
                  <SelectTrigger data-testid="select-station">
                    <SelectValue placeholder="اختر المحطة" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name} - {station.pricePerLiter} ر.س/لتر
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">نوع الوقود</Label>
                <Select
                  value={formData.fuelType}
                  onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                >
                  <SelectTrigger data-testid="select-fuel-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="91">بنزين 91</SelectItem>
                    <SelectItem value="95">بنزين 95</SelectItem>
                    <SelectItem value="diesel">ديزل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="liters">الكمية (لتر)</Label>
                <Input
                  id="liters"
                  type="number"
                  step="0.1"
                  min="1"
                  placeholder="مثال: 50"
                  value={formData.liters}
                  onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                  data-testid="input-liters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installments">عدد الأقساط</Label>
                <Select
                  value={formData.totalInstallments}
                  onValueChange={(value) => setFormData({ ...formData, totalInstallments: value })}
                >
                  <SelectTrigger data-testid="select-installments">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">قسطين</SelectItem>
                    <SelectItem value="3">3 أقساط</SelectItem>
                    <SelectItem value="4">4 أقساط</SelectItem>
                    <SelectItem value="6">6 أقساط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.stationId && formData.liters && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex justify-between text-sm">
                      <span>إجمالي المبلغ:</span>
                      <span className="font-bold">
                        {(parseFloat(formData.liters) * (stations.find(s => s.id === formData.stationId)?.pricePerLiter || 0)).toFixed(2)} ر.س
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>القسط الشهري:</span>
                      <span className="font-bold text-primary">
                        {((parseFloat(formData.liters) * (stations.find(s => s.id === formData.stationId)?.pricePerLiter || 0)) / parseInt(formData.totalInstallments)).toFixed(2)} ر.س
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!formData.stationId || !formData.liters || createInvoiceMutation.isPending}
                data-testid="button-submit-invoice"
              >
                {createInvoiceMutation.isPending ? "جاري الإنشاء..." : "إنشاء الفاتورة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستحق</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-due">
              {activeInvoices.reduce((sum, inv) => sum + (inv.totalAmount - (inv.paidAmount || 0)), 0).toFixed(2)} ر.س
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">فواتير نشطة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-count">
              {activeInvoices.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">فواتير مكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-count">
              {completedInvoices.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          الفواتير الحالية
        </h2>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد فواتير حالياً</p>
              <p className="text-sm text-muted-foreground mt-1">
                أنشئ فاتورة جديدة لبدء التقسيط
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {invoices.map((invoice) => {
              const paidInstallments = Math.floor((invoice.paidAmount || 0) / invoice.monthlyAmount);
              const remaining = invoice.installmentMonths - paidInstallments;
              const progress = ((invoice.paidAmount || 0) / invoice.totalAmount) * 100;
              const isCompleted = (invoice.paidAmount || 0) >= invoice.totalAmount;

              return (
                <Card key={invoice.id} data-testid={`card-invoice-${invoice.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        فاتورة #{invoice.id.slice(0, 8)}
                      </CardTitle>
                      {getStatusBadge(invoice.status || "active", invoice.paidAmount || 0, invoice.totalAmount)}
                    </div>
                    <CardDescription>
                      {invoice.installmentMonths} أقساط - {invoice.totalAmount.toFixed(2)} ر.س
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>المبلغ الإجمالي</span>
                        <span className="font-bold">{invoice.totalAmount.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>القسط الشهري</span>
                        <span className="font-medium">{invoice.monthlyAmount.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>الأقساط المتبقية</span>
                        <span>{remaining} من {invoice.installmentMonths}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>التقدم</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {!isCompleted && (
                      <Button
                        onClick={() => payInstallmentMutation.mutate(invoice.id)}
                        disabled={payInstallmentMutation.isPending}
                        className="w-full"
                        data-testid={`button-pay-${invoice.id}`}
                      >
                        سداد القسط ({invoice.monthlyAmount.toFixed(2)} ر.س)
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
