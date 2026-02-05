import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, Shield, Building2, Users, CreditCard, AlertTriangle, 
  FileCheck, Headphones, Calculator, Banknote, Search, BarChart3,
  Store, Handshake, MapPin, UserCheck, Wallet, CheckCircle,
  Eye, ClipboardList, GraduationCap, Lock, Unlock, ArrowDown, ArrowLeft, ArrowRight, Network
} from "lucide-react";

const organizationalRelationships = [
  {
    level: 0,
    title: "القيادة التنفيذية",
    roles: ["CEO"],
    color: "bg-gradient-to-r from-amber-500 to-orange-600",
    description: "القرارات الاستراتيجية العليا"
  },
  {
    level: 1,
    title: "المدراء التنفيذيون",
    roles: ["COO", "CFO", "CPO"],
    color: "bg-gradient-to-r from-purple-500 to-indigo-600",
    description: "إدارة الأقسام الرئيسية",
    reportsTo: "CEO"
  },
  {
    level: 2,
    title: "الإدارة الوسطى",
    roles: ["مدير العمليات", "مدير المالية", "مدير المخاطر", "مسؤول الامتثال", "مدير النظام"],
    color: "bg-gradient-to-r from-blue-500 to-cyan-600",
    description: "تنفيذ السياسات والإشراف",
    reportsTo: "COO/CFO/CPO"
  },
  {
    level: 3,
    title: "قادة الفرق",
    roles: ["قائد خدمة العملاء", "قائد التحصيل", "مدير الفرع", "مدير الشراكات"],
    color: "bg-gradient-to-r from-green-500 to-emerald-600",
    description: "قيادة الفرق التشغيلية",
    reportsTo: "الإدارة الوسطى"
  },
  {
    level: 4,
    title: "المتخصصون",
    roles: ["محلل الاحتيال", "محلل البيانات", "أخصائي الجودة", "المدقق الداخلي", "محاسب أول"],
    color: "bg-gradient-to-r from-teal-500 to-cyan-600",
    description: "التحليل والتدقيق المتخصص",
    reportsTo: "قادة الفرق"
  },
  {
    level: 5,
    title: "الفريق التشغيلي",
    roles: ["موظف خدمة العملاء", "موظف التحصيل", "أمين الصندوق", "دعم التجار", "محاسب"],
    color: "bg-gradient-to-r from-slate-500 to-gray-600",
    description: "التنفيذ اليومي للعمليات",
    reportsTo: "المتخصصون/قادة الفرق"
  }
];

const departmentConnections = [
  { from: "المالية", to: "المخاطر", relation: "تقييم المخاطر المالية" },
  { from: "المخاطر", to: "الامتثال", relation: "ضمان الالتزام التنظيمي" },
  { from: "الامتثال", to: "مكافحة الاحتيال", relation: "التحقيق في المخالفات" },
  { from: "خدمة العملاء", to: "التحصيل", relation: "تحويل الحسابات المتأخرة" },
  { from: "التجار", to: "العمليات", relation: "تفعيل وإدارة الشراكات" },
  { from: "الفروع", to: "المحاسبة", relation: "التقارير المالية اليومية" },
  { from: "الجودة", to: "التدقيق", relation: "مراجعة معايير الأداء" },
  { from: "الموارد البشرية", to: "جميع الأقسام", relation: "التوظيف والتدريب" }
];

const roleCategories = [
  {
    id: "executive",
    title: "القيادة التنفيذية",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    roles: [
      {
        id: "ceo",
        title: "الرئيس التنفيذي (CEO)",
        titleEn: "Chief Executive Officer",
        description: "المسؤول الأعلى عن جميع عمليات الشركة والقرارات الاستراتيجية",
        permissions: ["جميع الصلاحيات", "اتخاذ القرارات الاستراتيجية", "الموافقة على الميزانيات", "تعيين الإدارة العليا"],
        dailyTasks: [
          "مراجعة تقارير الأداء اليومية",
          "عقد اجتماعات مع المدراء التنفيذيين",
          "الموافقة على الصفقات الكبرى",
          "مراجعة مؤشرات الأداء الرئيسية"
        ]
      },
      {
        id: "coo",
        title: "مدير العمليات التنفيذي (COO)",
        titleEn: "Chief Operating Officer",
        description: "المسؤول عن العمليات اليومية وكفاءة الأداء التشغيلي",
        permissions: ["إدارة العمليات", "الموافقة على العمليات الكبرى", "إدارة الفروع", "تخصيص الموارد"],
        dailyTasks: [
          "متابعة العمليات التشغيلية",
          "تحسين كفاءة العمليات",
          "إدارة الأزمات التشغيلية",
          "مراجعة أداء الفروع"
        ]
      },
      {
        id: "cfo",
        title: "المدير المالي (CFO)",
        titleEn: "Chief Financial Officer",
        description: "المسؤول عن جميع الشؤون المالية والتقارير المالية",
        permissions: ["إدارة المالية", "الموافقة على المصروفات", "التقارير المالية", "التسويات المالية"],
        dailyTasks: [
          "مراجعة التقارير المالية",
          "الموافقة على عمليات الاسترداد الكبيرة",
          "إدارة التدفق النقدي",
          "مراجعة تسويات التجار"
        ]
      },
      {
        id: "cpo",
        title: "مدير المنتجات (CPO)",
        titleEn: "Chief Product Officer",
        description: "المسؤول عن تطوير المنتجات والخدمات الجديدة",
        permissions: ["إدارة المنتجات", "تحليل السوق", "مراجعة تجربة المستخدم"],
        dailyTasks: [
          "مراجعة مقترحات المنتجات الجديدة",
          "تحليل ملاحظات العملاء",
          "تحسين تجربة المستخدم",
          "مراجعة خارطة طريق المنتج"
        ]
      }
    ]
  },
  {
    id: "management",
    title: "الإدارة الوسطى",
    icon: Shield,
    color: "from-purple-500 to-indigo-600",
    roles: [
      {
        id: "super_admin",
        title: "مدير النظام",
        titleEn: "Super Admin",
        description: "المسؤول عن إدارة النظام التقني وصلاحيات المستخدمين",
        permissions: ["إدارة المستخدمين", "إدارة الصلاحيات", "إعدادات النظام", "سجلات التدقيق"],
        dailyTasks: [
          "إدارة حسابات المستخدمين",
          "مراجعة سجلات الأمان",
          "تحديث إعدادات النظام",
          "معالجة طلبات الوصول"
        ]
      },
      {
        id: "operations_manager",
        title: "مدير العمليات",
        titleEn: "Operations Manager",
        description: "إدارة العمليات اليومية والإشراف على فرق العمل",
        permissions: ["إدارة الفرق", "الموافقة على طلبات سير العمل", "تفعيل التجار"],
        dailyTasks: [
          "متابعة طلبات سير العمل",
          "الموافقة على تفعيل التجار",
          "حل المشكلات التشغيلية",
          "إعداد تقارير الأداء"
        ]
      },
      {
        id: "finance_manager",
        title: "مدير المالية",
        titleEn: "Finance Manager",
        description: "إدارة الشؤون المالية والتسويات مع التجار",
        permissions: ["التقارير المالية", "التسويات", "الموافقة على الاستردادات"],
        dailyTasks: [
          "مراجعة التسويات اليومية",
          "الموافقة على طلبات الاسترداد",
          "إعداد التقارير المالية",
          "متابعة المستحقات"
        ]
      },
      {
        id: "risk_manager",
        title: "مدير المخاطر",
        titleEn: "Risk Manager",
        description: "تقييم وإدارة المخاطر الائتمانية والتشغيلية",
        permissions: ["تقارير الائتمان", "تعديل حدود الائتمان", "تحليل المخاطر"],
        dailyTasks: [
          "مراجعة طلبات رفع حد الائتمان",
          "تحليل مؤشرات المخاطر",
          "وضع سياسات الائتمان",
          "تقييم العملاء الجدد"
        ]
      },
      {
        id: "compliance_officer",
        title: "مسؤول الامتثال",
        titleEn: "Compliance Officer",
        description: "ضمان الامتثال للأنظمة واللوائح المحلية والدولية",
        permissions: ["تقارير الامتثال", "فحوصات AML/KYC", "التقارير التنظيمية"],
        dailyTasks: [
          "مراجعة فحوصات التحقق من الهوية",
          "إعداد تقارير الامتثال",
          "تحديث سياسات مكافحة غسيل الأموال",
          "التواصل مع الجهات الرقابية"
        ]
      }
    ]
  },
  {
    id: "customer_ops",
    title: "خدمة العملاء والتحصيل",
    icon: Headphones,
    color: "from-sky-500 to-blue-600",
    roles: [
      {
        id: "customer_service_lead",
        title: "قائد خدمة العملاء",
        titleEn: "Customer Service Lead",
        description: "قيادة فريق خدمة العملاء وتصعيد الحالات المعقدة",
        permissions: ["إدارة التذاكر", "تصعيد الحالات", "تقارير الفريق"],
        dailyTasks: [
          "توزيع التذاكر على الفريق",
          "معالجة الحالات المصعدة",
          "تدريب الموظفين الجدد",
          "مراجعة أداء الفريق"
        ]
      },
      {
        id: "customer_service",
        title: "موظف خدمة العملاء",
        titleEn: "Customer Service Agent",
        description: "التعامل مع استفسارات وشكاوى العملاء",
        permissions: ["عرض التذاكر", "الرد على العملاء", "عرض الفواتير"],
        dailyTasks: [
          "الرد على استفسارات العملاء",
          "حل مشاكل الحسابات",
          "توثيق المحادثات",
          "تحويل الحالات المعقدة"
        ]
      },
      {
        id: "collections_lead",
        title: "قائد التحصيل",
        titleEn: "Collections Lead",
        description: "إدارة عمليات التحصيل وخطط السداد",
        permissions: ["إدارة المتأخرات", "خطط السداد", "تصعيد التحصيل"],
        dailyTasks: [
          "مراجعة الحسابات المتأخرة",
          "الموافقة على خطط السداد",
          "تصعيد الحالات الصعبة",
          "إعداد تقارير التحصيل"
        ]
      },
      {
        id: "collections",
        title: "موظف التحصيل",
        titleEn: "Collections Agent",
        description: "متابعة الحسابات المتأخرة والتواصل مع العملاء",
        permissions: ["عرض المتأخرات", "التواصل مع العملاء", "تسجيل الوعود"],
        dailyTasks: [
          "الاتصال بالعملاء المتأخرين",
          "التفاوض على جداول السداد",
          "توثيق المتابعات",
          "تحديث حالات التحصيل"
        ]
      }
    ]
  },
  {
    id: "finance_ops",
    title: "المحاسبة والتحليل",
    icon: Calculator,
    color: "from-teal-500 to-emerald-600",
    roles: [
      {
        id: "senior_accountant",
        title: "محاسب أول",
        titleEn: "Senior Accountant",
        description: "مراجعة العمليات المالية وإعداد التقارير",
        permissions: ["التقارير المالية", "التسويات", "مراجعة الحسابات"],
        dailyTasks: [
          "مراجعة القيود المحاسبية",
          "إعداد التقارير الشهرية",
          "تسوية الحسابات",
          "مراجعة عمل المحاسبين"
        ]
      },
      {
        id: "accountant",
        title: "محاسب",
        titleEn: "Accountant",
        description: "تسجيل العمليات المالية ومعالجة المدفوعات",
        permissions: ["عرض الفواتير", "معالجة المدفوعات", "التقارير الأساسية"],
        dailyTasks: [
          "تسجيل العمليات اليومية",
          "مطابقة المدفوعات",
          "إعداد كشوف الحساب",
          "معالجة الفواتير"
        ]
      },
      {
        id: "data_analyst",
        title: "محلل البيانات",
        titleEn: "Data Analyst",
        description: "تحليل البيانات وإعداد التقارير التحليلية",
        permissions: ["التقارير التحليلية", "تحليل المخاطر", "عرض البيانات"],
        dailyTasks: [
          "إعداد لوحات المتابعة",
          "تحليل سلوك العملاء",
          "إنشاء التقارير الدورية",
          "اكتشاف الأنماط والاتجاهات"
        ]
      },
      {
        id: "fraud_analyst",
        title: "محلل الاحتيال",
        titleEn: "Fraud Analyst",
        description: "كشف ومنع عمليات الاحتيال المالي",
        permissions: ["تنبيهات الاحتيال", "التحقيق", "حظر المعاملات"],
        dailyTasks: [
          "مراجعة التنبيهات المشبوهة",
          "التحقيق في الحالات",
          "تحديث قواعد الكشف",
          "إعداد تقارير الاحتيال"
        ]
      }
    ]
  },
  {
    id: "merchants",
    title: "إدارة التجار",
    icon: Store,
    color: "from-cyan-500 to-teal-600",
    roles: [
      {
        id: "partnerships_manager",
        title: "مدير الشراكات",
        titleEn: "Partnerships Manager",
        description: "بناء الشراكات مع التجار الجدد وإدارة العلاقات",
        permissions: ["إنشاء تجار", "تفعيل التجار", "إدارة العقود"],
        dailyTasks: [
          "التفاوض مع تجار جدد",
          "إعداد عقود الشراكة",
          "تفعيل حسابات التجار",
          "مراجعة أداء الشراكات"
        ]
      },
      {
        id: "merchant_support",
        title: "دعم التجار",
        titleEn: "Merchant Support",
        description: "دعم التجار وحل مشاكلهم التقنية والتشغيلية",
        permissions: ["عرض التجار", "تحديث بيانات التجار", "دعم فني"],
        dailyTasks: [
          "الرد على استفسارات التجار",
          "حل المشاكل التقنية",
          "تدريب التجار على النظام",
          "متابعة طلبات الدعم"
        ]
      }
    ]
  },
  {
    id: "branches",
    title: "إدارة الفروع",
    icon: MapPin,
    color: "from-lime-500 to-green-600",
    roles: [
      {
        id: "branch_manager",
        title: "مدير الفرع",
        titleEn: "Branch Manager",
        description: "إدارة عمليات الفرع والإشراف على الموظفين",
        permissions: ["إدارة الفرع", "تقارير الفرع", "إدارة الموظفين", "نقطة البيع"],
        dailyTasks: [
          "الإشراف على عمليات الفرع",
          "إدارة جداول الموظفين",
          "مراجعة تقارير المبيعات",
          "حل مشاكل العملاء"
        ]
      },
      {
        id: "assistant_branch_manager",
        title: "مساعد مدير الفرع",
        titleEn: "Assistant Branch Manager",
        description: "مساعدة مدير الفرع في الإشراف اليومي",
        permissions: ["عرض الفرع", "نقطة البيع", "تقارير أساسية"],
        dailyTasks: [
          "الإشراف على أمناء الصندوق",
          "معالجة الاستثناءات",
          "إغلاق اليوم المالي",
          "التدريب والتوجيه"
        ]
      },
      {
        id: "cashier",
        title: "أمين الصندوق",
        titleEn: "Cashier",
        description: "معالجة معاملات العملاء في نقطة البيع",
        permissions: ["إنشاء فواتير POS", "معالجة المدفوعات", "عرض المعاملات"],
        dailyTasks: [
          "إنشاء فواتير التقسيط",
          "معالجة المدفوعات",
          "إصدار الإيصالات",
          "موازنة الصندوق"
        ]
      }
    ]
  },
  {
    id: "quality",
    title: "الجودة والتدقيق",
    icon: CheckCircle,
    color: "from-fuchsia-500 to-purple-600",
    roles: [
      {
        id: "qa_specialist",
        title: "أخصائي الجودة",
        titleEn: "QA Specialist",
        description: "ضمان جودة الخدمات والعمليات",
        permissions: ["مراجعة الفواتير", "تقييم الجودة", "سجلات التدقيق"],
        dailyTasks: [
          "مراجعة عينات المعاملات",
          "تقييم جودة الخدمة",
          "إعداد تقارير الجودة",
          "اقتراح التحسينات"
        ]
      },
      {
        id: "internal_auditor",
        title: "مدقق داخلي",
        titleEn: "Internal Auditor",
        description: "تدقيق العمليات الداخلية وضمان الالتزام",
        permissions: ["عرض جميع البيانات", "سجلات التدقيق", "تقارير الامتثال", "إعدادات النظام"],
        dailyTasks: [
          "تدقيق العمليات المالية",
          "مراجعة الالتزام بالسياسات",
          "إعداد تقارير التدقيق",
          "متابعة الملاحظات"
        ]
      },
      {
        id: "auditor",
        title: "مدقق",
        titleEn: "Auditor",
        description: "مراجعة وتدقيق العمليات والتقارير",
        permissions: ["عرض البيانات", "سجلات التدقيق", "التقارير"],
        dailyTasks: [
          "مراجعة المعاملات",
          "التحقق من الوثائق",
          "إعداد ملاحظات التدقيق",
          "دعم التدقيق الخارجي"
        ]
      }
    ]
  },
  {
    id: "hr",
    title: "الموارد البشرية",
    icon: Users,
    color: "from-pink-500 to-rose-600",
    roles: [
      {
        id: "hr_manager",
        title: "مدير الموارد البشرية",
        titleEn: "HR Manager",
        description: "إدارة شؤون الموظفين والتوظيف",
        permissions: ["إدارة المستخدمين الإداريين", "عرض البيانات"],
        dailyTasks: [
          "إدارة عمليات التوظيف",
          "مراجعة طلبات الإجازات",
          "تقييم الأداء",
          "تطوير السياسات"
        ]
      },
      {
        id: "training_officer",
        title: "مسؤول التدريب",
        titleEn: "Training Officer",
        description: "تصميم وتنفيذ برامج التدريب",
        permissions: ["عرض المستخدمين"],
        dailyTasks: [
          "إعداد برامج التدريب",
          "تنفيذ جلسات التدريب",
          "تقييم فعالية التدريب",
          "تطوير المحتوى التدريبي"
        ]
      }
    ]
  }
];

export default function RolesDemo() {
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState("executive");
  const [showHierarchy, setShowHierarchy] = useState(true);

  const currentCategory = roleCategories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold" data-testid="text-page-title">
            الهيكل التنظيمي لنظام دربي
          </h1>
          <p className="text-muted-foreground text-lg">
            27 دوراً وظيفياً عبر 14 قسماً - مطابق لهيكل تمارا BNPL
          </p>
          <div className="flex justify-center gap-2 pt-4">
            <Button 
              variant={showHierarchy ? "default" : "outline"} 
              onClick={() => setShowHierarchy(true)}
              data-testid="btn-show-hierarchy"
            >
              <Network className="h-4 w-4 ml-2" />
              الهيكل الهرمي والعلاقات
            </Button>
            <Button 
              variant={!showHierarchy ? "default" : "outline"} 
              onClick={() => setShowHierarchy(false)}
              data-testid="btn-show-roles"
            >
              <Users className="h-4 w-4 ml-2" />
              تفاصيل الأدوار
            </Button>
          </div>
        </div>

        {showHierarchy && (
          <div className="space-y-8">
            <Card data-testid="card-hierarchy">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  التسلسل الهرمي للأدوار
                </CardTitle>
                <CardDescription>
                  كيف تتدفق القرارات والتقارير من القمة إلى القاعدة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {organizationalRelationships.map((level, idx) => (
                  <div key={level.level} className="relative" data-testid={`hierarchy-level-${level.level}`}>
                    {idx > 0 && (
                      <div className="flex justify-center mb-2">
                        <div className="flex flex-col items-center text-muted-foreground">
                          <ArrowDown className="h-6 w-6" />
                          <span className="text-xs">يرفع التقارير إلى: {level.reportsTo}</span>
                        </div>
                      </div>
                    )}
                    <div className={`${level.color} rounded-lg p-4 text-white`}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-lg">{level.title}</h3>
                          <p className="text-white/80 text-sm">{level.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {level.roles.map((role, i) => (
                            <Badge 
                              key={i} 
                              variant="secondary" 
                              className="bg-white/20 text-white border-white/30"
                              data-testid={`role-badge-${level.level}-${i}`}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card data-testid="card-connections">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-blue-500" />
                  الترابط بين الأقسام
                </CardTitle>
                <CardDescription>
                  كيف تتعاون الأقسام المختلفة وتتبادل المعلومات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {departmentConnections.map((conn, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      data-testid={`connection-${idx}`}
                    >
                      <Badge variant="outline" className="shrink-0">{conn.from}</Badge>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="shrink-0">{conn.to}</Badge>
                      <span className="text-xs text-muted-foreground mr-auto">{conn.relation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-workflow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-green-500" />
                  مثال على سير العمل
                </CardTitle>
                <CardDescription>
                  كيف تتم معالجة طلب تقسيط جديد عبر الأقسام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-purple-500" />
                  <div className="space-y-6 pr-8">
                    {[
                      { step: 1, dept: "خدمة العملاء", action: "استقبال طلب التقسيط من العميل", icon: Headphones },
                      { step: 2, dept: "المخاطر", action: "تقييم المخاطر الائتمانية للعميل", icon: AlertTriangle },
                      { step: 3, dept: "الامتثال", action: "التحقق من الالتزام بالأنظمة", icon: Shield },
                      { step: 4, dept: "مكافحة الاحتيال", action: "فحص مؤشرات الاحتيال", icon: Search },
                      { step: 5, dept: "المالية", action: "الموافقة على حد الائتمان", icon: CreditCard },
                      { step: 6, dept: "التاجر", action: "إتمام عملية البيع", icon: Store },
                      { step: 7, dept: "المحاسبة", action: "تسجيل المعاملة المالية", icon: Calculator },
                      { step: 8, dept: "التحصيل", action: "متابعة الأقساط الشهرية", icon: Banknote }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.step} className="relative flex items-center gap-4" data-testid={`workflow-step-${item.step}`}>
                          <div className="absolute -right-8 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {item.step}
                          </div>
                          <div className="flex-1 flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Icon className="h-5 w-5 text-primary shrink-0" />
                            <div>
                              <Badge variant="secondary" className="mb-1">{item.dept}</Badge>
                              <p className="text-sm">{item.action}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!showHierarchy && (
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1">
            {roleCategories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex flex-col items-center gap-1 py-2 px-3 text-xs"
                  data-testid={`tab-${category.id}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {roleCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.roles.map((role) => (
                  <Card 
                    key={role.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedRole?.id === role.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedRole(role)}
                    data-testid={`card-role-${role.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`bg-gradient-to-r ${category.color}`}>
                          {role.title}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        {role.titleEn}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((perm, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRole(role);
                        }}
                        data-testid={`btn-view-${role.id}`}
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        عرض المهام اليومية
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        )}

        {selectedRole && (
          <Card className="border-2 border-primary mt-6" data-testid="panel-role-details">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl" data-testid="text-selected-role-title">{selectedRole.title}</CardTitle>
                  <CardDescription>{selectedRole.titleEn}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRole(null)} data-testid="btn-close-details">
                  إغلاق
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2" data-testid="heading-permissions">
                  <Unlock className="h-5 w-5 text-green-500" />
                  الصلاحيات الممنوحة
                </h3>
                <div className="space-y-2" data-testid="list-permissions">
                  {selectedRole.permissions.map((perm: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg" data-testid={`permission-${i}`}>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2" data-testid="heading-tasks">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  المهام اليومية
                </h3>
                <div className="space-y-2" data-testid="list-tasks">
                  {selectedRole.dailyTasks.map((task: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg" data-testid={`task-${i}`}>
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ملخص الهيكل التنظيمي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg" data-testid="stat-roles">
                <div className="text-3xl font-bold text-primary">27</div>
                <div className="text-sm text-muted-foreground">دور وظيفي</div>
              </div>
              <div className="p-4 bg-muted rounded-lg" data-testid="stat-departments">
                <div className="text-3xl font-bold text-primary">14</div>
                <div className="text-sm text-muted-foreground">قسم إداري</div>
              </div>
              <div className="p-4 bg-muted rounded-lg" data-testid="stat-permissions">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">صلاحية</div>
              </div>
              <div className="p-4 bg-muted rounded-lg" data-testid="stat-categories">
                <div className="text-3xl font-bold text-primary">8</div>
                <div className="text-sm text-muted-foreground">فئات رئيسية</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
