import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Key, CreditCard, BarChart3, Copy, Eye, EyeOff, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function MerchantPortal() {
  const { toast } = useToast();
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    companyName: "",
    companyNameAr: "",
    contactEmail: "",
    contactPhone: "",
    commercialReg: "",
    website: "",
    callbackUrl: "",
    category: "retail",
  });
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registrationData) => {
      const response = await apiRequest("POST", "/api/merchant/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      setRegistrationResult(data);
      toast({
        title: "تم التسجيل بنجاح",
        description: "تم إنشاء حساب التاجر. احتفظ بمفاتيح API.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التسجيل",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label} إلى الحافظة`,
    });
  };

  const handleRegister = () => {
    if (!registrationData.companyName || !registrationData.contactEmail) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم الشركة والبريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(registrationData);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">بوابة التجار</h1>
            <p className="text-muted-foreground">نظام "دربي" للتقسيط - Merchant API</p>
          </div>
        </div>

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 gap-2">
            <TabsTrigger value="register" data-testid="tab-register" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              تسجيل تاجر
            </TabsTrigger>
            <TabsTrigger value="api-keys" data-testid="tab-api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              مفاتيح API
            </TabsTrigger>
            <TabsTrigger value="integration" data-testid="tab-integration" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              التكامل
            </TabsTrigger>
            <TabsTrigger value="docs" data-testid="tab-docs" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              التوثيق
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>تسجيل تاجر جديد</CardTitle>
                  <CardDescription>أدخل بيانات شركتك للحصول على مفاتيح API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">اسم الشركة (إنجليزي) *</Label>
                      <Input
                        id="companyName"
                        data-testid="input-company-name"
                        value={registrationData.companyName}
                        onChange={(e) => setRegistrationData({ ...registrationData, companyName: e.target.value })}
                        placeholder="Company Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyNameAr">اسم الشركة (عربي)</Label>
                      <Input
                        id="companyNameAr"
                        data-testid="input-company-name-ar"
                        value={registrationData.companyNameAr}
                        onChange={(e) => setRegistrationData({ ...registrationData, companyNameAr: e.target.value })}
                        placeholder="اسم الشركة"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">البريد الإلكتروني *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        data-testid="input-contact-email"
                        value={registrationData.contactEmail}
                        onChange={(e) => setRegistrationData({ ...registrationData, contactEmail: e.target.value })}
                        placeholder="merchant@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">رقم الجوال</Label>
                      <Input
                        id="contactPhone"
                        data-testid="input-contact-phone"
                        value={registrationData.contactPhone}
                        onChange={(e) => setRegistrationData({ ...registrationData, contactPhone: e.target.value })}
                        placeholder="+966500000000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commercialReg">السجل التجاري</Label>
                      <Input
                        id="commercialReg"
                        data-testid="input-commercial-reg"
                        value={registrationData.commercialReg}
                        onChange={(e) => setRegistrationData({ ...registrationData, commercialReg: e.target.value })}
                        placeholder="1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">الموقع الإلكتروني</Label>
                      <Input
                        id="website"
                        data-testid="input-website"
                        value={registrationData.website}
                        onChange={(e) => setRegistrationData({ ...registrationData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="callbackUrl">Webhook URL</Label>
                    <Input
                      id="callbackUrl"
                      data-testid="input-callback-url"
                      value={registrationData.callbackUrl}
                      onChange={(e) => setRegistrationData({ ...registrationData, callbackUrl: e.target.value })}
                      placeholder="https://example.com/webhook"
                    />
                    <p className="text-xs text-muted-foreground">سنرسل إشعارات المدفوعات إلى هذا الرابط</p>
                  </div>

                  <Button 
                    onClick={handleRegister} 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                    data-testid="button-register-merchant"
                  >
                    {registerMutation.isPending ? "جاري التسجيل..." : "تسجيل التاجر"}
                  </Button>
                </CardContent>
              </Card>

              {registrationResult && (
                <Card className="border-green-500">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <CardTitle>تم التسجيل بنجاح!</CardTitle>
                    </div>
                    <CardDescription>{registrationResult.message}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">كود التاجر:</span>
                        <Badge variant="secondary" data-testid="text-merchant-code">
                          {registrationResult.data?.merchantCode}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">الحالة:</span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          قيد المراجعة
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        مفاتيح Sandbox (للاختبار)
                      </h4>
                      
                      <div className="space-y-2">
                        <Label>Public Key</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={registrationResult.data?.sandboxKeys?.publicKey || ""} 
                            readOnly 
                            className="font-mono text-xs"
                            data-testid="input-public-key"
                          />
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => copyToClipboard(registrationResult.data?.sandboxKeys?.publicKey, "Public Key")}
                            data-testid="button-copy-public-key"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Secret Key</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={showSecretKey ? (registrationResult.data?.sandboxKeys?.secretKey || "") : "sk_test_••••••••••••••••••••••••"} 
                            readOnly 
                            className="font-mono text-xs"
                            data-testid="input-secret-key"
                          />
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => setShowSecretKey(!showSecretKey)}
                            data-testid="button-toggle-secret"
                          >
                            {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => copyToClipboard(registrationResult.data?.sandboxKeys?.secretKey, "Secret Key")}
                            data-testid="button-copy-secret-key"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-600">مهم جداً:</p>
                          <p className="text-muted-foreground">احتفظ بـ Secret Key في مكان آمن. لن يتم عرضه مرة أخرى.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة مفاتيح API</CardTitle>
                <CardDescription>مفاتيح Sandbox للاختبار و Production للبيئة الحية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Sandbox</h4>
                      <Badge variant="secondary">للاختبار</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      استخدم هذه المفاتيح لاختبار التكامل قبل الإطلاق
                    </p>
                    <div className="text-xs font-mono bg-muted p-2 rounded">
                      pk_test_xxxxxxxxxxxxx
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Production</h4>
                      <Badge>للإنتاج</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      مفاتيح الإنتاج متاحة بعد تفعيل الحساب
                    </p>
                    <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground">
                      pk_live_xxxxxxxxxxxxx (غير متاح)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>دليل التكامل السريع</CardTitle>
                <CardDescription>كيف تضيف "دربي" لمتجرك في دقائق</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">1. إنشاء جلسة دفع (Checkout Session)</h4>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm" dir="ltr">
{`POST /api/merchant/checkout
Authorization: Bearer sk_test_your_secret_key

{
  "merchantReference": "ORDER-123",
  "consumer": {
    "phone": "+966500000001",
    "email": "customer@example.com",
    "name": "أحمد محمد"
  },
  "amount": {
    "total": 500,
    "tax": 75
  },
  "items": [
    { "name": "وقود 95", "quantity": 50, "unitPrice": 10 }
  ],
  "installmentCount": 4,
  "urls": {
    "success": "https://yoursite.com/success",
    "failure": "https://yoursite.com/failure"
  }
}`}
                  </pre>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">2. الاستجابة</h4>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm" dir="ltr">
{`{
  "success": true,
  "data": {
    "sessionToken": "chk_abc123...",
    "checkoutUrl": "/checkout/chk_abc123...",
    "expiresAt": "2024-01-15T12:30:00Z",
    "status": "pending"
  }
}`}
                  </pre>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">3. توجيه العميل</h4>
                  <p className="text-sm text-muted-foreground">
                    وجّه العميل إلى <code className="bg-muted px-1 rounded">checkoutUrl</code> لإكمال الدفع
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">4. Webhook Events</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Badge variant="outline">checkout.approved</Badge>
                    <Badge variant="outline">checkout.declined</Badge>
                    <Badge variant="outline">payment.captured</Badge>
                    <Badge variant="outline">refund.completed</Badge>
                    <Badge variant="outline">installment.paid</Badge>
                    <Badge variant="outline">installment.overdue</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>توثيق API الكامل</CardTitle>
                <CardDescription>جميع نقاط النهاية المتاحة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted font-mono text-sm flex items-center gap-2">
                      <Badge className="bg-green-500">POST</Badge>
                      /api/merchant/register
                    </div>
                    <div className="p-3 text-sm">تسجيل تاجر جديد</div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted font-mono text-sm flex items-center gap-2">
                      <Badge className="bg-green-500">POST</Badge>
                      /api/merchant/checkout
                    </div>
                    <div className="p-3 text-sm">إنشاء جلسة دفع جديدة (يتطلب Authorization)</div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted font-mono text-sm flex items-center gap-2">
                      <Badge className="bg-blue-500">GET</Badge>
                      /api/merchant/checkout/:sessionToken
                    </div>
                    <div className="p-3 text-sm">الحصول على حالة جلسة الدفع (يتطلب Authorization)</div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted font-mono text-sm flex items-center gap-2">
                      <Badge className="bg-green-500">POST</Badge>
                      /api/merchant/checkout/:sessionToken/cancel
                    </div>
                    <div className="p-3 text-sm">إلغاء جلسة الدفع (يتطلب Authorization)</div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted font-mono text-sm flex items-center gap-2">
                      <Badge className="bg-blue-500">GET</Badge>
                      /api/merchant/stats
                    </div>
                    <div className="p-3 text-sm">إحصائيات التاجر (يتطلب Authorization)</div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted font-mono text-sm flex items-center gap-2">
                      <Badge className="bg-blue-500">GET</Badge>
                      /api/checkout/:sessionToken
                    </div>
                    <div className="p-3 text-sm">صفحة الدفع للعميل (عام)</div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted font-mono text-sm flex items-center gap-2">
                      <Badge className="bg-green-500">POST</Badge>
                      /api/checkout/:sessionToken/approve
                    </div>
                    <div className="p-3 text-sm">موافقة العميل على الدفع</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
