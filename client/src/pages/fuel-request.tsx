import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { VehicleSelector } from "@/components/vehicle-selector";
import { 
  Fuel, Send, Store, CheckCircle2, XCircle, Clock, Shield, 
  CreditCard, Briefcase, UserCheck, AlertTriangle, Sparkles,
  ArrowRight, Loader2, MapPin, Phone, Building2, Car, Coins
} from "lucide-react";

interface SelectedVehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  tankCapacity: number;
  fuelType: string;
}

interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  fuelTypes: string[];
  pricePerLiter: number;
  rating: number;
}

interface VerificationStatus {
  nafath: "pending" | "verifying" | "verified" | "failed";
  simah: "pending" | "verifying" | "verified" | "failed";
  gosi: "pending" | "verifying" | "verified" | "failed";
  overall: "pending" | "approved" | "review" | "rejected";
  creditScore?: number;
  employmentType?: string;
  creditLimit?: number;
}

interface DecisionRecommendation {
  decisionSupportId: string;
  recommendedLiters: number;
  estimatedCost: number;
  confidenceScore: number;
  matchedRecords: number;
  currentFuelPrice: number;
}

type RequestStep = "vehicle" | "fuel" | "station" | "verification" | "submit" | "result";

export default function FuelRequest() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<RequestStep>("vehicle");
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle | null>(null);
  const [fuelPercentage, setFuelPercentage] = useState(50);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [recommendation, setRecommendation] = useState<DecisionRecommendation | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    nafath: "pending",
    simah: "pending",
    gosi: "pending",
    overall: "pending"
  });
  const [requestResult, setRequestResult] = useState<"approved" | "rejected" | null>(null);

  const { data: stations, isLoading: stationsLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const getRecommendationMutation = useMutation({
    mutationFn: async (data: { vehicleId: string; fuelPercentage: number; tankCapacity: number; fuelType: string }) => {
      const res = await apiRequest("POST", "/api/snafi/decision", {
        userId: "demo-user",
        vehicleId: data.vehicleId,
        inputFuelPercentage: data.fuelPercentage,
        inputTankCapacity: data.tankCapacity,
        selectedFuelType: data.fuelType,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setRecommendation(data);
      setCurrentStep("station");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل الحصول على التوصية",
        variant: "destructive",
      });
    },
  });

  const runVerificationMutation = useMutation({
    mutationFn: async () => {
      // ملاحظة: في الإنتاج، سيتم استدعاء APIs نفاذ/سمة/GOSI الفعلية
      // حالياً نستخدم محاكاة لأن هذه خدمات حكومية تتطلب اتفاقيات رسمية
      
      setVerificationStatus({
        nafath: "verifying",
        simah: "pending",
        gosi: "pending",
        overall: "pending"
      });
      
      // محاكاة التحقق من الهوية (نفاذ)
      await new Promise(r => setTimeout(r, 1000));
      const nafathSuccess = Math.random() > 0.1; // 90% نجاح
      if (!nafathSuccess) {
        setVerificationStatus(prev => ({ ...prev, nafath: "failed", overall: "rejected" }));
        throw new Error("فشل التحقق من الهوية - يرجى المحاولة مرة أخرى");
      }
      setVerificationStatus(prev => ({ ...prev, nafath: "verified", simah: "verifying" }));
      
      // محاكاة فحص السجل الائتماني (سمة)
      await new Promise(r => setTimeout(r, 1200));
      const creditScore = Math.floor(Math.random() * 300) + 550; // 550-850
      const simahSuccess = creditScore >= 500;
      if (!simahSuccess) {
        setVerificationStatus(prev => ({ ...prev, simah: "failed", overall: "rejected", creditScore }));
        throw new Error("السجل الائتماني غير مؤهل للتقسيط");
      }
      setVerificationStatus(prev => ({ ...prev, simah: "verified", gosi: "verifying", creditScore }));
      
      // محاكاة التحقق من التوظيف (GOSI)
      await new Promise(r => setTimeout(r, 1000));
      const employmentTypes = ["حكومي", "شبه حكومي", "قطاع خاص"];
      const employmentType = employmentTypes[Math.floor(Math.random() * employmentTypes.length)];
      const creditLimit = employmentType === "حكومي" ? 5000 : 
                         employmentType === "شبه حكومي" ? 3000 : 2000;
      
      setVerificationStatus(prev => ({ 
        ...prev, 
        gosi: "verified", 
        employmentType,
        creditLimit,
        overall: "approved"
      }));
      
      return { success: true, creditScore, employmentType, creditLimit };
    },
    onSuccess: () => {
      setCurrentStep("submit");
      toast({
        title: "تم التحقق بنجاح",
        description: "يمكنك الآن إتمام الطلب",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التحقق",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitRequestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVehicle || !selectedStation || !recommendation) {
        throw new Error("بيانات ناقصة");
      }
      
      // التحقق من اكتمال التحقق
      if (verificationStatus.overall !== "approved") {
        throw new Error("يجب إكمال التحقق أولاً");
      }

      // إرسال طلب إنشاء الفاتورة للخادم
      const res = await apiRequest("POST", "/api/invoices", {
        userId: "demo-user",
        stationId: selectedStation,
        liters: recommendation.recommendedLiters,
        installmentMonths: 3,
        fuelType: selectedVehicle.fuelType,
        decisionSupportId: recommendation.decisionSupportId,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "فشل إنشاء الفاتورة");
      }
      
      const invoice = await res.json();
      return { approved: true, invoiceId: invoice.invoiceNumber || invoice.id };
    },
    onSuccess: (data) => {
      setRequestResult(data.approved ? "approved" : "rejected");
      setCurrentStep("result");
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      if (data.approved) {
        toast({
          title: "تم قبول طلبك",
          description: `رقم الفاتورة: ${data.invoiceId}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء الطلب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVehicleSelect = (vehicle: SelectedVehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleGetRecommendation = () => {
    if (!selectedVehicle) return;
    getRecommendationMutation.mutate({
      vehicleId: selectedVehicle.vehicleId,
      fuelPercentage,
      tankCapacity: selectedVehicle.tankCapacity,
      fuelType: selectedVehicle.fuelType,
    });
  };

  const handleSelectStation = (stationId: string) => {
    setSelectedStation(stationId);
    setCurrentStep("verification");
    runVerificationMutation.mutate();
  };

  const getFuelTypeLabel = (type: string) => {
    switch (type) {
      case "91": return "بنزين 91";
      case "95": return "بنزين 95";
      case "diesel": return "ديزل";
      default: return type;
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "verifying": return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "failed": return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const steps = [
    { id: "vehicle", label: "السيارة", icon: Car },
    { id: "fuel", label: "الوقود", icon: Fuel },
    { id: "station", label: "المحطة", icon: Store },
    { id: "verification", label: "التحقق", icon: Shield },
    { id: "submit", label: "الإرسال", icon: Send },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progressPercent = currentStep === "result" ? 100 : ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20">
            <Fuel className="h-8 w-8 text-primary" />
          </div>
          طلب وقود بالتقسيط
        </h1>
        <p className="text-muted-foreground">المسار الرقمي - الطلب الذاتي</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = currentStepIndex > index || currentStep === "result";
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" :
                  isCompleted ? "bg-green-500/20 text-green-600" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {currentStep === "vehicle" && (
        <div className="space-y-6">
          <VehicleSelector onSelect={handleVehicleSelect} />
          
          {selectedVehicle && (
            <div className="flex justify-end">
              <Button 
                size="lg" 
                onClick={() => setCurrentStep("fuel")}
                data-testid="button-next-to-fuel"
              >
                التالي: تحديد الوقود
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {currentStep === "fuel" && selectedVehicle && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-primary" />
                نسبة الوقود الحالية
              </CardTitle>
              <CardDescription>
                حدد نسبة الوقود المتبقية في خزان سيارتك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-primary/5 to-orange-500/5 rounded-xl p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">السيارة المختارة</span>
                  <Badge variant="secondary">{getFuelTypeLabel(selectedVehicle.fuelType)}</Badge>
                </div>
                <p className="font-semibold text-lg">
                  {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                </p>
                <p className="text-sm text-muted-foreground">سعة الخزان: {selectedVehicle.tankCapacity} لتر</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">نسبة الوقود الحالية</span>
                  <span className="text-2xl font-bold text-primary">{fuelPercentage}%</span>
                </div>
                <Slider
                  value={[fuelPercentage]}
                  onValueChange={([val]) => setFuelPercentage(val)}
                  max={100}
                  step={5}
                  className="py-4"
                  data-testid="slider-fuel-percentage"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>فارغ (0%)</span>
                  <span>ممتلئ (100%)</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">الوقود المتبقي تقريباً</span>
                </div>
                <p className="text-xl font-bold">
                  {Math.round(selectedVehicle.tankCapacity * (fuelPercentage / 100))} لتر
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("vehicle")} data-testid="button-prev-to-vehicle">
                السابق
              </Button>
              <Button 
                size="lg" 
                onClick={handleGetRecommendation}
                disabled={getRecommendationMutation.isPending}
                data-testid="button-get-recommendation"
              >
                {getRecommendationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    احصل على توصية سنافي
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {currentStep === "station" && recommendation && (
        <div className="space-y-6">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                توصية سنافي
              </CardTitle>
              <CardDescription>
                معرف القرار: {recommendation.decisionSupportId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">الكمية الموصى بها</p>
                  <p className="text-2xl font-bold text-primary">{recommendation.recommendedLiters.toFixed(1)} لتر</p>
                </div>
                <div className="bg-background rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">التكلفة المتوقعة</p>
                  <p className="text-2xl font-bold">{recommendation.estimatedCost.toFixed(2)} ريال</p>
                </div>
                <div className="bg-background rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">نسبة الثقة</p>
                  <p className="text-2xl font-bold text-green-600">{recommendation.confidenceScore.toFixed(0)}%</p>
                </div>
                <div className="bg-background rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">سعر اللتر</p>
                  <p className="text-2xl font-bold">{recommendation.currentFuelPrice.toFixed(2)} ريال</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                اختر المحطة
              </CardTitle>
              <CardDescription>
                اختر محطة الوقود التي ترغب بالتعبئة منها
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : stations && stations.length > 0 ? (
                <div className="grid gap-4">
                  {stations.slice(0, 5).map((station) => (
                    <div
                      key={station.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover-elevate ${
                        selectedStation === station.id ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setSelectedStation(station.id)}
                      data-testid={`station-${station.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{station.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{station.address}</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge variant="secondary">{station.city}</Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {station.fuelTypes.map(t => getFuelTypeLabel(t)).join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>لا توجد محطات</AlertTitle>
                  <AlertDescription>لم يتم العثور على محطات متاحة حالياً</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("fuel")} data-testid="button-prev-to-fuel">
                السابق
              </Button>
              <Button 
                size="lg" 
                onClick={() => handleSelectStation(selectedStation)}
                disabled={!selectedStation}
                data-testid="button-continue-verification"
              >
                متابعة للتحقق
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {currentStep === "verification" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              التحقق الآلي
            </CardTitle>
            <CardDescription>
              جاري التحقق من هويتك وأهليتك للتقسيط
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">التحقق من الهوية (نفاذ)</p>
                    <p className="text-sm text-muted-foreground">التحقق عبر منصة نفاذ الوطنية</p>
                  </div>
                </div>
                {getVerificationIcon(verificationStatus.nafath)}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">السجل الائتماني (سمة)</p>
                    <p className="text-sm text-muted-foreground">
                      {verificationStatus.creditScore ? `درجة سمة: ${verificationStatus.creditScore}` : "جاري الفحص..."}
                    </p>
                  </div>
                </div>
                {getVerificationIcon(verificationStatus.simah)}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">بيانات التوظيف (GOSI)</p>
                    <p className="text-sm text-muted-foreground">
                      {verificationStatus.employmentType ? `موظف ${verificationStatus.employmentType}` : "جاري التحقق..."}
                    </p>
                  </div>
                </div>
                {getVerificationIcon(verificationStatus.gosi)}
              </div>
            </div>

            {verificationStatus.overall === "approved" && verificationStatus.creditLimit && (
              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">تمت الموافقة على الأهلية</AlertTitle>
                <AlertDescription>
                  الحد الائتماني المتاح: <span className="font-bold">{verificationStatus.creditLimit.toLocaleString()} ريال</span>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === "submit" && recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              تأكيد وإرسال الطلب
            </CardTitle>
            <CardDescription>
              راجع تفاصيل طلبك قبل الإرسال للتاجر
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  بيانات السيارة
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p><span className="text-muted-foreground">السيارة:</span> {selectedVehicle?.make} {selectedVehicle?.model}</p>
                  <p><span className="text-muted-foreground">سنة الصنع:</span> {selectedVehicle?.year}</p>
                  <p><span className="text-muted-foreground">نوع الوقود:</span> {getFuelTypeLabel(selectedVehicle?.fuelType || "")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  تفاصيل التعبئة
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p><span className="text-muted-foreground">الكمية:</span> <span className="font-bold text-primary">{recommendation.recommendedLiters.toFixed(1)} لتر</span></p>
                  <p><span className="text-muted-foreground">التكلفة:</span> <span className="font-bold">{recommendation.estimatedCost.toFixed(2)} ريال</span></p>
                  <p><span className="text-muted-foreground">معرف القرار:</span> {recommendation.decisionSupportId}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-600">جاهز للإرسال</span>
              </div>
              <p className="text-sm text-muted-foreground">
                سيتم إرسال طلبك للمحطة المختارة للموافقة عليه. ستتلقى إشعاراً فور قبول أو رفض الطلب.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep("station")} data-testid="button-edit-request">
              تعديل الطلب
            </Button>
            <Button 
              size="lg" 
              onClick={() => submitRequestMutation.mutate()}
              disabled={submitRequestMutation.isPending}
              data-testid="button-submit-request"
            >
              {submitRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  إرسال الطلب للتاجر
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === "result" && (
        <Card className={requestResult === "approved" ? "border-green-500/50" : "border-destructive/50"}>
          <CardContent className="pt-8 pb-8 text-center">
            {requestResult === "approved" ? (
              <>
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">تم قبول طلبك!</h2>
                <p className="text-muted-foreground mb-6">
                  تم إرسال كود التعبئة إلى جوالك. يمكنك التوجه للمحطة الآن.
                </p>
                <div className="bg-muted rounded-xl p-6 max-w-sm mx-auto mb-6">
                  <p className="text-sm text-muted-foreground mb-2">معرف القرار</p>
                  <p className="text-xl font-mono font-bold text-primary">{recommendation?.decisionSupportId}</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => window.location.href = "/invoices"} data-testid="button-view-invoices">
                    عرض الفواتير
                  </Button>
                  <Button onClick={() => {
                    setCurrentStep("vehicle");
                    setSelectedVehicle(null);
                    setRecommendation(null);
                    setRequestResult(null);
                  }} data-testid="button-new-request">
                    طلب جديد
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-destructive mb-2">تم رفض الطلب</h2>
                <p className="text-muted-foreground mb-6">
                  للأسف لم تتم الموافقة على طلبك. يمكنك المحاولة مرة أخرى أو التواصل مع الدعم.
                </p>
                <Button onClick={() => setCurrentStep("vehicle")} data-testid="button-retry">
                  المحاولة مرة أخرى
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
