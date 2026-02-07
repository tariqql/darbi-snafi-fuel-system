# تحليل وتصميم نظام عبّ الآن - الوثيقة الشاملة

## المحتويات
1. [نظرة عامة على النظام](#overview)
2. [تحليل أصحاب المصلحة](#stakeholders)
3. [نمذجة العمليات التجارية](#business-processes)
4. [حالات الاستخدام - تطبيق العملاء](#customer-use-cases)
5. [حالات الاستخدام - تطبيق البزنس](#business-use-cases)
6. [تصميم قاعدة البيانات](#database-design)
7. [مخططات التسلسل](#sequence-diagrams)
8. [تصميم واجهات API](#api-design)
9. [مخططات الحالة](#state-diagrams)

---

<a name="overview"></a>
## 1. نظرة عامة على النظام

### 1.1 رؤية المشروع
**"عبّ الآن وادفع لاحقاً"** - نظام متكامل لتقسيط وقود السيارات يهدف إلى تسهيل حصول العملاء على الوقود مع خيارات دفع مرنة.

### 1.2 التطبيقات الرئيسية

```mermaid
graph TB
    subgraph "منظومة عبّ الآن"
        subgraph "تطبيق العملاء 📱"
            CA[تعبئة الوقود بالتقسيط]
            CB[تخطيط الرحلات]
            CC[محرك سنافي AI]
            CD[المحفظة والمدفوعات]
        end
        
        subgraph "تطبيق البزنس 💼"
            BA[إدارة المحطات]
            BB[لوحة التحكم]
            BC[إدارة الشركاء]
            BD[التقارير والتحليلات]
        end
        
        subgraph "الخدمات المشتركة ⚙️"
            S1[خدمة الفوترة]
            S2[خدمة الرحلات]
            S3[محرك سنافي AI]
            S4[خدمة الإشعارات]
        end
    end
    
    CA --> S1
    CB --> S2
    CC --> S3
    BA --> S1
    BB --> S1
```

### 1.3 الأهداف الاستراتيجية

| الهدف | الوصف | مؤشر الأداء |
|-------|-------|-------------|
| تسهيل التمويل | توفير تقسيط مرن للوقود | 80% معدل القبول |
| تحسين التجربة | تطبيق سهل الاستخدام | تقييم 4.5+ |
| ذكاء اصطناعي | تنبؤات دقيقة للاستهلاك | دقة 90%+ |
| توسع الشراكات | شبكة محطات واسعة | 500+ محطة |

---

<a name="stakeholders"></a>
## 2. تحليل أصحاب المصلحة (Stakeholders)

### 2.1 مخطط أصحاب المصلحة

```mermaid
graph TB
    subgraph "أصحاب المصلحة الأساسيين"
        C[العميل/السائق 🚗]
        S[محطة الوقود ⛽]
        P[الشريك التجاري 🤝]
        A[مدير النظام 👨‍💼]
    end
    
    subgraph "أصحاب المصلحة الثانويين"
        B[البنوك 🏦]
        I[شركات التأمين 📋]
        G[الجهات الحكومية 🏛️]
        T[شركات النقل 🚛]
    end
    
    subgraph "النظام"
        SYS[منظومة عبّ الآن]
    end
    
    C --> SYS
    S --> SYS
    P --> SYS
    A --> SYS
    SYS --> B
    SYS --> I
    SYS --> G
    T --> SYS
```

### 2.2 تفاصيل الفاعلين (Actors)

#### تطبيق العملاء 📱

| الفاعل | الوصف | الصلاحيات |
|--------|-------|----------|
| **عميل فردي** | سائق يريد تعبئة وقود بالتقسيط | تعبئة، دفع، تخطيط رحلات |
| **عميل أسطول** | مدير أسطول سيارات | إدارة متعددة، تقارير |
| **ضيف** | مستخدم غير مسجل | استعراض المحطات فقط |

#### تطبيق البزنس 💼

| الفاعل | الوصف | الصلاحيات |
|--------|-------|----------|
| **مالك المحطة** | صاحب محطة وقود | إدارة المحطة، المبيعات |
| **موظف المحطة** | عامل في المحطة | تنفيذ التعبئة |
| **شريك تجاري** | شركة شريكة (تأمين، بنك) | عروض، تمويل |
| **مدير النظام** | مسؤول إداري | كامل الصلاحيات |
| **محاسب** | مسؤول مالي | التقارير المالية |

---

<a name="business-processes"></a>
## 3. نمذجة العمليات التجارية (BPMN)

### 3.1 العملية الرئيسية: طلب تعبئة وقود بالتقسيط

```mermaid
flowchart TD
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
    Q --> End2([نهاية ناجحة])
```

### 3.2 عملية سداد الأقساط

```mermaid
flowchart TD
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
    N --> End2([تصعيد للتحصيل])
```

### 3.3 عملية تخطيط الرحلة

```mermaid
flowchart TD
    Start([بداية]) --> A[العميل يحدد الوجهة]
    A --> B[حساب المسافة]
    B --> C[تقدير استهلاك الوقود]
    C --> D[البحث عن المحطات على المسار]
    D --> E{محطات متاحة؟}
    E -->|لا| F[اقتراح مسار بديل]
    F --> G{قبول البديل؟}
    G -->|نعم| D
    G -->|لا| End1([إنهاء])
    E -->|نعم| H[ترتيب المحطات حسب السعر]
    H --> I[عرض الخيارات للعميل]
    I --> J[العميل يختار المحطات]
    J --> K[حفظ خطة الرحلة]
    K --> L[إرسال إشعارات التذكير]
    L --> End2([نهاية])
```

### 3.4 عملية تسجيل محطة جديدة (تطبيق البزنس)

```mermaid
flowchart TD
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
    N --> End2([نهاية])
```

### 3.5 عملية قياس الخزان بالذكاء الاصطناعي (سنافي)

```mermaid
flowchart TD
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
    N --> End([نهاية])
```

---

<a name="customer-use-cases"></a>
## 4. حالات الاستخدام - تطبيق العملاء

### 4.1 مخطط حالات الاستخدام الشامل

```mermaid
graph TB
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
            UC14[ربط بطاقة ائتمان]
        end
        
        subgraph "تخطيط الرحلات"
            UC15[إنشاء رحلة]
            UC16[البحث عن محطات]
            UC17[حساب تكلفة الرحلة]
            UC18[حفظ المسار المفضل]
        end
        
        subgraph "سنافي AI"
            UC19[رفع صورة العداد]
            UC20[عرض تحليل الاستهلاك]
            UC21[الحصول على توصيات]
            UC22[تتبع صحة المركبة]
        end
        
        subgraph "الإشعارات"
            UC23[استلام التذكيرات]
            UC24[عرض العروض]
        end
    end
    
    Customer((العميل)) --> UC1
    Customer --> UC6
    Customer --> UC11
    Customer --> UC15
    Customer --> UC19
    Customer --> UC23
    
    Fleet((مدير الأسطول)) --> UC5
    Fleet --> UC10
    Fleet --> UC13
```

### 4.2 تفاصيل حالات الاستخدام الرئيسية

#### UC6: طلب تعبئة وقود

| البند | التفاصيل |
|-------|----------|
| **الاسم** | طلب تعبئة وقود بالتقسيط |
| **الفاعل** | العميل المسجل |
| **المتطلبات المسبقة** | حساب مفعل، رصيد ائتماني متاح |
| **المتطلبات اللاحقة** | إنشاء فاتورة، توليد QR |
| **السيناريو الرئيسي** | 1. العميل يفتح شاشة التعبئة<br>2. يختار المحطة<br>3. يحدد الكمية/المبلغ<br>4. يختار خطة التقسيط<br>5. يؤكد الطلب<br>6. يستلم QR |
| **السيناريوهات البديلة** | - رصيد غير كافٍ: عرض خيارات الشحن<br>- رفض سنافي: عرض بدائل |
| **قواعد العمل** | - الحد الأقصى للتعبئة: 500 ريال<br>- التقسيط 3-12 شهر |

#### UC19: رفع صورة العداد (سنافي)

| البند | التفاصيل |
|-------|----------|
| **الاسم** | تحليل صورة عداد الوقود |
| **الفاعل** | العميل |
| **المتطلبات المسبقة** | مركبة مسجلة، كاميرا متاحة |
| **المتطلبات اللاحقة** | تسجيل القراءة، تحديث التنبؤات |
| **السيناريو الرئيسي** | 1. العميل يفتح كاميرا سنافي<br>2. يلتقط صورة العداد<br>3. النظام يعالج الصورة<br>4. يعرض القراءة للتأكيد<br>5. يحفظ البيانات<br>6. يعرض التحليل |
| **السيناريوهات البديلة** | - صورة غير واضحة: طلب إعادة التصوير<br>- قراءة غير منطقية: تأكيد يدوي |

---

<a name="business-use-cases"></a>
## 5. حالات الاستخدام - تطبيق البزنس والشركاء

### 5.1 مخطط حالات الاستخدام الشامل

```mermaid
graph TB
    subgraph "تطبيق البزنس والشركاء"
        subgraph "إدارة المحطات"
            BU1[تسجيل محطة جديدة]
            BU2[تحديث بيانات المحطة]
            BU3[إدارة أسعار الوقود]
            BU4[إدارة المخزون]
            BU5[عرض المبيعات]
        end
        
        subgraph "إدارة الموظفين"
            BU6[إضافة موظف]
            BU7[تعيين صلاحيات]
            BU8[تتبع الأداء]
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
        
        subgraph "إدارة الشراكات"
            BU16[عرض العقد]
            BU17[طلب تعديل العمولة]
            BU18[التواصل مع الدعم]
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
    
    Partner((الشريك التجاري)) --> BU16
    Partner --> BU17
    
    Admin((مدير النظام)) --> BU6
    Admin --> BU14
    Admin --> BU15
    
    Accountant((المحاسب)) --> BU13
    Accountant --> BU20
    Accountant --> BU21
```

### 5.2 تفاصيل حالات الاستخدام الرئيسية

#### BU9: مسح QR العميل

| البند | التفاصيل |
|-------|----------|
| **الاسم** | مسح رمز QR لتعبئة الوقود |
| **الفاعل** | موظف المحطة |
| **المتطلبات المسبقة** | تسجيل دخول الموظف، طلب تعبئة صالح |
| **المتطلبات اللاحقة** | تسجيل التعبئة، تحديث المخزون |
| **السيناريو الرئيسي** | 1. الموظف يفتح الماسح<br>2. يمسح QR العميل<br>3. يتحقق من الكمية<br>4. يبدأ التعبئة<br>5. يؤكد الانتهاء<br>6. يطبع الإيصال |
| **السيناريوهات البديلة** | - QR منتهي: رفض مع رسالة<br>- مبلغ يتجاوز الحد: تعديل الكمية |

#### BU12: تقرير المبيعات

| البند | التفاصيل |
|-------|----------|
| **الاسم** | عرض تقرير مبيعات المحطة |
| **الفاعل** | مالك المحطة، المحاسب |
| **المتطلبات المسبقة** | صلاحيات العرض |
| **السيناريو الرئيسي** | 1. المستخدم يحدد الفترة<br>2. يختار نوع التقرير<br>3. النظام يجمع البيانات<br>4. يعرض الرسوم البيانية<br>5. خيار التصدير PDF/Excel |

---

<a name="database-design"></a>
## 6. تصميم قاعدة البيانات الشاملة

### 6.1 مخطط علاقات الكيانات (ERD)

```mermaid
erDiagram
    %% المستخدمون والحسابات
    USERS ||--o{ VEHICLES : owns
    USERS ||--|| WALLETS : has
    USERS ||--o{ USER_SESSIONS : has
    USERS ||--o{ KYC_DOCUMENTS : submits
    
    %% المركبات والقياسات
    VEHICLES ||--o{ TANK_MEASUREMENTS : records
    VEHICLES ||--o{ FUEL_REQUESTS : makes
    
    %% الفواتير والمدفوعات
    USERS ||--o{ INVOICES : has
    INVOICES ||--o{ PAYMENTS : receives
    INVOICES ||--o{ INVOICE_ITEMS : contains
    FUEL_REQUESTS ||--|| INVOICES : generates
    
    %% المحطات والشركاء
    PARTNERS ||--o{ FUEL_STATIONS : owns
    FUEL_STATIONS ||--o{ STATION_EMPLOYEES : employs
    FUEL_STATIONS ||--o{ FUEL_INVENTORY : stocks
    FUEL_STATIONS ||--o{ FUEL_REQUESTS : serves
    
    %% الرحلات
    USERS ||--o{ JOURNEYS : plans
    JOURNEYS ||--o{ JOURNEY_STOPS : includes
    JOURNEY_STOPS }o--|| FUEL_STATIONS : at
    
    %% سنافي AI
    USERS ||--o{ SNAFI_APPROVALS : receives
    TANK_MEASUREMENTS ||--o{ AI_PREDICTIONS : generates
    
    %% الإشعارات والتنبيهات
    USERS ||--o{ NOTIFICATIONS : receives
    
    %% ===== تعريف الجداول =====
    
    USERS {
        uuid id PK
        string phone UK
        string email UK
        string password_hash
        string full_name
        string national_id UK
        enum user_type "individual|fleet|partner|admin"
        enum status "pending|active|suspended"
        decimal credit_limit
        int credit_score
        datetime created_at
        datetime updated_at
    }
    
    WALLETS {
        uuid id PK
        uuid user_id FK
        decimal balance
        decimal pending_amount
        enum currency "SAR"
        datetime last_transaction
    }
    
    VEHICLES {
        uuid id PK
        uuid user_id FK
        string plate_number UK
        string make
        string model
        int year
        decimal tank_capacity
        decimal avg_consumption
        int odometer_reading
        datetime last_maintenance
    }
    
    PARTNERS {
        uuid id PK
        string company_name
        string commercial_reg UK
        string tax_number UK
        enum partner_type "station_owner|financial|insurance"
        decimal commission_rate
        enum status "pending|active|suspended"
        datetime contract_start
        datetime contract_end
    }
    
    FUEL_STATIONS {
        uuid id PK
        uuid partner_id FK
        string name
        string address
        decimal latitude
        decimal longitude
        string city
        string region
        boolean is_active
        json operating_hours
        json fuel_types
        decimal rating
    }
    
    STATION_EMPLOYEES {
        uuid id PK
        uuid station_id FK
        uuid user_id FK
        enum role "manager|cashier|attendant"
        datetime hired_at
        boolean is_active
    }
    
    FUEL_INVENTORY {
        uuid id PK
        uuid station_id FK
        enum fuel_type "91|95|diesel"
        decimal current_stock
        decimal price_per_liter
        datetime last_updated
    }
    
    FUEL_REQUESTS {
        uuid id PK
        uuid user_id FK
        uuid vehicle_id FK
        uuid station_id FK
        decimal amount_liters
        decimal total_price
        enum fuel_type "91|95|diesel"
        string qr_code UK
        enum status "pending|approved|completed|cancelled|expired"
        datetime expires_at
        datetime completed_at
    }
    
    INVOICES {
        uuid id PK
        uuid user_id FK
        uuid fuel_request_id FK
        string invoice_number UK
        decimal total_amount
        decimal paid_amount
        int installment_months
        decimal monthly_amount
        enum status "active|paid|overdue|defaulted"
        datetime due_date
        datetime created_at
    }
    
    INVOICE_ITEMS {
        uuid id PK
        uuid invoice_id FK
        string description
        decimal quantity
        decimal unit_price
        decimal total
    }
    
    PAYMENTS {
        uuid id PK
        uuid invoice_id FK
        uuid wallet_id FK
        decimal amount
        enum payment_method "wallet|card|bank_transfer"
        string transaction_ref UK
        enum status "pending|completed|failed|refunded"
        datetime paid_at
    }
    
    JOURNEYS {
        uuid id PK
        uuid user_id FK
        string title
        string start_location
        string end_location
        decimal total_distance
        decimal estimated_fuel
        decimal estimated_cost
        datetime planned_date
        enum status "planned|in_progress|completed|cancelled"
    }
    
    JOURNEY_STOPS {
        uuid id PK
        uuid journey_id FK
        uuid station_id FK
        int stop_order
        decimal distance_from_start
        boolean is_fuel_stop
        datetime estimated_arrival
    }
    
    TANK_MEASUREMENTS {
        uuid id PK
        uuid vehicle_id FK
        decimal fuel_level
        int odometer
        string image_url
        decimal ai_confidence
        datetime measured_at
    }
    
    AI_PREDICTIONS {
        uuid id PK
        uuid measurement_id FK
        uuid vehicle_id FK
        decimal predicted_consumption
        decimal remaining_range
        datetime next_refuel_date
        json recommendations
        datetime created_at
    }
    
    SNAFI_APPROVALS {
        uuid id PK
        uuid user_id FK
        uuid fuel_request_id FK
        int risk_score
        decimal approved_amount
        string ai_reasoning
        enum decision "approved|rejected|manual_review"
        datetime decided_at
    }
    
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string title
        string body
        enum type "payment_due|offer|system|fuel_low"
        boolean is_read
        json data
        datetime sent_at
    }
    
    KYC_DOCUMENTS {
        uuid id PK
        uuid user_id FK
        enum doc_type "national_id|driving_license|address_proof"
        string file_url
        enum status "pending|verified|rejected"
        string rejection_reason
        datetime uploaded_at
        datetime verified_at
    }
    
    USER_SESSIONS {
        uuid id PK
        uuid user_id FK
        string device_id
        string device_type
        string ip_address
        datetime last_active
        datetime expires_at
    }
```

### 6.2 قاموس البيانات

#### جدول المستخدمين (USERS)

| الحقل | النوع | القيود | الوصف |
|-------|-------|--------|-------|
| id | UUID | PK | معرف فريد |
| phone | VARCHAR(15) | UNIQUE, NOT NULL | رقم الجوال |
| email | VARCHAR(100) | UNIQUE | البريد الإلكتروني |
| password_hash | VARCHAR(255) | NOT NULL | كلمة المرور المشفرة |
| full_name | VARCHAR(100) | NOT NULL | الاسم الكامل |
| national_id | VARCHAR(10) | UNIQUE | رقم الهوية |
| user_type | ENUM | NOT NULL | نوع المستخدم |
| status | ENUM | DEFAULT 'pending' | حالة الحساب |
| credit_limit | DECIMAL(10,2) | DEFAULT 0 | الحد الائتماني |
| credit_score | INT | DEFAULT 500 | درجة الائتمان |

#### جدول الفواتير (INVOICES)

| الحقل | النوع | القيود | الوصف |
|-------|-------|--------|-------|
| id | UUID | PK | معرف فريد |
| user_id | UUID | FK → USERS | العميل |
| invoice_number | VARCHAR(20) | UNIQUE | رقم الفاتورة |
| total_amount | DECIMAL(10,2) | NOT NULL | المبلغ الإجمالي |
| paid_amount | DECIMAL(10,2) | DEFAULT 0 | المبلغ المدفوع |
| installment_months | INT | CHECK 1-12 | عدد الأقساط |
| monthly_amount | DECIMAL(10,2) | | القسط الشهري |
| status | ENUM | DEFAULT 'active' | حالة الفاتورة |

---

<a name="sequence-diagrams"></a>
## 7. مخططات التسلسل (Sequence Diagrams)

### 7.1 تسلسل عملية التعبئة الكاملة

```mermaid
sequenceDiagram
    autonumber
    participant C as العميل 📱
    participant App as تطبيق العملاء
    participant API as API Gateway
    participant Snafi as سنافي AI 🤖
    participant Billing as خدمة الفوترة
    participant DB as قاعدة البيانات
    participant Station as تطبيق المحطة
    participant Employee as موظف المحطة
    
    C->>App: فتح التطبيق
    App->>API: GET /api/stations/nearby
    API->>DB: استعلام المحطات القريبة
    DB-->>API: قائمة المحطات
    API-->>App: عرض المحطات
    
    C->>App: اختيار محطة وكمية
    App->>API: POST /api/fuel-requests
    API->>Snafi: تحليل طلب التمويل
    
    Note over Snafi: تحليل Claude AI:<br/>- سجل السداد<br/>- درجة الائتمان<br/>- نمط الاستهلاك
    
    Snafi-->>API: {approved: true, limit: 500}
    API->>Billing: إنشاء فاتورة
    Billing->>DB: INSERT INTO invoices
    Billing->>DB: INSERT INTO fuel_requests
    DB-->>Billing: تأكيد الإنشاء
    Billing-->>API: {invoice_id, qr_code}
    API-->>App: عرض QR
    
    Note over C,App: العميل يتوجه للمحطة
    
    C->>Employee: إظهار QR
    Employee->>Station: مسح QR
    Station->>API: GET /api/fuel-requests/{qr}
    API->>DB: التحقق من صلاحية الطلب
    DB-->>API: تفاصيل الطلب
    API-->>Station: {valid: true, amount: 50L}
    
    Employee->>Station: تأكيد التعبئة
    Station->>API: POST /api/fuel-requests/{id}/complete
    API->>Billing: تحديث حالة الفاتورة
    Billing->>DB: UPDATE fuel_requests SET status='completed'
    DB-->>Billing: تم التحديث
    
    API-->>Station: تأكيد الإتمام
    API-->>App: إشعار التعبئة
    App-->>C: تم بنجاح! ✅
```

### 7.2 تسلسل تحليل سنافي AI

```mermaid
sequenceDiagram
    autonumber
    participant C as العميل
    participant App as التطبيق
    participant API as API Gateway
    participant Snafi as خدمة سنافي
    participant Claude as Claude AI 🧠
    participant DB as قاعدة البيانات
    
    C->>App: رفع صورة العداد
    App->>API: POST /api/tank-measurements
    Note over App,API: multipart/form-data<br/>image + vehicle_id
    
    API->>Snafi: معالجة الصورة
    Snafi->>Snafi: OCR - استخراج القراءة
    
    Snafi->>DB: SELECT آخر قراءة
    DB-->>Snafi: {reading: 45000, fuel: 30L}
    
    Snafi->>Snafi: حساب الاستهلاك الفعلي
    Note over Snafi: المسافة: 500 كم<br/>الوقود: 40 لتر<br/>المعدل: 8 كم/لتر
    
    Snafi->>Claude: تحليل نمط الاستهلاك
    Note over Claude: Prompt:<br/>"حلل استهلاك وقود مركبة<br/>المعدل: 8 كم/لتر<br/>المتوقع: 10 كم/لتر<br/>الانحراف: 20%"
    
    Claude-->>Snafi: {<br/>  "analysis": "استهلاك أعلى من المعتاد",<br/>  "causes": ["ضغط إطارات", "قيادة عدوانية"],<br/>  "recommendations": [...]<br/>}
    
    Snafi->>DB: INSERT INTO tank_measurements
    Snafi->>DB: INSERT INTO ai_predictions
    DB-->>Snafi: تم الحفظ
    
    Snafi-->>API: التقرير الكامل
    API-->>App: عرض النتائج
    App-->>C: 📊 تقرير الاستهلاك
```

### 7.3 تسلسل تسجيل محطة جديدة

```mermaid
sequenceDiagram
    autonumber
    participant O as مالك المحطة
    participant BApp as تطبيق البزنس
    participant API as API Gateway
    participant Admin as لوحة الإدارة
    participant A as مدير النظام
    participant DB as قاعدة البيانات
    
    O->>BApp: تسجيل جديد
    BApp->>API: POST /api/partners/register
    API->>DB: INSERT INTO partners (status='pending')
    DB-->>API: partner_id
    API-->>BApp: رقم الطلب
    
    O->>BApp: إضافة بيانات المحطة
    BApp->>API: POST /api/stations
    API->>DB: INSERT INTO fuel_stations
    
    O->>BApp: رفع المستندات
    BApp->>API: POST /api/kyc-documents
    API->>DB: INSERT INTO kyc_documents
    
    API->>Admin: إشعار طلب جديد 🔔
    A->>Admin: مراجعة الطلب
    Admin->>API: GET /api/partners/{id}/documents
    API->>DB: SELECT documents
    DB-->>API: المستندات
    API-->>Admin: عرض المستندات
    
    alt المستندات كاملة
        A->>Admin: الموافقة
        Admin->>API: PATCH /api/partners/{id} status='active'
        API->>DB: UPDATE partners
        API->>DB: UPDATE fuel_stations SET is_active=true
        API-->>BApp: إشعار القبول ✅
        BApp-->>O: مرحباً بك كشريك!
    else مستندات ناقصة
        A->>Admin: طلب مستندات إضافية
        Admin->>API: POST /api/partners/{id}/request-docs
        API-->>BApp: إشعار المتطلبات
        BApp-->>O: يرجى رفع المستندات التالية...
    end
```

---

<a name="api-design"></a>
## 8. تصميم واجهات API

### 8.1 هيكل API لتطبيق العملاء

#### المصادقة والحسابات

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| POST | /api/auth/register | تسجيل جديد | phone, password, name | user, token |
| POST | /api/auth/login | تسجيل الدخول | phone, password | user, token |
| POST | /api/auth/verify-otp | تأكيد OTP | phone, otp | success |
| GET | /api/users/me | الملف الشخصي | - | user details |
| PATCH | /api/users/me | تحديث الملف | fields to update | updated user |

#### المركبات

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| GET | /api/vehicles | قائمة المركبات | - | vehicles[] |
| POST | /api/vehicles | إضافة مركبة | plate, make, model | vehicle |
| GET | /api/vehicles/:id | تفاصيل المركبة | - | vehicle |
| DELETE | /api/vehicles/:id | حذف مركبة | - | success |

#### طلبات الوقود

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| POST | /api/fuel-requests | طلب تعبئة | station_id, amount, vehicle_id | request, qr_code |
| GET | /api/fuel-requests | قائمة الطلبات | status?, page? | requests[] |
| GET | /api/fuel-requests/:id | تفاصيل الطلب | - | request |
| POST | /api/fuel-requests/:id/cancel | إلغاء الطلب | - | success |

#### الفواتير والمدفوعات

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| GET | /api/invoices | قائمة الفواتير | status?, page? | invoices[] |
| GET | /api/invoices/:id | تفاصيل الفاتورة | - | invoice, payments |
| POST | /api/invoices/:id/pay | سداد قسط | amount, method | payment |
| GET | /api/wallet | رصيد المحفظة | - | balance |
| POST | /api/wallet/topup | شحن المحفظة | amount, method | transaction |

#### الرحلات

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| POST | /api/journeys | إنشاء رحلة | start, end, vehicle_id | journey, stops |
| GET | /api/journeys | قائمة الرحلات | - | journeys[] |
| GET | /api/journeys/:id | تفاصيل الرحلة | - | journey, stops |
| DELETE | /api/journeys/:id | حذف الرحلة | - | success |

#### سنافي AI

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| POST | /api/tank-measurements | رفع قراءة | image, vehicle_id | measurement, prediction |
| GET | /api/tank-measurements | سجل القراءات | vehicle_id | measurements[] |
| GET | /api/predictions | التنبؤات | vehicle_id | predictions[] |
| POST | /api/snafi/analyze | تحليل شامل | vehicle_id | analysis, recommendations |

### 8.2 هيكل API لتطبيق البزنس

#### إدارة المحطات

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| POST | /api/business/stations | تسجيل محطة | station data | station |
| GET | /api/business/stations | محطاتي | - | stations[] |
| PATCH | /api/business/stations/:id | تحديث المحطة | fields | station |
| GET | /api/business/stations/:id/sales | مبيعات المحطة | from, to | sales report |

#### العمليات

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| GET | /api/business/fuel-requests/scan/:qr | مسح QR | - | request details |
| POST | /api/business/fuel-requests/:id/complete | تأكيد التعبئة | actual_amount | success |
| GET | /api/business/transactions | المعاملات | date_range | transactions[] |

#### التقارير

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| GET | /api/business/reports/sales | تقرير المبيعات | period | sales data |
| GET | /api/business/reports/commission | تقرير العمولات | period | commission data |
| GET | /api/business/reports/export | تصدير التقارير | type, format | file URL |

#### إدارة الموظفين

| Method | Endpoint | الوصف | المدخلات | المخرجات |
|--------|----------|-------|----------|----------|
| GET | /api/business/employees | قائمة الموظفين | station_id | employees[] |
| POST | /api/business/employees | إضافة موظف | user_id, role | employee |
| PATCH | /api/business/employees/:id | تحديث صلاحيات | role | employee |
| DELETE | /api/business/employees/:id | إزالة موظف | - | success |

### 8.3 نموذج الاستجابة الموحد

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "message": "تم بنجاح"
}
```

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "الرصيد غير كافٍ",
    "details": {
      "required": 500,
      "available": 200
    }
  }
}
```

---

<a name="state-diagrams"></a>
## 9. مخططات الحالة (State Diagrams)

### 9.1 حالات طلب التعبئة

```mermaid
stateDiagram-v2
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
    Completed --> [*]
```

### 9.2 حالات الفاتورة

```mermaid
stateDiagram-v2
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
    WrittenOff --> [*]
```

### 9.3 حالات حساب المستخدم

```mermaid
stateDiagram-v2
    [*] --> Pending: تسجيل جديد
    Pending --> KYCRequired: تأكيد الجوال
    KYCRequired --> UnderReview: رفع المستندات
    UnderReview --> Active: موافقة KYC
    UnderReview --> KYCRejected: رفض المستندات
    KYCRejected --> KYCRequired: إعادة الرفع
    Active --> Suspended: مخالفة/تأخر سداد
    Suspended --> Active: تسوية
    Active --> Closed: إغلاق الحساب
    Suspended --> Closed: إغلاق
    Closed --> [*]
```

### 9.4 حالات المحطة

```mermaid
stateDiagram-v2
    [*] --> ApplicationSubmitted: تقديم طلب
    ApplicationSubmitted --> DocumentsReview: مراجعة أولية
    DocumentsReview --> SiteVisit: مستندات كاملة
    DocumentsReview --> DocumentsRequired: مستندات ناقصة
    DocumentsRequired --> DocumentsReview: إعادة الرفع
    SiteVisit --> ContractSigning: اجتياز المعاينة
    SiteVisit --> ImprovementRequired: ملاحظات
    ImprovementRequired --> SiteVisit: إعادة المعاينة
    ContractSigning --> Active: توقيع العقد
    Active --> TemporarilyClosed: إغلاق مؤقت
    TemporarilyClosed --> Active: إعادة الفتح
    Active --> Terminated: إنهاء الشراكة
    Terminated --> [*]
```

---

## 10. ملخص التصميم

### المكونات الأساسية

| المكون | الوصف | التقنيات |
|--------|-------|----------|
| تطبيق العملاء | تطبيق جوال للعملاء | React Native / Flutter |
| تطبيق البزنس | تطبيق ويب للشركاء | React + TypeScript |
| API Gateway | نقطة الدخول الموحدة | Express.js |
| خدمة الفوترة | إدارة الفواتير والمدفوعات | Node.js + PostgreSQL |
| خدمة الرحلات | تخطيط المسارات | Node.js + Maps API |
| محرك سنافي | الذكاء الاصطناعي | Claude AI + OCR |
| قاعدة البيانات | التخزين الدائم | PostgreSQL |

### عدد الكيانات
- **18 جدول** في قاعدة البيانات
- **5 مخططات BPMN** للعمليات
- **45+ حالة استخدام** موزعة على التطبيقين
- **60+ نقطة API** موثقة

---

*تم إنشاء هذه الوثيقة باستخدام Claude AI لنظام عبّ الآن*
*آخر تحديث: فبراير 2026*
