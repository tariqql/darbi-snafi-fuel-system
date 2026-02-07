import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { merchantRegistrationSchema, type MerchantRegistration } from "@shared/schema";
import {
  Fuel, Zap, Shield, TrendingUp, Users, CreditCard, 
  CheckCircle2, ArrowLeft, Smartphone, BarChart3, Clock,
  Store, Loader2, Building2, Phone, MapPin, FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const features = [
  {
    icon: CreditCard,
    title: "دفع لاحق بدون فوائد",
    description: "امنح عملاءك مرونة الدفع على أقساط بدون أي فوائد أو رسوم إضافية"
  },
  {
    icon: Zap,
    title: "تكامل سريع",
    description: "ابدأ استقبال المدفوعات خلال 24 ساعة مع API بسيط وسهل التكامل"
  },
  {
    icon: TrendingUp,
    title: "زيادة المبيعات",
    description: "زد مبيعاتك بنسبة تصل إلى 40% مع خيارات الدفع المرنة"
  },
  {
    icon: Shield,
    title: "ضمان كامل",
    description: "احصل على المبلغ كاملاً خلال يوم واحد، ونحن نتحمل مخاطر التحصيل"
  },
  {
    icon: Users,
    title: "قاعدة عملاء واسعة",
    description: "الوصول لأكثر من مليون مستخدم نشط يبحثون عن خيارات دفع مرنة"
  },
  {
    icon: BarChart3,
    title: "تحليلات متقدمة",
    description: "لوحة تحكم شاملة لمتابعة المعاملات والإيرادات في الوقت الفعلي"
  },
];

const saudiCities = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الظهران", "الأحساء", "القطيف", "الطائف",
  "تبوك", "بريدة", "خميس مشيط", "أبها", "نجران",
  "جازان", "ينبع", "حائل", "الجبيل", "عرعر"
];

export default function MerchantLanding() {
  const [, setLocation] = useLocation();
  const [showRegistration, setShowRegistration] = useState(false);
  const { toast } = useToast();

  const form = useForm<MerchantRegistration>({
    resolver: zodResolver(merchantRegistrationSchema),
    defaultValues: {
      companyName: "",
      commercialReg: "",
      city: "",
      contactPhone: "",
      contactEmail: ""
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: MerchantRegistration) => {
      const response = await apiRequest("POST", "/api/merchants/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isExisting && data.status === "active") {
        toast({
          title: "مرحباً بعودتك!",
          description: "تم التعرف على حسابك، جاري التحويل للوحة التحكم...",
        });
        setTimeout(() => {
          setLocation("/dashboard");
        }, 1500);
      } else if (data.isExisting && data.status === "pending") {
        toast({
          title: "طلبك قيد المراجعة",
          description: "سنتواصل معك خلال 24-48 ساعة لإتمام التفعيل",
        });
        setShowRegistration(false);
      } else {
        toast({
          title: "تم استلام طلبك بنجاح!",
          description: "سيتواصل معك فريقنا خلال 24 ساعة لإتمام التسجيل",
        });
        setShowRegistration(false);
        form.reset();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MerchantRegistration) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3" data-testid="header-logo">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none" data-testid="text-brand-name">شركاء دربي</h1>
                <p className="text-xs text-muted-foreground" data-testid="text-domain">partners.darbby.co</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                onClick={() => setShowRegistration(true)}
                data-testid="btn-start-registration"
              >
                ابدأ التسجيل
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-20 lg:py-32" data-testid="section-hero">
        <div className="absolute inset-0 bg-gradient-to-bl from-orange-500/10 via-transparent to-amber-500/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6" data-testid="badge-join">
              انضم لشبكة محطات دربي
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-l from-orange-600 to-amber-600 bg-clip-text text-transparent" data-testid="text-hero-title">
              وسّع أعمالك مع دربي
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
              انضم لأكبر شبكة تقسيط وقود في المملكة. زد مبيعاتك واستقطب عملاء جدد مع خيارات دفع مرنة بدون مخاطر
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => setShowRegistration(true)}
                data-testid="btn-hero-register"
              >
                سجّل محطتك الآن
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" data-testid="btn-contact-sales">
                تواصل مع المبيعات
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6" data-testid="section-stats">
              <div className="text-center" data-testid="stat-stations">
                <div className="text-3xl font-bold text-orange-600">+500</div>
                <div className="text-sm text-muted-foreground">محطة شريكة</div>
              </div>
              <div className="text-center" data-testid="stat-customers">
                <div className="text-3xl font-bold text-orange-600">+1M</div>
                <div className="text-sm text-muted-foreground">عميل نشط</div>
              </div>
              <div className="text-center" data-testid="stat-growth">
                <div className="text-3xl font-bold text-orange-600">40%</div>
                <div className="text-sm text-muted-foreground">زيادة المبيعات</div>
              </div>
              <div className="text-center" data-testid="stat-activation">
                <div className="text-3xl font-bold text-orange-600">24h</div>
                <div className="text-sm text-muted-foreground">تفعيل الحساب</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="section-features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-features-title">لماذا تختار دربي؟</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-features-description">
              نقدم لك كل ما تحتاجه لتنمية أعمالك وزيادة إيراداتك
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-sm" data-testid={`card-feature-${index}`}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-snafi">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-snafi-title">محرك سنافي الذكي</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-snafi-description">
              تقنية ذكاء اصطناعي متطورة تساعد عملاءك على اتخاذ قرارات تزويد أفضل
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-orange-200 dark:border-orange-900/50" data-testid="card-snafi-analysis">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4">
                  <Fuel className="h-8 w-8 text-white" />
                </div>
                <CardTitle>تحليل استهلاك الوقود</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                يحلل سنافي أنماط استهلاك كل عميل ويقدم توصيات مخصصة للتزويد
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900/50" data-testid="card-snafi-timing">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <CardTitle>توقيت مثالي للتزويد</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                ينبّه العملاء عندما يكون الوقت مناسباً للتزويد بناءً على رحلاتهم
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900/50" data-testid="card-snafi-experience">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <CardTitle>تجربة سلسة</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                يوجّه العملاء لمحطتك ويسهّل عملية الدفع عبر رمز QR سريع
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-bl from-orange-500 to-amber-600 text-white" data-testid="section-cta">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="text-cta-title">
            جاهز للانضمام لشركاء دربي؟
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto" data-testid="text-cta-description">
            سجّل الآن وابدأ استقبال العملاء خلال 24 ساعة
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8"
            onClick={() => setShowRegistration(true)}
            data-testid="btn-cta-register"
          >
            ابدأ التسجيل المجاني
            <ArrowLeft className="mr-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <footer className="py-12 border-t" data-testid="footer">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3" data-testid="footer-logo">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Store className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">شركاء دربي</span>
            </div>
            <div className="text-sm text-muted-foreground" data-testid="footer-copyright">
              © 2024 دربي. جميع الحقوق محفوظة | partners.darbby.co
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="sm:max-w-lg" dir="rtl" data-testid="dialog-registration">
          <DialogHeader>
            <DialogTitle className="text-2xl" data-testid="text-dialog-title">تسجيل محطة جديدة</DialogTitle>
            <DialogDescription data-testid="text-dialog-description">
              أدخل بيانات محطتك للانضمام لشبكة شركاء دربي
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      اسم الشركة / المحطة *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: محطة النجم الذهبي"
                        {...field}
                        data-testid="input-company-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commercialReg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      رقم السجل التجاري *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: 1010XXXXXX"
                        {...field}
                        data-testid="input-commercial-reg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      المدينة *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-city">
                          <SelectValue placeholder="اختر المدينة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {saudiCities.map((city) => (
                          <SelectItem key={city} value={city} data-testid={`option-city-${city}`}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      رقم الجوال *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="05XXXXXXXX"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      البريد الإلكتروني (اختياري)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50" data-testid="text-terms">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  بالضغط على "إرسال الطلب"، أوافق على شروط الخدمة وسياسة الخصوصية
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="btn-submit-registration"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال الطلب"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
