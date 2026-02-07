import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VehicleSelector } from "@/components/vehicle-selector";
import { 
  Cpu, Fuel, Gauge, TrendingUp, CheckCircle, 
  Brain, Target, Coins, History, Sparkles, BarChart3, 
  Car, Droplets, CircleDollarSign, Info, RefreshCw
} from "lucide-react";

interface DecisionRecommendation {
  decisionSupportId: string;
  recommendedLiters: number;
  estimatedCost: number;
  confidenceScore: number;
  matchedRecords: number;
  currentFuelPrice: number;
  estimatedSavings: number;
  reasoning: string[];
  alternatives: {
    liters: number;
    cost: number;
    targetPercentage: number;
    label: string;
  }[];
}

interface AccuracyStats {
  totalSessions: number;
  avgAccuracy: number;
  improvementTrend: string;
  recentAccuracy: number;
}

function AnimatedFuelGauge({ percentage, size = 180, animate = true }: { percentage: number; size?: number; animate?: boolean }) {
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    if (animate) {
      const duration = 1000;
      const steps = 60;
      const increment = percentage / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= percentage) {
          setDisplayPercentage(percentage);
          clearInterval(timer);
        } else {
          setDisplayPercentage(current);
        }
      }, duration / steps);
      return () => clearInterval(timer);
    } else {
      setDisplayPercentage(percentage);
    }
  }, [percentage, animate]);

  const getColor = (pct: number) => {
    if (pct < 20) return "#ef4444";
    if (pct < 40) return "#f97316";
    if (pct < 60) return "#eab308";
    return "#22c55e";
  };

  const color = getColor(displayPercentage);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (displayPercentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" viewBox="0 0 100 100" style={{ width: size, height: size }}>
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: animate ? "stroke-dashoffset 0.1s ease-out" : "none",
            filter: `drop-shadow(0 0 10px ${color}50)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {Math.round(displayPercentage)}%
          </span>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">مستوى الخزان</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Snafi() {
  const { toast } = useToast();

  // Decision Support State
  const [decisionForm, setDecisionForm] = useState({
    vehicleId: "",
    make: "",
    model: "",
    year: 0,
    tankCapacity: 60,
    currentFuelPercentage: 30,
    fuelType: "91" as "91" | "95" | "diesel",
    vehicleSelected: false,
  });
  const [recommendation, setRecommendation] = useState<DecisionRecommendation | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(null);

  const handleVehicleSelect = (vehicle: {
    vehicleId: string;
    make: string;
    model: string;
    year: number;
    tankCapacity: number;
    fuelType: string;
  }) => {
    setDecisionForm({
      ...decisionForm,
      vehicleId: vehicle.vehicleId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      tankCapacity: vehicle.tankCapacity,
      fuelType: vehicle.fuelType as "91" | "95" | "diesel",
      vehicleSelected: true,
    });
  };

  // Demo user ID (valid UUID for testing)
  const demoUserId = "49395663-c9d6-4b1c-b538-3bf669e02698";

  // Fetch accuracy stats
  const { data: accuracyStats } = useQuery<AccuracyStats>({
    queryKey: ["/api/snafi/accuracy", demoUserId],
    queryFn: async () => {
      const res = await fetch(`/api/snafi/accuracy/${demoUserId}`);
      return res.json();
    },
  });

  // Decision Support Mutation
  const getDecisionMutation = useMutation({
    mutationFn: async (data: typeof decisionForm) => {
      const res = await apiRequest("POST", "/api/snafi/decision", {
        userId: demoUserId,
        vehicle: {
          vehicleId: data.vehicleId,
          make: data.make,
          model: data.model,
          tankCapacity: data.tankCapacity,
        },
        currentFuelPercentage: data.currentFuelPercentage,
        fuelType: data.fuelType,
      });
      return res.json() as Promise<DecisionRecommendation>;
    },
    onSuccess: (data) => {
      setRecommendation(data);
      setSelectedAlternative(null);
      toast({
        title: "تم التحليل بنجاح",
        description: `معرف القرار: ${data.decisionSupportId}`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحليل البيانات",
        variant: "destructive",
      });
    },
  });

  const handleGetRecommendation = () => {
    getDecisionMutation.mutate(decisionForm);
  };

  const getFuelTypeLabel = (type: string) => {
    switch (type) {
      case "91": return "بنزين 91";
      case "95": return "بنزين 95";
      case "diesel": return "ديزل";
      default: return type;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "تحسن": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "تراجع": return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-snafi-title">
            <Brain className="h-7 w-7 text-primary" />
            محرك سنافي الذكي
          </h1>
          <p className="text-muted-foreground">دعم قرار الشراء الذكي - توصيات مبنية على البيانات</p>
        </div>
        {accuracyStats && accuracyStats.totalSessions > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getTrendIcon(accuracyStats.improvementTrend)}
              <span className="text-sm text-muted-foreground">{accuracyStats.improvementTrend}</span>
            </div>
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3" />
              دقة {accuracyStats.avgAccuracy}%
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="decision" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="decision" className="gap-2" data-testid="tab-decision">
            <Sparkles className="h-4 w-4" />
            دعم القرار
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2" data-testid="tab-stats">
            <BarChart3 className="h-4 w-4" />
            الإحصائيات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="decision" className="space-y-6">
          {/* Vehicle Selector */}
          <VehicleSelector onSelect={handleVehicleSelect} />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Fuel Level Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-primary" />
                  مستوى الوقود الحالي
                </CardTitle>
                <CardDescription>
                  {decisionForm.vehicleSelected 
                    ? `${decisionForm.make} ${decisionForm.model} - سعة الخزان: ${decisionForm.tankCapacity} لتر`
                    : "اختر سيارتك أولاً من القائمة أعلاه"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <AnimatedFuelGauge 
                    percentage={decisionForm.currentFuelPercentage} 
                    animate={false}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>مستوى الوقود الحالي</Label>
                    <span className="font-bold text-lg">{decisionForm.currentFuelPercentage}%</span>
                  </div>
                  <Slider
                    value={[decisionForm.currentFuelPercentage]}
                    onValueChange={([value]) => setDecisionForm({ ...decisionForm, currentFuelPercentage: value })}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                    data-testid="slider-fuel-level"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>فارغ</span>
                    <span>ممتلئ</span>
                  </div>
                </div>

                {decisionForm.vehicleSelected && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(decisionForm.tankCapacity * decisionForm.currentFuelPercentage / 100)}
                      </p>
                      <p className="text-sm text-muted-foreground">لتر متبقي</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-orange-500">
                        {Math.round(decisionForm.tankCapacity * (100 - decisionForm.currentFuelPercentage) / 100)}
                      </p>
                      <p className="text-sm text-muted-foreground">لتر للتعبئة</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2" 
                  onClick={handleGetRecommendation}
                  disabled={getDecisionMutation.isPending || !decisionForm.vehicleSelected}
                  data-testid="button-get-recommendation"
                >
                  {getDecisionMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      احصل على توصية سنافي
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Recommendation Card */}
            <Card className={`transition-all duration-500 ${recommendation ? "border-2 border-green-500/50 bg-green-500/5" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  توصية سنافي
                </CardTitle>
                <CardDescription>
                  {recommendation ? `معرف القرار: ${recommendation.decisionSupportId}` : "ستظهر التوصية هنا بعد التحليل"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!recommendation ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Cpu className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">أدخل بيانات السيارة واضغط على زر التحليل</p>
                    <p className="text-sm text-muted-foreground">سيقوم سنافي بتحليل البيانات وتقديم توصية ذكية</p>
                  </div>
                ) : (
                  <>
                    {/* Main Recommendation */}
                    <div className="bg-gradient-to-l from-primary/10 to-transparent rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">الكمية الموصى بها</span>
                        <Badge className={getConfidenceColor(recommendation.confidenceScore)}>
                          ثقة {recommendation.confidenceScore}%
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-primary">{recommendation.recommendedLiters}</span>
                        <span className="text-2xl text-muted-foreground">لتر</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">التكلفة المتوقعة</p>
                            <p className="font-bold">{recommendation.estimatedCost.toFixed(2)} ريال</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">سعر اللتر</p>
                            <p className="font-bold">{recommendation.currentFuelPrice} ريال</p>
                          </div>
                        </div>
                      </div>
                      {recommendation.estimatedSavings > 0 && (
                        <div className="mt-4 p-3 bg-green-500/10 rounded-lg flex items-center gap-2">
                          <Coins className="h-5 w-5 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">
                            توفير متوقع: {recommendation.estimatedSavings.toFixed(2)} ريال
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Reasoning */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        تحليل سنافي
                      </h4>
                      <ul className="space-y-1">
                        {recommendation.reasoning.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                      {recommendation.matchedRecords > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                          <History className="h-3 w-3" />
                          تم مطابقة {recommendation.matchedRecords} سجل تاريخي
                        </p>
                      )}
                    </div>

                    {/* Alternatives */}
                    <div className="space-y-3">
                      <h4 className="font-medium">خيارات بديلة</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {recommendation.alternatives.map((alt, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedAlternative(selectedAlternative === i ? null : i)}
                            className={`p-3 rounded-lg border text-right transition-all hover-elevate ${
                              selectedAlternative === i 
                                ? "border-primary bg-primary/10" 
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-alternative-${i}`}
                          >
                            <p className="font-medium">{alt.label}</p>
                            <p className="text-sm text-muted-foreground">{alt.liters} لتر</p>
                            <p className="text-sm font-bold">{alt.cost.toFixed(2)} ريال</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">الجلسات المكتملة</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-sessions">
                  {accuracyStats?.totalSessions || 0}
                </div>
                <p className="text-xs text-muted-foreground">جلسة تحليل</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">متوسط الدقة</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-accuracy">
                  {accuracyStats?.avgAccuracy || 0}%
                </div>
                <Progress value={accuracyStats?.avgAccuracy || 0} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">الدقة الأخيرة</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-recent-accuracy">
                  {accuracyStats?.recentAccuracy || 0}%
                </div>
                <p className="text-xs text-muted-foreground">آخر 5 جلسات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">اتجاه التحسن</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getTrendIcon(accuracyStats?.improvementTrend || "ثابت")}
                  <span className="text-xl font-bold" data-testid="text-improvement-trend">
                    {accuracyStats?.improvementTrend || "ثابت"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                كيف يعمل سنافي؟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <h4 className="font-medium mb-2">جمع البيانات</h4>
                  <p className="text-sm text-muted-foreground">
                    يجمع سنافي بيانات سيارتك ومستوى الوقود الحالي ونوع الوقود المفضل
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <h4 className="font-medium mb-2">التحليل الذكي</h4>
                  <p className="text-sm text-muted-foreground">
                    يقارن سنافي بياناتك مع سجلات التعبئة السابقة الناجحة لحساب الكمية المثالية
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <h4 className="font-medium mb-2">التعلم المستمر</h4>
                  <p className="text-sm text-muted-foreground">
                    كلما استخدمت سنافي أكثر، زادت دقة توصياته بناءً على تجاربك السابقة
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
