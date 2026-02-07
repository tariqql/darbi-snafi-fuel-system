import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Fuel, Brain, Shield, TrendingUp, Users, Building2, 
  Car, CreditCard, CheckCircle, ArrowRight, Target,
  BarChart3, Globe, Smartphone, Lock, Zap, Award,
  FileText, Download, Printer
} from "lucide-react";

export default function Investors() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div dir="rtl" className="min-h-full bg-gradient-to-b from-background to-muted/20 print:bg-white print:text-black">
      <div className="max-w-5xl mx-auto p-6 space-y-8 print:p-4 print:space-y-4">
        
        <div className="flex justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="gap-2" data-testid="button-print">
            <Printer className="h-4 w-4" />
            طباعة PDF
          </Button>
        </div>

        <header className="text-center py-12 print:py-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Fuel className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 print:text-3xl" data-testid="text-company-name">دربي</h1>
          <p className="text-xl text-muted-foreground mb-4">نظام تقسيط وقود السيارات الذكي</p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-sm">FinTech</Badge>
            <Badge variant="secondary" className="text-sm">AI-Powered</Badge>
            <Badge variant="secondary" className="text-sm">المملكة العربية السعودية</Badge>
          </div>
        </header>

        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">المشكلة والحل</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              في ظل ارتفاع تكاليف المعيشة، يواجه الكثيرون صعوبة في دفع تكاليف الوقود دفعة واحدة
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  المشكلة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  ارتفاع أسعار الوقود يضغط على الميزانية الشهرية
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  لا توجد خيارات تقسيط للوقود في السوق
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  صعوبة التخطيط المالي للرحلات الطويلة
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  عدم معرفة الكمية المثالية للتعبئة
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  الحل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  تقسيط فواتير الوقود على 3-12 شهر
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  محرك سنافي الذكي لتوصيات التعبئة المثالية
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  تخطيط الرحلات مع حساب تكلفة الوقود
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  كتالوج شامل لأكثر من 60 سيارة سعودية
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6 print:break-before-page print:pt-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 print:text-xl">الخدمات الرئيسية</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="text-center hover-elevate">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-lg">تقسيط الفواتير</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  قسّط فاتورة الوقود على أقساط شهرية مريحة حتى 12 شهر
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Brain className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-lg">محرك سنافي</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ذكاء اصطناعي يحلل استهلاكك ويقدم توصيات ذكية للتعبئة
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Globe className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-lg">صمم رحلتك</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  خطط رحلتك مع حساب المسافة والوقود والتكلفة المتوقعة
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6 print:break-inside-avoid">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 print:text-xl">الميزات التنافسية</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">تحقق شامل من الهوية</h3>
                <p className="text-sm text-muted-foreground">
                  تكامل مع نفاذ وسمة والتأمينات الاجتماعية للتحقق الآمن
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Car className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">كتالوج السيارات الذكي</h3>
                <p className="text-sm text-muted-foreground">
                  قاعدة بيانات 60+ سيارة مع سعة الخزان ونوع الوقود
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">معالجة فورية</h3>
                <p className="text-sm text-muted-foreground">
                  موافقة خلال ثوانٍ باستخدام الذكاء الاصطناعي
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">تعلم مستمر</h3>
                <p className="text-sm text-muted-foreground">
                  سنافي يتحسن مع كل تعبئة لتوصيات أدق
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 print:break-before-page print:pt-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 print:text-xl">نموذج العمل والإيرادات</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="text-center">
                <div className="text-3xl font-bold text-primary">2-5%</div>
                <CardTitle className="text-sm">رسوم التقسيط</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                رسوم خدمة على كل فاتورة مقسطة
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="text-3xl font-bold text-primary">1-2%</div>
                <CardTitle className="text-sm">عمولة المحطات</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                عمولة من شركاء محطات الوقود
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="text-3xl font-bold text-primary">Premium</div>
                <CardTitle className="text-sm">اشتراك متميز</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                خدمات إضافية للمشتركين المميزين
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6 print:break-inside-avoid">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 print:text-xl">حجم السوق</h2>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">15M+</div>
                  <p className="text-muted-foreground">سيارة مسجلة في السعودية</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">7,000+</div>
                  <p className="text-muted-foreground">محطة وقود</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">$50B+</div>
                  <p className="text-muted-foreground">سوق الوقود السنوي</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6 print:break-before-page print:pt-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 print:text-xl">خارطة الطريق</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">Q1 2026</div>
              <div className="flex-1">
                <Progress value={100} className="h-3" />
              </div>
              <div className="w-48 text-sm">إطلاق MVP ✅</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">Q2 2026</div>
              <div className="flex-1">
                <Progress value={0} className="h-3" />
              </div>
              <div className="w-48 text-sm">شراكات المحطات</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">Q3 2026</div>
              <div className="flex-1">
                <Progress value={0} className="h-3" />
              </div>
              <div className="w-48 text-sm">تطبيق الجوال</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">Q4 2026</div>
              <div className="flex-1">
                <Progress value={0} className="h-3" />
              </div>
              <div className="w-48 text-sm">توسع إقليمي</div>
            </div>
          </div>
        </section>

        <section className="space-y-6 print:break-before-page print:pt-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 print:text-xl">البنية التقنية</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  تطبيق العملاء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• React + TypeScript + Vite</p>
                <p>• واجهة عربية كاملة (RTL)</p>
                <p>• تصميم متجاوب للجوال</p>
                <p>• وضع ليلي ونهاري</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  تطبيق الشركاء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• إدارة المحطات والموظفين</p>
                <p>• تتبع المبيعات والإيرادات</p>
                <p>• تقارير تحليلية متقدمة</p>
                <p>• API للتكامل</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  محرك سنافي AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• خوارزمية مطابقة تاريخية</p>
                <p>• نظام تعلم مستمر</p>
                <p>• Decision Support ID فريد</p>
                <p>• تتبع دقة التنبؤات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  الأمان والامتثال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• تكامل نفاذ للهوية</p>
                <p>• فحص سمة الائتماني</p>
                <p>• KYC/AML Compliance</p>
                <p>• تشفير البيانات</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-8 print:break-inside-avoid print:py-4">
          <Card className="bg-gradient-to-l from-primary/10 to-primary/5 border-primary/20 print:bg-muted/10 print:from-transparent print:to-transparent">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Award className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">انضم إلى ثورة تمويل الوقود</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  نبحث عن مستثمرين استراتيجيين للمساهمة في بناء مستقبل تمويل الوقود في المملكة العربية السعودية
                </p>
                <div className="flex justify-center gap-4 flex-wrap print:hidden">
                  <Button className="gap-2" data-testid="button-contact">
                    تواصل معنا
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="gap-2" data-testid="button-download-deck">
                    <Download className="h-4 w-4" />
                    تحميل العرض
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="text-center py-6 border-t text-sm text-muted-foreground print:text-gray-600 print:py-4">
          <p>دربي - نظام تقسيط وقود السيارات الذكي</p>
          <p className="mt-1">المملكة العربية السعودية - 2026</p>
        </footer>
      </div>
    </div>
  );
}
