import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { Settings, Moon, Sun, Bell, Shield, User, Car, Fuel } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-full p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-settings-title">
          <Settings className="h-6 w-6 text-primary" />
          الإعدادات
        </h1>
        <p className="text-muted-foreground">إدارة إعدادات الحساب والتطبيق</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              معلومات الحساب
            </CardTitle>
            <CardDescription>بيانات المستخدم الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                placeholder="أحمد محمد"
                defaultValue="مستخدم دربي"
                data-testid="input-full-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الجوال</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="text-left"
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                dir="ltr"
                className="text-left"
                data-testid="input-email"
              />
            </div>
            <Button className="w-full" data-testid="button-save-profile">
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              معلومات المركبة
            </CardTitle>
            <CardDescription>بيانات السيارة المسجلة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">رقم اللوحة</Label>
              <Input
                id="vehiclePlate"
                placeholder="أ ب ج 1234"
                data-testid="input-vehicle-plate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">نوع السيارة</Label>
              <Input
                id="vehicleModel"
                placeholder="تويوتا كامري 2023"
                data-testid="input-vehicle-model"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tankCapacity">سعة الخزان (لتر)</Label>
              <Input
                id="tankCapacity"
                type="number"
                placeholder="60"
                data-testid="input-tank-capacity"
              />
            </div>
            <Button className="w-full" data-testid="button-save-vehicle">
              حفظ بيانات المركبة
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              المظهر
            </CardTitle>
            <CardDescription>تخصيص مظهر التطبيق</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>الوضع الليلي</Label>
                <p className="text-sm text-muted-foreground">تفعيل المظهر الداكن</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                data-testid="switch-dark-mode"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              الإشعارات
            </CardTitle>
            <CardDescription>إعدادات التنبيهات والإشعارات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>إشعارات الأقساط</Label>
                <p className="text-sm text-muted-foreground">تنبيه قبل موعد السداد</p>
              </div>
              <Switch defaultChecked data-testid="switch-payment-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تنبيهات سنافي</Label>
                <p className="text-sm text-muted-foreground">توصيات تعبئة الوقود</p>
              </div>
              <Switch defaultChecked data-testid="switch-snafi-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>إشعارات المحطات</Label>
                <p className="text-sm text-muted-foreground">عروض وتخفيضات المحطات</p>
              </div>
              <Switch data-testid="switch-station-notifications" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              تفضيلات الوقود
            </CardTitle>
            <CardDescription>إعدادات التعبئة الافتراضية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>التذكير عند انخفاض الوقود</Label>
                <p className="text-sm text-muted-foreground">تنبيه عند انخفاض مستوى الخزان</p>
              </div>
              <Switch defaultChecked data-testid="switch-low-fuel-reminder" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>اقتراح أقرب محطة</Label>
                <p className="text-sm text-muted-foreground">إظهار المحطات القريبة تلقائياً</p>
              </div>
              <Switch defaultChecked data-testid="switch-nearby-stations" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              الأمان والخصوصية
            </CardTitle>
            <CardDescription>إعدادات الحماية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>المصادقة الثنائية</Label>
                <p className="text-sm text-muted-foreground">طبقة حماية إضافية</p>
              </div>
              <Switch data-testid="switch-two-factor" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>مشاركة البيانات مع سنافي</Label>
                <p className="text-sm text-muted-foreground">لتحسين التوقعات</p>
              </div>
              <Switch defaultChecked data-testid="switch-data-sharing" />
            </div>
            <Button variant="outline" className="w-full" data-testid="button-change-password">
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">منطقة الخطر</CardTitle>
          <CardDescription>إجراءات لا يمكن التراجع عنها</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="flex-1" data-testid="button-export-data">
            تصدير البيانات
          </Button>
          <Button variant="destructive" className="flex-1" data-testid="button-delete-account">
            حذف الحساب
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
