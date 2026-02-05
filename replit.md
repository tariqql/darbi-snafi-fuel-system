# دربي (Darby) - نظام تقسيط وقود السيارات BNPL

## نظرة عامة
نظام متكامل لتقسيط وقود السيارات مطابق لمنصات BNPL مثل تمارا وتابي. يتكون من ثلاث خدمات رئيسية:

### كتالوج السيارات الشامل
**400 سيارة** من **64 ماركة** عالمية بما في ذلك:
- السيارات الأمريكية: Ford, Mercury (Grand Marquis), Lincoln (Town Car), Chevrolet, GMC, Cadillac, Dodge, Chrysler, Jeep, Buick, Pontiac, Oldsmobile, Hummer
- السيارات اليابانية: Toyota, Nissan, Honda, Mazda, Mitsubishi, Lexus, Infiniti, Suzuki, Subaru, Isuzu
- السيارات الكورية: Hyundai, Kia, Genesis, SsangYong
- السيارات الألمانية: BMW, Mercedes-Benz, Audi, Volkswagen, Porsche
- السيارات الصينية: Geely, Chery, Haval, MG, Changan, GAC, BYD, Great Wall, JAC, FAW
- السيارات الفاخرة: Rolls-Royce, Bentley, Ferrari, Lamborghini, Maserati, Aston Martin, McLaren
- السيارات الأوروبية: Volvo, Jaguar, Land Rover, Peugeot, Renault, Citroen, Fiat, Alfa Romeo, Skoda, SEAT, Opel

1. **خدمة تقسيط الفواتير** - إدارة فواتير الوقود وخطط التقسيط
2. **صمم رحلتك** - تخطيط المسارات ومحطات التوقف
3. **محرك سنافي** - ذكاء اصطناعي لقياس وتحليل استهلاك الوقود

## البنية التقنية

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + Shadcn UI
- TanStack Query للتعامل مع البيانات
- Wouter للتوجيه
- دعم كامل للغة العربية (RTL)

### Backend
- Express.js + TypeScript
- PostgreSQL مع Drizzle ORM
- RESTful APIs

### هيكل الملفات
```
client/
  src/
    pages/        # صفحات التطبيق
    components/   # المكونات المشتركة
    hooks/        # Hooks مخصصة
    lib/          # مكتبات مساعدة
server/
  index.ts        # نقطة الدخول
  routes.ts       # مسارات API
  storage.ts      # طبقة التخزين
  db.ts           # اتصال قاعدة البيانات
  seed.ts         # بيانات تجريبية
shared/
  schema.ts       # مخططات قاعدة البيانات
```

## نقاط API

### الفواتير
- `GET /api/invoices` - جلب جميع الفواتير
- `POST /api/invoices` - إنشاء فاتورة جديدة
- `POST /api/invoices/:id/pay` - سداد قسط

### الرحلات
- `GET /api/journeys` - جلب خطط الرحلات
- `POST /api/journeys` - إنشاء رحلة جديدة
- `DELETE /api/journeys/:id` - حذف رحلة

### محطات الوقود
- `GET /api/stations` - جلب المحطات المتاحة

### قياسات الخزان (سنافي)
- `GET /api/tank-measurements` - جلب القراءات
- `POST /api/tank-measurements` - تسجيل قراءة جديدة

### تنبؤات سنافي
- `GET /api/predictions` - جلب التنبؤات

### محرك سنافي لدعم القرار الذكي (Decision Support)
نظام ذكي يحول قرارات شراء الوقود من توقعات بسيطة إلى توصيات مبنية على البيانات.

#### نقاط API
- `POST /api/snafi/decision` - إنشاء جلسة دعم قرار جديدة والحصول على توصية
- `POST /api/snafi/decision/accept` - قبول التوصية وربطها بالفاتورة
- `POST /api/snafi/decision/complete` - تسجيل التعبئة الفعلية وحساب دقة التنبؤ
- `GET /api/snafi/decision/:decisionSupportId` - جلب جلسة محددة
- `GET /api/snafi/sessions/:userId` - جلب جلسات المستخدم
- `GET /api/snafi/accuracy/:userId` - إحصائيات دقة النظام
- `GET /api/snafi/fuel-price/:fuelType` - الحصول على سعر الوقود الحالي
- `POST /api/snafi/fuel-price` - تحديث سعر الوقود (للإدارة)

#### الجداول الجديدة
```
refueling_history          # سجل التعبئة التاريخي
decision_support_sessions  # جلسات دعم القرار
prediction_accuracy_records # سجلات دقة التنبؤ
fuel_prices                # أسعار الوقود
```

#### خوارزمية التوصية
1. **المطابقة التاريخية**: مقارنة نسبة الوقود الحالية (±10%) مع سجلات التعبئة الناجحة
2. **حساب الثقة**: Base 50 + (عدد السجلات × 3) + (معدل النجاح × 0.2) (حد أقصى 95)
3. **التعلم المستمر**: تسجيل دقة كل توصية لتحسين المستقبلية

#### أسعار الوقود الافتراضية (ريال سعودي)
- بنزين 91: 2.18
- بنزين 95: 2.33
- ديزل: 0.52

### نظام Merchant API (شركاء الأعمال)

#### نقاط API للتجار
- `POST /api/merchant/register` - تسجيل تاجر جديد
- `POST /api/merchant/checkout` - إنشاء جلسة دفع (يتطلب Authorization)
- `GET /api/merchant/checkout/:sessionToken` - حالة الجلسة
- `POST /api/merchant/checkout/:sessionToken/cancel` - إلغاء الجلسة
- `GET /api/merchant/stats` - إحصائيات التاجر
- `GET /api/checkout/:sessionToken` - صفحة الدفع للعميل
- `POST /api/checkout/:sessionToken/approve` - موافقة العميل

#### جداول التجار
```
merchants              # بيانات التجار
merchant_api_keys      # مفاتيح API (sandbox/production)
checkout_sessions      # جلسات الدفع
webhook_events         # سجل Webhooks
merchant_transactions  # المعاملات
merchant_settlements   # التسويات
```

#### نظام المصادقة
- Bearer Token مع Secret Key
- مفاتيح Sandbox: pk_test_xxx / sk_test_xxx
- مفاتيح Production: pk_live_xxx / sk_live_xxx

#### Webhook Events
- `checkout.approved` - موافقة العميل
- `checkout.declined` - رفض العميل
- `payment.captured` - تم الدفع
- `refund.completed` - تم الاسترداد
- `installment.paid` - تم سداد قسط
- `installment.overdue` - قسط متأخر

#### نموذج العمولة
- عمولة افتراضية: 3%
- قابلة للتخصيص لكل تاجر
- التسوية بعد خصم العمولة

### نظام التحقق من العملاء (Verification & KYC)

#### التحقق من الهوية (نفاذ)
- `POST /api/verification/nafath/initiate` - بدء التحقق من الهوية
- `GET /api/verification/nafath/status/:requestId` - التحقق من حالة الطلب
- `POST /api/verification/nafath/simulate` - محاكاة التحقق (للتطوير)
- `GET /api/verification/age/:userId` - التحقق من العمر

#### فحص الامتثال (KYC/AML)
- `POST /api/verification/compliance/check` - فحص شامل للامتثال
- `GET /api/verification/compliance/:userId` - آخر فحص امتثال

#### السجل الائتماني (سمة)
- `POST /api/verification/credit/report` - جلب التقرير الائتماني
- `POST /api/verification/credit/evaluate` - تقييم أهلية التمويل
- `GET /api/verification/credit/defaults/:userId` - فحص المتعثرات

#### التوظيف (GOSI)
- `POST /api/verification/employment/verify` - التحقق من التوظيف
- `GET /api/verification/employment/priority/:userId` - حساب أولوية العميل

#### تقييم العميل الشامل
- `POST /api/verification/customer/evaluate` - التقييم الشامل
- `GET /api/verification/customer/rating/:userId` - تقييم العميل
- `GET /api/verification/customer/eligibility/:userId` - فحص سريع للأهلية

## خدمات التحقق (Server Services)

```
server/services/
  nafath.service.ts          # التحقق من الهوية عبر نفاذ
  compliance.service.ts      # فحص الامتثال والقضايا
  credit.service.ts          # السجل الائتماني (سمة)
  employment.service.ts      # بيانات التوظيف (GOSI)
  customer-rating.service.ts # التقييم الشامل
  snafi-decision.service.ts  # محرك سنافي لدعم القرار الذكي
  validation.ts              # مخططات التحقق Zod
  index.ts                   # تصدير جميع الخدمات
```

### نظام الأولويات
- **premium**: موظفو الحكومة (أعلى أولوية)
- **high**: موظفو شبه الحكومي
- **medium**: موظفو القطاع الخاص
- **low**: غير موظفين

### درجات الائتمان (سمة)
- 750+ = ممتاز (excellent)
- 650-749 = جيد (good)
- 550-649 = مقبول (fair)
- 500-549 = ضعيف (poor)
- <500 = مرفوض (rejected)

## تشغيل المشروع
```bash
npm run dev     # تشغيل التطوير
npm run db:push # مزامنة قاعدة البيانات
```

## ملاحظات التصميم
- الألوان الأساسية: برتقالي/ذهبي (موضوع الوقود)
- دعم الوضع الليلي والنهاري
- تصميم متجاوب للجوال والشاشات الكبيرة

## نظام الأمان (Security)

### طبقات الحماية
1. **Rate Limiting**: 10 طلبات/دقيقة لكل IP
2. **Input Sanitization**: إزالة الرموز الخطرة (< > ; ' " --)
3. **ID Validation**: UUID للمحطات، Alphanumeric للمستخدمين
4. **Business Validation**: كمية 1-200 لتر، أقساط 2/3/4/6
5. **Server-Side Pricing**: جميع الحسابات في الخادم
6. **Credit Limit Check**: فحص الائتمان المتاح
7. **ORM Protection**: Drizzle مع parameterized queries

### الهجمات المصدودة
- SQL Injection ✅
- XSS (Cross-Site Scripting) ✅
- Brute Force ✅
- Parameter Tampering ✅
- Price Manipulation ✅

### التقارير
- `docs/SECURITY_REPORT.md` - تقرير اختبارات الأمان الشامل

## نظام الأدوار والصلاحيات (RBAC)

### الأدوار الوظيفية (27 دور مطابق لهيكل تمارا)

#### القيادة التنفيذية
- **CEO**: الرئيس التنفيذي (جميع الصلاحيات)
- **COO**: مدير العمليات التنفيذي
- **CFO**: المدير المالي
- **CPO**: مدير المنتجات

#### الإدارة الوسطى
- **super_admin**: مدير النظام
- **operations_manager**: مدير العمليات
- **finance_manager**: مدير المالية
- **risk_manager**: مدير المخاطر
- **compliance_officer**: مسؤول الامتثال

#### الأقسام التشغيلية
- **customer_service / customer_service_lead**: خدمة العملاء
- **accountant / senior_accountant**: المحاسبة
- **collections / collections_lead**: التحصيل
- **fraud_analyst**: محلل الاحتيال
- **data_analyst**: محلل البيانات

#### إدارة التجار والشراكات
- **merchant_support**: دعم التجار
- **partnerships_manager**: مدير الشراكات

#### إدارة الفروع
- **branch_manager**: مدير الفرع
- **assistant_branch_manager**: مساعد مدير الفرع
- **cashier**: أمين الصندوق

#### الجودة والتدقيق
- **qa_specialist**: أخصائي الجودة
- **auditor / internal_auditor**: المدققين

#### الموارد البشرية
- **hr_manager**: مدير الموارد البشرية
- **training_officer**: مسؤول التدريب

### الأقسام الإدارية (14 قسم)
executive, operations, finance, risk, compliance, customer_service, collections, fraud, data, merchants, branches, quality, audit, hr

### الصلاحيات التفصيلية (50+ صلاحية)
إدارة المستخدمين، إدارة التجار، الفواتير، المالية، المخاطر، الامتثال، الاحتيال، التحصيل، الفروع، نقاط البيع، سير العمل، إعدادات النظام
