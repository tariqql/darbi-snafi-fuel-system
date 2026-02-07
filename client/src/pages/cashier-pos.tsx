import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  QrCode, Phone, User, Car, Fuel, Sparkles, CheckCircle2, 
  Printer, CreditCard, Loader2, AlertTriangle, Receipt,
  Building2, Clock, Coins, ArrowRight, XCircle
} from "lucide-react";

interface CustomerData {
  id: string;
  fullName: string;
  phone: string;
  creditLimit: number;
  availableCredit: number;
  priorityLevel: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    tankCapacity: number;
    fuelType: string;
  };
}

interface DecisionRecommendation {
  decisionSupportId: string;
  recommendedLiters: number;
  estimatedCost: number;
  confidenceScore: number;
  currentFuelPrice: number;
  matchedRecords: number;
}

interface InvoiceResult {
  invoiceId: string;
  decisionSupportId: string;
  totalAmount: number;
  monthlyAmount: number;
  installmentMonths: number;
}

type POSStep = "scan" | "customer" | "fuel" | "recommendation" | "confirm" | "complete";

export default function CashierPOS() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<POSStep>("scan");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [fuelPercentage, setFuelPercentage] = useState(25);
  const [recommendation, setRecommendation] = useState<DecisionRecommendation | null>(null);
  const [actualLiters, setActualLiters] = useState<number>(0);
  const [invoiceResult, setInvoiceResult] = useState<InvoiceResult | null>(null);

  const lookupCustomerMutation = useMutation({
    mutationFn: async (phone: string) => {
      await new Promise(r => setTimeout(r, 800));
      return {
        id: "cust-demo-001",
        fullName: "محمد عبدالله الأحمد",
        phone: phone,
        creditLimit: 5000,
        availableCredit: 3500,
        priorityLevel: "premium",
        vehicle: {
          make: "تويوتا",
          model: "كامري",
          year: 2023,
          plateNumber: "أ ب ج 1234",
          tankCapacity: 60,
          fuelType: "91"
        }
      } as CustomerData;
    },
    onSuccess: (data) => {
      setCustomer(data);
      setCurrentStep("customer");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على العميل",
        variant: "destructive",
      });
    },
  });

  const getRecommendationMutation = useMutation({
    mutationFn: async (data: { fuelPercentage: number; tankCapacity: number; fuelType: string }) => {
      const res = await apiRequest("POST", "/api/snafi/decision", {
        userId: customer?.id || "demo-user",
        vehicleId: "vehicle-demo",
        inputFuelPercentage: data.fuelPercentage,
        inputTankCapacity: data.tankCapacity,
        selectedFuelType: data.fuelType,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setRecommendation(data);
      setActualLiters(data.recommendedLiters);
      setCurrentStep("recommendation");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل الحصول على التوصية",
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      await new Promise(r => setTimeout(r, 1000));
      const invoiceId = `INV-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return {
        invoiceId,
        decisionSupportId: recommendation?.decisionSupportId || "",
        totalAmount: actualLiters * (recommendation?.currentFuelPrice || 2.18),
        monthlyAmount: (actualLiters * (recommendation?.currentFuelPrice || 2.18)) / 3,
        installmentMonths: 3
      } as InvoiceResult;
    },
    onSuccess: (data) => {
      setInvoiceResult(data);
      setCurrentStep("complete");
      toast({
        title: "تم إنشاء الفاتورة",
        description: `رقم الفاتورة: ${data.invoiceId}`,
      });
    },
  });

  const handlePhoneSubmit = () => {
    if (phoneNumber.length >= 9) {
      lookupCustomerMutation.mutate(phoneNumber);
    }
  };

  const handleGetRecommendation = () => {
    if (!customer?.vehicle) return;
    getRecommendationMutation.mutate({
      fuelPercentage,
      tankCapacity: customer.vehicle.tankCapacity,
      fuelType: customer.vehicle.fuelType,
    });
  };

  const getFuelTypeLabel = (type: string) => {
    switch (type) {
      case "91": return "بنزين 91";
      case "95": return "بنزين 95";
      case "diesel": return "ديزل";
      default: return type;
    }
  };

  const getPriorityBadge = (level: string) => {
    const styles: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      premium: { variant: "default", label: "Premium - حكومي" },
      high: { variant: "secondary", label: "High - شبه حكومي" },
      medium: { variant: "outline", label: "Medium - خاص" },
    };
    const style = styles[level] || { variant: "outline" as const, label: level };
    return <Badge variant={style.variant}>{style.label}</Badge>;
  };

  const resetPOS = () => {
    setCurrentStep("scan");
    setPhoneNumber("");
    setCustomer(null);
    setFuelPercentage(25);
    setRecommendation(null);
    setActualLiters(0);
    setInvoiceResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-primary">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold">نظام نقطة البيع</h1>
              <p className="text-sm text-muted-foreground">المسار الميداني - عند الكاشير</p>
            </div>
          </div>
        </div>

        {currentStep === "scan" && (
          <Card className="border-2">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>تعريف العميل</CardTitle>
              <CardDescription>امسح رمز QR أو أدخل رقم الجوال</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-xl p-8 text-center bg-muted/30">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">امسح رمز QR من تطبيق العميل</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone">رقم الجوال</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-lg tracking-wider"
                    dir="ltr"
                    data-testid="input-phone-number"
                  />
                  <Button 
                    onClick={handlePhoneSubmit}
                    disabled={phoneNumber.length < 9 || lookupCustomerMutation.isPending}
                    data-testid="button-lookup-customer"
                  >
                    {lookupCustomerMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "بحث"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "customer" && customer && (
          <div className="space-y-6">
            <Card className="border-2 border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customer.fullName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                  </div>
                  {getPriorityBadge(customer.priorityLevel)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">الحد الائتماني</p>
                    <p className="text-lg font-bold">{customer.creditLimit.toLocaleString()} ريال</p>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">المتاح</p>
                    <p className="text-lg font-bold text-green-600">{customer.availableCredit.toLocaleString()} ريال</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {customer.vehicle && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    السيارة المسجلة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{customer.vehicle.make} {customer.vehicle.model} ({customer.vehicle.year})</p>
                      <p className="text-sm text-muted-foreground">لوحة: {customer.vehicle.plateNumber}</p>
                    </div>
                    <div className="text-left">
                      <Badge variant="outline">{getFuelTypeLabel(customer.vehicle.fuelType)}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{customer.vehicle.tankCapacity} لتر</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={() => setCurrentStep("fuel")}
                    data-testid="button-continue-to-fuel"
                  >
                    متابعة
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}

        {currentStep === "fuel" && customer?.vehicle && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-primary" />
                نسبة الوقود الحالية
              </CardTitle>
              <CardDescription>اسأل العميل عن نسبة الوقود المتبقية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <div className="text-6xl font-bold text-primary mb-2">{fuelPercentage}%</div>
                <p className="text-muted-foreground">
                  ≈ {Math.round(customer.vehicle.tankCapacity * (fuelPercentage / 100))} لتر متبقي
                </p>
              </div>

              <Slider
                value={[fuelPercentage]}
                onValueChange={([val]) => setFuelPercentage(val)}
                max={100}
                step={5}
                className="py-4"
                data-testid="slider-cashier-fuel"
              />

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>فارغ تقريباً</span>
                <span>ربع</span>
                <span>نصف</span>
                <span>ثلاثة أرباع</span>
                <span>ممتلئ</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("customer")} data-testid="button-prev-to-customer">السابق</Button>
              <Button 
                size="lg" 
                onClick={handleGetRecommendation}
                disabled={getRecommendationMutation.isPending}
                data-testid="button-activate-snafi"
              >
                {getRecommendationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    تفعيل سنافي
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === "recommendation" && recommendation && customer && (
          <div className="space-y-6">
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-orange-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    توصية سنافي
                  </CardTitle>
                  <Badge variant="outline" className="font-mono">
                    {recommendation.decisionSupportId}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-background rounded-xl p-4">
                    <Fuel className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{recommendation.recommendedLiters.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">لتر موصى</p>
                  </div>
                  <div className="bg-background rounded-xl p-4">
                    <Coins className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{recommendation.estimatedCost.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">ريال</p>
                  </div>
                  <div className="bg-background rounded-xl p-4">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{recommendation.confidenceScore.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">ثقة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">الكمية الفعلية للتعبئة</CardTitle>
                <CardDescription>أدخل الكمية الفعلية بعد التعبئة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={actualLiters}
                    onChange={(e) => setActualLiters(parseFloat(e.target.value) || 0)}
                    className="text-2xl text-center font-bold"
                    step="0.1"
                    data-testid="input-actual-liters"
                  />
                  <span className="text-xl text-muted-foreground">لتر</span>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>التكلفة الإجمالية</span>
                    <span className="text-2xl font-bold">
                      {(actualLiters * recommendation.currentFuelPrice).toFixed(2)} ريال
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep("fuel")} data-testid="button-prev-to-fuel-cashier">السابق</Button>
                <Button 
                  size="lg" 
                  onClick={() => setCurrentStep("confirm")}
                  disabled={actualLiters <= 0}
                  data-testid="button-confirm-amount"
                >
                  تأكيد المبلغ
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {currentStep === "confirm" && recommendation && customer && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>تأكيد العملية</CardTitle>
              <CardDescription>راجع التفاصيل قبل إنشاء الفاتورة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العميل</span>
                  <span className="font-medium">{customer.fullName}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">السيارة</span>
                  <span className="font-medium">{customer.vehicle?.make} {customer.vehicle?.model}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الكمية</span>
                  <span className="font-medium">{actualLiters.toFixed(1)} لتر</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر اللتر</span>
                  <span className="font-medium">{recommendation.currentFuelPrice.toFixed(2)} ريال</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">الإجمالي</span>
                  <span className="font-bold text-primary">
                    {(actualLiters * recommendation.currentFuelPrice).toFixed(2)} ريال
                  </span>
                </div>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>التقسيط على 3 أشهر</AlertTitle>
                <AlertDescription>
                  القسط الشهري: <span className="font-bold">
                    {((actualLiters * recommendation.currentFuelPrice) / 3).toFixed(2)} ريال
                  </span>
                </AlertDescription>
              </Alert>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {recommendation.decisionSupportId}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge className="font-mono text-xs">INV-XXXX</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  سيتم ربط معرف القرار بالفاتورة لتتبع دقة التنبؤ
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCurrentStep("recommendation")} data-testid="button-edit-confirm">
                تعديل
              </Button>
              <Button 
                className="flex-1" 
                size="lg"
                onClick={() => createInvoiceMutation.mutate()}
                disabled={createInvoiceMutation.isPending}
                data-testid="button-create-invoice"
              >
                {createInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    إنشاء الفاتورة
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === "complete" && invoiceResult && (
          <Card className="border-2 border-green-500/50">
            <CardContent className="pt-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">تمت العملية بنجاح!</h2>
              
              <div className="bg-muted rounded-xl p-6 my-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">رقم الفاتورة</p>
                  <p className="text-xl font-mono font-bold">{invoiceResult.invoiceId}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">معرف القرار (Decision ID)</p>
                  <p className="text-lg font-mono font-bold text-primary">{invoiceResult.decisionSupportId}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                    <p className="text-xl font-bold">{invoiceResult.totalAmount.toFixed(2)} ريال</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">القسط الشهري</p>
                    <p className="text-xl font-bold">{invoiceResult.monthlyAmount.toFixed(2)} ريال</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" size="lg" data-testid="button-print-receipt">
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة الإيصال
                </Button>
                <Button size="lg" onClick={resetPOS} data-testid="button-new-transaction">
                  عملية جديدة
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
