import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCode, Database, Route, Cpu, CreditCard, MapPin, Users, Building2, GitBranch, Download } from "lucide-react";

declare global {
  interface Window {
    mermaid: any;
  }
}

export default function Design() {
  const [activeTab, setActiveTab] = useState("stakeholders");
  const mermaidLoaded = useRef(false);

  useEffect(() => {
    if (!mermaidLoaded.current) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
      script.async = true;
      script.onload = () => {
        window.mermaid.initialize({ 
          startOnLoad: false, 
          theme: "default",
          securityLevel: "loose",
          flowchart: { useMaxWidth: true, htmlLabels: true },
          sequence: { useMaxWidth: true, wrap: true }
        });
        renderDiagrams();
      };
      document.head.appendChild(script);
      mermaidLoaded.current = true;
    } else if (window.mermaid) {
      renderDiagrams();
    }
  }, [activeTab]);

  const renderDiagrams = async () => {
    if (window.mermaid) {
      const diagramElements = document.querySelectorAll(".mermaid-diagram");
      const diagramArray = Array.from(diagramElements);
      for (let i = 0; i < diagramArray.length; i++) {
        const diagram = diagramArray[i];
        const code = diagram.getAttribute("data-code");
        if (code && !diagram.querySelector("svg")) {
          try {
            const { svg } = await window.mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, code);
            diagram.innerHTML = svg;
          } catch (e) {
            console.error("Mermaid error:", e);
          }
        }
      }
    }
  };

  const diagrams = {
    "stakeholders": {
      title: "أصحاب المصلحة والفاعلين",
      icon: Users,
      description: "تحليل الفاعلين في النظام - تطبيق العملاء وتطبيق البزنس",
      code: `graph TB
    subgraph "أصحاب المصلحة الأساسيين"
        C[العميل/السائق]
        S[محطة الوقود]
        P[الشريك التجاري]
        A[مدير النظام]
    end
    
    subgraph "أصحاب المصلحة الثانويين"
        B[البنوك]
        I[شركات التأمين]
        G[الجهات الحكومية]
        T[شركات النقل]
    end
    
    subgraph "النظام"
        SYS[منظومة دربي]
    end
    
    C --> SYS
    S --> SYS
    P --> SYS
    A --> SYS
    SYS --> B
    SYS --> I
    SYS --> G
    T --> SYS`
    },
    "fuel-request": {
      title: "عملية طلب تعبئة الوقود",
      icon: CreditCard,
      description: "تدفق العملية التجارية لطلب تعبئة وقود بالتقسيط",
      code: `flowchart TD
    Start([بداية]) --> A[العميل يفتح التطبيق]
    A --> B{مسجل؟}
    B -->|لا| C[التسجيل/الدخول]
    C --> D[التحقق من الهوية KYC]
    B -->|نعم| E[عرض الرصيد المتاح]
    D --> E
    E --> F[اختيار المحطة]
    F --> G[تحديد كمية الوقود]
    G --> H[تحديد خطة التقسيط]
    H --> I{موافقة سنافي AI؟}
    I -->|رفض| J[عرض بدائل]
    J --> K{قبول البديل؟}
    K -->|نعم| H
    K -->|لا| End1([إنهاء])
    I -->|موافقة| L[إنشاء الفاتورة]
    L --> M[إرسال QR للعميل]
    M --> N[العميل يذهب للمحطة]
    N --> O[مسح QR في المحطة]
    O --> P[تأكيد التعبئة]
    P --> Q[تحديث الرصيد]
    Q --> End2([نهاية ناجحة])`
    },
    "payment": {
      title: "عملية سداد الأقساط",
      icon: CreditCard,
      description: "تدفق سداد القسط الشهري",
      code: `flowchart TD
    Start([بداية الشهر]) --> A[إرسال تذكير بالقسط]
    A --> B[العميل يستلم الإشعار]
    B --> C{الدفع خلال 3 أيام؟}
    C -->|نعم| D[خصم من المحفظة/البطاقة]
    D --> E{نجاح الدفع؟}
    E -->|نعم| F[تحديث حالة الفاتورة]
    F --> G[إرسال إيصال]
    G --> End1([نهاية])
    E -->|لا| H[إشعار فشل الدفع]
    H --> I[انتظار 24 ساعة]
    I --> D
    C -->|لا| J[إرسال تذكير ثاني]
    J --> K{الدفع خلال 3 أيام؟}
    K -->|نعم| D
    K -->|لا| L[تجميد الحساب]
    L --> M[إشعار التأخر]
    M --> N[إضافة غرامة]
    N --> End2([تصعيد للتحصيل])`
    },
    "station-registration": {
      title: "تسجيل محطة جديدة - البزنس",
      icon: Building2,
      description: "عملية تسجيل محطة وقود جديدة كشريك",
      code: `flowchart TD
    Start([بداية]) --> A[مالك المحطة يتقدم]
    A --> B[تعبئة بيانات المحطة]
    B --> C[رفع المستندات]
    C --> D[مراجعة أولية]
    D --> E{مستندات كاملة؟}
    E -->|لا| F[طلب مستندات إضافية]
    F --> C
    E -->|نعم| G[زيارة ميدانية]
    G --> H{اجتياز المعاينة؟}
    H -->|لا| I[إرسال ملاحظات التحسين]
    I --> J{إعادة التقديم؟}
    J -->|نعم| G
    J -->|لا| End1([رفض])
    H -->|نعم| K[توقيع العقد]
    K --> L[تفعيل المحطة]
    L --> M[تدريب الموظفين]
    M --> N[بدء العمليات]
    N --> End2([نهاية])`
    },
    "snafi-analysis": {
      title: "تحليل سنافي AI للخزان",
      icon: Cpu,
      description: "عملية قياس الخزان والتحليل بالذكاء الاصطناعي",
      code: `flowchart TD
    Start([بداية]) --> A[العميل يرفع صورة العداد]
    A --> B[معالجة الصورة OCR]
    B --> C[استخراج القراءة]
    C --> D[مقارنة مع القراءة السابقة]
    D --> E[حساب الاستهلاك الفعلي]
    E --> F{انحراف كبير؟}
    F -->|نعم| G[تحليل Claude AI]
    G --> H[تحديد السبب المحتمل]
    H --> I{مشكلة تقنية؟}
    I -->|نعم| J[اقتراح صيانة]
    I -->|لا| K[تعديل نمط القيادة]
    F -->|لا| L[تحديث التنبؤات]
    J --> L
    K --> L
    L --> M[حفظ البيانات]
    M --> N[عرض التقرير]
    N --> End([نهاية])`
    },
    "customer-usecases": {
      title: "حالات الاستخدام - تطبيق العملاء",
      icon: Users,
      description: "جميع حالات الاستخدام لتطبيق العملاء",
      code: `graph TB
    subgraph "تطبيق العملاء"
        subgraph "إدارة الحساب"
            UC1[التسجيل]
            UC2[تسجيل الدخول]
            UC3[تحديث الملف الشخصي]
            UC4[التحقق من الهوية]
            UC5[إضافة مركبة]
        end
        
        subgraph "تعبئة الوقود"
            UC6[طلب تعبئة]
            UC7[اختيار خطة التقسيط]
            UC8[عرض QR التعبئة]
            UC9[تأكيد التعبئة]
            UC10[استعراض الفواتير]
        end
        
        subgraph "المدفوعات"
            UC11[شحن المحفظة]
            UC12[سداد قسط]
            UC13[عرض سجل المدفوعات]
        end
        
        subgraph "تخطيط الرحلات"
            UC15[إنشاء رحلة]
            UC16[البحث عن محطات]
            UC17[حساب تكلفة الرحلة]
        end
        
        subgraph "سنافي AI"
            UC19[رفع صورة العداد]
            UC20[عرض تحليل الاستهلاك]
            UC21[الحصول على توصيات]
        end
    end
    
    Customer((العميل)) --> UC1
    Customer --> UC6
    Customer --> UC11
    Customer --> UC15
    Customer --> UC19
    
    Fleet((مدير الأسطول)) --> UC5
    Fleet --> UC10
    Fleet --> UC13`
    },
    "business-usecases": {
      title: "حالات الاستخدام - تطبيق البزنس",
      icon: Building2,
      description: "جميع حالات الاستخدام لتطبيق الشركاء",
      code: `graph TB
    subgraph "تطبيق البزنس والشركاء"
        subgraph "إدارة المحطات"
            BU1[تسجيل محطة جديدة]
            BU2[تحديث بيانات المحطة]
            BU3[إدارة أسعار الوقود]
            BU4[إدارة المخزون]
            BU5[عرض المبيعات]
        end
        
        subgraph "العمليات اليومية"
            BU9[مسح QR العميل]
            BU10[تأكيد التعبئة]
            BU11[معالجة الإرجاع]
        end
        
        subgraph "التقارير والتحليلات"
            BU12[تقرير المبيعات]
            BU13[تقرير العمولات]
            BU14[تحليل الأداء]
            BU15[تصدير البيانات]
        end
        
        subgraph "الإدارة المالية"
            BU19[عرض المستحقات]
            BU20[طلب صرف]
            BU21[عرض الفواتير]
        end
    end
    
    Owner((مالك المحطة)) --> BU1
    Owner --> BU3
    Owner --> BU12
    Owner --> BU19
    
    Employee((موظف المحطة)) --> BU9
    Employee --> BU10
    
    Accountant((المحاسب)) --> BU13
    Accountant --> BU20
    Accountant --> BU21`
    },
    "fuel-request-state": {
      title: "حالات طلب التعبئة",
      icon: GitBranch,
      description: "مخطط الحالة لدورة حياة طلب التعبئة",
      code: `stateDiagram-v2
    [*] --> Draft: إنشاء الطلب
    Draft --> PendingApproval: إرسال للموافقة
    PendingApproval --> Approved: موافقة سنافي
    PendingApproval --> Rejected: رفض سنافي
    Rejected --> [*]
    Approved --> Active: تفعيل QR
    Active --> Completed: تمت التعبئة
    Active --> Expired: انتهاء الصلاحية
    Active --> Cancelled: إلغاء العميل
    Expired --> [*]
    Cancelled --> [*]
    Completed --> [*]`
    },
    "invoice-state": {
      title: "حالات الفاتورة",
      icon: GitBranch,
      description: "مخطط الحالة لدورة حياة الفاتورة",
      code: `stateDiagram-v2
    [*] --> Active: إنشاء الفاتورة
    Active --> PartiallyPaid: دفع جزئي
    PartiallyPaid --> PartiallyPaid: دفع قسط
    PartiallyPaid --> Paid: دفع كامل
    Active --> Paid: دفع كامل مباشر
    Active --> Overdue: تجاوز موعد السداد
    PartiallyPaid --> Overdue: تجاوز موعد السداد
    Overdue --> PartiallyPaid: دفع جزئي
    Overdue --> Paid: دفع كامل
    Overdue --> Defaulted: 90 يوم تأخير
    Paid --> [*]
    Defaulted --> Collections: تحويل للتحصيل
    Collections --> Paid: تسوية
    Collections --> WrittenOff: شطب
    WrittenOff --> [*]`
    },
    "erd": {
      title: "مخطط قاعدة البيانات الشامل",
      icon: Database,
      description: "مخطط علاقات الكيانات (ERD) لكل الجداول",
      code: `erDiagram
    USERS ||--o{ VEHICLES : owns
    USERS ||--|| WALLETS : has
    USERS ||--o{ KYC_DOCUMENTS : submits
    VEHICLES ||--o{ TANK_MEASUREMENTS : records
    VEHICLES ||--o{ FUEL_REQUESTS : makes
    USERS ||--o{ INVOICES : has
    INVOICES ||--o{ PAYMENTS : receives
    FUEL_REQUESTS ||--|| INVOICES : generates
    PARTNERS ||--o{ FUEL_STATIONS : owns
    FUEL_STATIONS ||--o{ STATION_EMPLOYEES : employs
    FUEL_STATIONS ||--o{ FUEL_INVENTORY : stocks
    FUEL_STATIONS ||--o{ FUEL_REQUESTS : serves
    USERS ||--o{ JOURNEYS : plans
    JOURNEYS ||--o{ JOURNEY_STOPS : includes
    JOURNEY_STOPS }o--|| FUEL_STATIONS : at
    USERS ||--o{ SNAFI_APPROVALS : receives
    TANK_MEASUREMENTS ||--o{ AI_PREDICTIONS : generates
    USERS ||--o{ NOTIFICATIONS : receives

    USERS {
        uuid id PK
        string phone UK
        string email UK
        string full_name
        string national_id UK
        enum user_type
        enum status
        decimal credit_limit
        int credit_score
    }

    VEHICLES {
        uuid id PK
        uuid user_id FK
        string plate_number UK
        string make
        string model
        decimal tank_capacity
        decimal avg_consumption
    }

    INVOICES {
        uuid id PK
        uuid user_id FK
        string invoice_number UK
        decimal total_amount
        decimal paid_amount
        int installment_months
        enum status
    }

    FUEL_STATIONS {
        uuid id PK
        uuid partner_id FK
        string name
        string address
        decimal latitude
        decimal longitude
        boolean is_active
    }

    PARTNERS {
        uuid id PK
        string company_name
        string commercial_reg UK
        enum partner_type
        decimal commission_rate
        enum status
    }`
    },
    "sequence-fuel": {
      title: "تسلسل عملية التعبئة",
      icon: Route,
      description: "مخطط التسلسل لعملية التعبئة الكاملة",
      code: `sequenceDiagram
    autonumber
    participant C as العميل
    participant App as تطبيق العملاء
    participant API as API Gateway
    participant Snafi as سنافي AI
    participant Billing as خدمة الفوترة
    participant DB as قاعدة البيانات
    participant Station as تطبيق المحطة

    C->>App: فتح التطبيق
    App->>API: GET /api/stations/nearby
    API->>DB: استعلام المحطات
    DB-->>API: قائمة المحطات
    API-->>App: عرض المحطات

    C->>App: اختيار محطة وكمية
    App->>API: POST /api/fuel-requests
    API->>Snafi: تحليل طلب التمويل

    Note over Snafi: تحليل Claude AI

    Snafi-->>API: موافقة/رفض
    API->>Billing: إنشاء فاتورة
    Billing->>DB: INSERT INTO invoices
    Billing-->>API: invoice_id, qr_code
    API-->>App: عرض QR

    C->>Station: إظهار QR
    Station->>API: GET /api/fuel-requests/qr
    API-->>Station: تفاصيل الطلب
    Station->>API: POST /complete
    API-->>App: إشعار التعبئة`
    }
  };

  return (
    <div className="min-h-full p-6 space-y-6" dir="rtl">
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FileCode className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-design-title">تحليل وتصميم النظام</h1>
              <p className="text-muted-foreground">مخططات شاملة لتطبيق العملاء وتطبيق البزنس</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{Object.keys(diagrams).length} مخطط</Badge>
            <Badge variant="outline">Mermaid.js</Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-2 bg-muted/50">
          {Object.entries(diagrams).map(([key, diagram]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-1 text-xs sm:text-sm" data-testid={`tab-${key}`}>
              <diagram.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">{diagram.title.split(" ").slice(0, 2).join(" ")}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(diagrams).map(([key, diagram]) => (
          <TabsContent key={key} value={key} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <diagram.icon className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                      {diagram.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{diagram.description}</CardDescription>
                  </div>
                  <Badge variant="outline">Mermaid Diagram</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="mermaid-diagram overflow-x-auto bg-card p-4 rounded-lg border min-h-[400px] flex items-center justify-center"
                  data-code={diagram.code}
                  data-testid={`diagram-${key}`}
                >
                  <div className="text-muted-foreground animate-pulse">جاري تحميل المخطط...</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">18</div>
              <div className="text-sm text-muted-foreground">جدول في قاعدة البيانات</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">45+</div>
              <div className="text-sm text-muted-foreground">حالة استخدام</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">5</div>
              <div className="text-sm text-muted-foreground">عمليات BPMN</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">60+</div>
              <div className="text-sm text-muted-foreground">نقطة API</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
