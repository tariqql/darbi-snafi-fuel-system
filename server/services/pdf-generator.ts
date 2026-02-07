import puppeteer from "puppeteer-core";
import fs from "fs";

function buildHTML(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    direction: rtl;
    color: #1a1a2e;
    font-size: 12px;
    line-height: 1.8;
  }

  .cover-page {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f0c29 0%, #1a1a3e 40%, #24243e 100%);
    color: white;
    text-align: center;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }

  .cover-page::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 50%, rgba(234, 156, 43, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 70% 20%, rgba(234, 156, 43, 0.1) 0%, transparent 40%);
    z-index: 0;
  }

  .cover-content { position: relative; z-index: 1; }

  .logo-container {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ea9c2b, #d4841a);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 30px;
    box-shadow: 0 0 60px rgba(234, 156, 43, 0.4);
  }

  .logo-text {
    font-size: 42px;
    font-weight: 900;
    color: white;
    letter-spacing: -1px;
  }

  .cover-title {
    font-size: 40px;
    font-weight: 900;
    margin-bottom: 8px;
    background: linear-gradient(to left, #ea9c2b, #f0c060);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .cover-subtitle {
    font-size: 20px;
    font-weight: 300;
    color: rgba(255,255,255,0.85);
    margin-bottom: 40px;
  }

  .cover-badge {
    display: inline-block;
    background: rgba(234, 156, 43, 0.2);
    border: 1px solid rgba(234, 156, 43, 0.5);
    color: #f0c060;
    padding: 8px 28px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 20px;
  }

  .cover-doc-title {
    font-size: 22px;
    font-weight: 700;
    margin-top: 40px;
    color: white;
  }

  .cover-doc-sub {
    font-size: 14px;
    color: rgba(255,255,255,0.6);
    margin-top: 6px;
  }

  .cover-footer {
    position: absolute;
    bottom: 40px;
    left: 0;
    right: 0;
    text-align: center;
    color: rgba(255,255,255,0.4);
    font-size: 11px;
    z-index: 1;
  }

  .page {
    padding: 50px 60px;
    page-break-after: always;
    min-height: 100vh;
  }

  .page:last-child { page-break-after: auto; }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #ea9c2b;
    padding-bottom: 12px;
    margin-bottom: 30px;
  }

  .page-header-logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .page-header-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ea9c2b, #d4841a);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 900;
    font-size: 16px;
  }

  .page-header-brand {
    font-size: 16px;
    font-weight: 800;
    color: #ea9c2b;
  }

  .page-header-section {
    font-size: 11px;
    color: #666;
    font-weight: 400;
  }

  .section-title {
    font-size: 22px;
    font-weight: 800;
    color: #1a1a2e;
    margin-bottom: 8px;
    padding-right: 14px;
    border-right: 4px solid #ea9c2b;
  }

  .section-subtitle {
    font-size: 16px;
    font-weight: 700;
    color: #333;
    margin-top: 22px;
    margin-bottom: 10px;
  }

  .section-desc {
    color: #444;
    margin-bottom: 16px;
    font-size: 12.5px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 11.5px;
  }

  table thead th {
    background: linear-gradient(135deg, #1a1a2e, #24243e);
    color: #f0c060;
    padding: 10px 14px;
    text-align: right;
    font-weight: 700;
    font-size: 11px;
  }

  table thead th:first-child { border-radius: 0 8px 0 0; }
  table thead th:last-child { border-radius: 8px 0 0 0; }

  table tbody td {
    padding: 9px 14px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }

  table tbody tr:nth-child(even) { background: #f9f8f5; }
  table tbody tr:hover { background: #fef7e8; }

  .highlight-box {
    background: linear-gradient(135deg, #fef9f0, #fff8e8);
    border: 1px solid #f0d89a;
    border-radius: 10px;
    padding: 18px 22px;
    margin: 16px 0;
  }

  .flow-diagram {
    background: #f8f9fc;
    border: 1px solid #e0e4ea;
    border-radius: 10px;
    padding: 20px;
    margin: 16px 0;
    text-align: center;
    direction: ltr;
  }

  .flow-step {
    display: inline-block;
    background: white;
    border: 2px solid #ea9c2b;
    border-radius: 8px;
    padding: 8px 16px;
    margin: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .flow-arrow {
    display: inline-block;
    color: #ea9c2b;
    font-size: 18px;
    font-weight: 900;
    margin: 0 4px;
    vertical-align: middle;
  }

  .risk-badge {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
  }

  .risk-low { background: #e8f5e9; color: #2e7d32; }
  .risk-medium { background: #fff3e0; color: #e65100; }
  .risk-high { background: #ffebee; color: #c62828; }

  .kpi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    margin: 16px 0;
  }

  .kpi-card {
    background: white;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    padding: 14px;
    text-align: center;
  }

  .kpi-value {
    font-size: 22px;
    font-weight: 900;
    color: #ea9c2b;
  }

  .kpi-label {
    font-size: 10px;
    color: #666;
    margin-top: 4px;
  }

  .check-list { list-style: none; padding: 0; }

  .check-list li {
    padding: 6px 0;
    padding-right: 24px;
    position: relative;
    font-size: 12px;
  }

  .check-list li::before {
    content: '\\2713';
    position: absolute;
    right: 0;
    color: #ea9c2b;
    font-weight: 900;
    font-size: 14px;
  }

  .numbered-list { padding-right: 20px; }
  .numbered-list li { margin-bottom: 8px; }

  .footer-line {
    border-top: 2px solid #eee;
    padding-top: 10px;
    margin-top: 30px;
    font-size: 10px;
    color: #999;
    text-align: center;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 16px 0;
  }

  .info-card {
    background: #f8f9fc;
    border-radius: 10px;
    padding: 16px;
    border: 1px solid #e0e4ea;
  }

  .info-card-title {
    font-size: 13px;
    font-weight: 700;
    color: #ea9c2b;
    margin-bottom: 8px;
  }

  .stamp-box {
    border: 2px dashed #ccc;
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 11px;
    margin-top: 10px;
  }
</style>
</head>
<body>

<!-- ============ COVER PAGE ============ -->
<div class="cover-page">
  <div class="cover-content">
    <div class="logo-container">
      <span class="logo-text">دربي</span>
    </div>
    <div class="cover-badge">تقنية مالية | FinTech</div>
    <div class="cover-title">دربي</div>
    <div class="cover-subtitle">منصة تقسيط مشتريات الوقود - الشراء الآن والدفع لاحقاً</div>
    <div class="cover-doc-title">طلب ترخيص البيئة التجريبية</div>
    <div class="cover-doc-sub">البنك المركزي السعودي (ساما) - Sandbox License Application</div>
  </div>
  <div class="cover-footer">
    دربي للتقنية المالية &bull; Darby FinTech &bull; darbby.co &bull; فبراير 2026
  </div>
</div>

<!-- ============ PAGE 1: APPLICANT INFO ============ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">
      <div class="page-header-icon">د</div>
      <span class="page-header-brand">دربي | Darby</span>
    </div>
    <span class="page-header-section">القسم أ: معلومات المتقدم</span>
  </div>

  <div class="section-title">معلومات المتقدم</div>

  <table>
    <thead>
      <tr><th>البيان</th><th>التفاصيل</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>اسم الشركة</strong></td><td>دربي للتقنية المالية (Darby FinTech)</td></tr>
      <tr><td><strong>نوع النشاط</strong></td><td>تقنية مالية - خدمات الشراء الآن والدفع لاحقاً (BNPL)</td></tr>
      <tr><td><strong>القطاع المستهدف</strong></td><td>قطاع الوقود والطاقة في المملكة العربية السعودية</td></tr>
      <tr><td><strong>الموقع الإلكتروني</strong></td><td>darbby.co</td></tr>
      <tr><td><strong>البريد الإلكتروني</strong></td><td>CEO@darbby.co</td></tr>
      <tr><td><strong>تاريخ التقديم</strong></td><td>فبراير 2026</td></tr>
    </tbody>
  </table>

  <div class="section-title" style="margin-top:30px;">تعريف المنتج</div>
  <div class="section-subtitle">المنتج الرئيسي: منصة تقسيط مشتريات الوقود</div>
  <div class="section-desc">
    دربي هي منصة تقنية مالية متخصصة تقدم خدمة <strong>"الشراء الآن والدفع لاحقاً" (BNPL)</strong> حصرياً لقطاع الوقود في المملكة العربية السعودية. تعمل المنصة كوسيط مالي بين المستهلكين ومحطات الوقود.
  </div>

  <div class="two-col">
    <div class="info-card">
      <div class="info-card-title">المستهلكون</div>
      الأفراد والشركات الذين يحتاجون لتقسيط مشتريات الوقود وإدارة نفقاتهم بذكاء.
    </div>
    <div class="info-card">
      <div class="info-card-title">محطات الوقود (التجار)</div>
      المحطات التي ترغب في زيادة مبيعاتها عبر تقديم تسهيلات دفع مرنة لعملائها.
    </div>
  </div>

  <div class="section-subtitle">الفجوة في السوق السعودي</div>
  <table>
    <thead>
      <tr><th>التحدي</th><th>الوضع الحالي</th><th>حل دربي</th></tr>
    </thead>
    <tbody>
      <tr><td>تكلفة الوقود المرتفعة</td><td>لا توجد خيارات تقسيط للوقود</td><td>تقسيط مشتريات الوقود على 3-6 أشهر</td></tr>
      <tr><td>إدارة ميزانية الوقود</td><td>صعوبة التتبع والتخطيط</td><td>تتبع ذكي مع تنبيهات استهلاك</td></tr>
      <tr><td>أسطول الشركات</td><td>دفع فوري لتكاليف الوقود</td><td>تقسيط مرن لأساطيل الشركات</td></tr>
      <tr><td>تحسين الاستهلاك</td><td>لا توجد أدوات ذكية</td><td>محرك سنافي للقرار الذكي بالذكاء الاصطناعي</td></tr>
    </tbody>
  </table>

  <div class="footer-line">دربي للتقنية المالية - وثيقة سرية - صفحة 1</div>
</div>

<!-- ============ PAGE 2: BUSINESS MODEL ============ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">
      <div class="page-header-icon">د</div>
      <span class="page-header-brand">دربي | Darby</span>
    </div>
    <span class="page-header-section">القسم ب: نموذج العمل والقيمة المضافة</span>
  </div>

  <div class="section-title">نموذج العمل</div>

  <div class="flow-diagram">
    <div class="flow-step">العميل</div>
    <span class="flow-arrow">&rarr;</span>
    <div class="flow-step">طلب تقسيط وقود</div>
    <span class="flow-arrow">&rarr;</span>
    <div class="flow-step">دربي (تحقق + موافقة)</div>
    <span class="flow-arrow">&rarr;</span>
    <div class="flow-step">محطة الوقود</div>
    <br><br>
    <div class="flow-step" style="background:#fef9f0;">تسوية فورية للمحطة (97%)</div>
    <span class="flow-arrow">&bull;</span>
    <div class="flow-step" style="background:#fef9f0;">عمولة دربي (3%)</div>
    <span class="flow-arrow">&bull;</span>
    <div class="flow-step" style="background:#fef9f0;">أقساط شهرية من العميل</div>
  </div>

  <div class="section-subtitle">مسار الأموال (Money Flow)</div>
  <div class="highlight-box">
    <ol class="numbered-list">
      <li><strong>الخطوة 1:</strong> العميل يطلب تعبئة وقود عبر المنصة</li>
      <li><strong>الخطوة 2:</strong> دربي تتحقق من الأهلية والحدود الائتمانية</li>
      <li><strong>الخطوة 3:</strong> يتم خصم المبلغ من حد العميل الائتماني</li>
      <li><strong>الخطوة 4:</strong> دربي تدفع للمحطة فوراً (ناقص العمولة 3%)</li>
      <li><strong>الخطوة 5:</strong> العميل يسدد الأقساط الشهرية لدربي</li>
    </ol>
  </div>

  <div class="section-title" style="margin-top:28px;">القيمة المضافة</div>

  <div class="section-subtitle">تحسين إدارة التدفقات النقدية للمستهلكين</div>
  <ul class="check-list">
    <li>تحويل النفقات الكبيرة إلى أقساط مُدارة (500 ريال على 3-6 أشهر)</li>
    <li>الشفافية المالية الكاملة: عرض تفصيلي وتنبيهات استباقية</li>
    <li>محرك سنافي (Snafi AI Engine): تحليل ذكي لأنماط استهلاك الوقود</li>
    <li>تمكين أصحاب الأعمال الصغيرة وسائقي التوصيل</li>
  </ul>

  <div class="section-subtitle">محرك سنافي - الابتكار الأساسي</div>
  <table>
    <thead>
      <tr><th>الميزة</th><th>الوصف</th><th>الفائدة</th></tr>
    </thead>
    <tbody>
      <tr><td>قياس مستوى الخزان</td><td>تتبع ذكي لمستوى الوقود</td><td>معرفة الوقت الأمثل للتعبئة</td></tr>
      <tr><td>تحليل الاستهلاك</td><td>نماذج ML لتحليل أنماط القيادة</td><td>تقليل التكلفة بنسبة 10-15%</td></tr>
      <tr><td>توصيات ذكية</td><td>اقتراح أفضل محطة وكمية</td><td>توفير الوقت والمال</td></tr>
      <tr><td>تعلم مستمر</td><td>تحسين الدقة مع كل استخدام</td><td>نسبة دقة تتجاوز 85%</td></tr>
      <tr><td>تنبيهات استباقية</td><td>إشعار قبل نفاد الوقود</td><td>تجنب المواقف الطارئة</td></tr>
    </tbody>
  </table>

  <div class="footer-line">دربي للتقنية المالية - وثيقة سرية - صفحة 2</div>
</div>

<!-- ============ PAGE 3: SANDBOX SCOPE ============ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">
      <div class="page-header-icon">د</div>
      <span class="page-header-brand">دربي | Darby</span>
    </div>
    <span class="page-header-section">القسم ج: نطاق البيئة التجريبية</span>
  </div>

  <div class="section-title">نطاق الاختبار (Sandbox Scope)</div>
  <div class="section-subtitle">المعايير الكمية لفترة البيئة التجريبية</div>

  <table>
    <thead>
      <tr><th>المعيار</th><th>القيمة</th><th>المبرر</th></tr>
    </thead>
    <tbody>
      <tr><td>عدد المستخدمين</td><td><strong>500 مستخدم</strong></td><td>كافٍ لاختبار الأنماط السلوكية والمخاطر</td></tr>
      <tr><td>عدد المحطات</td><td><strong>20 محطة</strong></td><td>تغطية 3-5 مدن رئيسية</td></tr>
      <tr><td>حد العملية الواحدة</td><td><strong>500 ريال</strong></td><td>يغطي تعبئة خزان كامل</td></tr>
      <tr><td>الحد اليومي للمستخدم</td><td><strong>1,000 ريال</strong></td><td>يمنع الإفراط في الاستخدام</td></tr>
      <tr><td>الحد الشهري للمستخدم</td><td><strong>5,000 ريال</strong></td><td>إدارة محكمة للمخاطر</td></tr>
      <tr><td>مدة الاختبار</td><td><strong>12 شهراً</strong></td><td>كافية لجمع بيانات موسمية</td></tr>
      <tr><td>المدن المستهدفة</td><td><strong>الرياض، جدة، الدمام</strong></td><td>أكبر 3 أسواق في المملكة</td></tr>
    </tbody>
  </table>

  <div class="section-subtitle">إجراءات إدارة المخاطر في البيئة التجريبية</div>

  <div class="two-col">
    <div class="info-card">
      <div class="info-card-title">1. فصل البيانات</div>
      <ul class="check-list">
        <li>كل عملية تُعلَّم بـ environment: "sandbox"</li>
        <li>فصل تام بين بيانات الاختبار والإنتاج</li>
        <li>لوحة تحكم مخصصة لرقابة ساما</li>
      </ul>
    </div>
    <div class="info-card">
      <div class="info-card-title">2. حدود العمليات المتعددة</div>
      <ul class="check-list">
        <li>حد العملية الواحدة (max_single_transaction)</li>
        <li>حد يومي (daily_limit)</li>
        <li>حد أسبوعي (weekly_limit)</li>
        <li>حد شهري (monthly_limit)</li>
      </ul>
    </div>
    <div class="info-card">
      <div class="info-card-title">3. المراقبة اللحظية</div>
      <ul class="check-list">
        <li>تتبع كل عملية مالية لحظياً</li>
        <li>تسجيل مسار الأموال الكامل</li>
        <li>إشعارات فورية عند تجاوز الحدود</li>
        <li>تصنيف مخاطر تلقائي (Risk Scoring)</li>
      </ul>
    </div>
    <div class="info-card">
      <div class="info-card-title">4. سجلات تدقيق شاملة</div>
      <ul class="check-list">
        <li>سجل money_flow_logs: كل حركة مالية</li>
        <li>سجل limit_breaches: محاولات التجاوز</li>
        <li>سجل audit_logs: الإجراءات الإدارية</li>
        <li>بيانات غير قابلة للتعديل (Immutable)</li>
      </ul>
    </div>
  </div>

  <div class="section-subtitle">مؤشرات الأداء المستهدفة (KPIs)</div>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-value">&gt; 60%</div><div class="kpi-label">معدل الموافقة على الطلبات</div></div>
    <div class="kpi-card"><div class="kpi-value">&lt; 30 ث</div><div class="kpi-label">متوسط وقت الموافقة</div></div>
    <div class="kpi-card"><div class="kpi-value">&lt; 5%</div><div class="kpi-label">نسبة التعثر</div></div>
    <div class="kpi-card"><div class="kpi-value">4.2/5</div><div class="kpi-label">رضا المستخدمين</div></div>
    <div class="kpi-card"><div class="kpi-value">&gt; 85%</div><div class="kpi-label">دقة محرك سنافي</div></div>
    <div class="kpi-card"><div class="kpi-value">99.5%</div><div class="kpi-label">وقت التشغيل (Uptime)</div></div>
  </div>

  <div class="footer-line">دربي للتقنية المالية - وثيقة سرية - صفحة 3</div>
</div>

<!-- ============ PAGE 4: RISK & SECURITY ============ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">
      <div class="page-header-icon">د</div>
      <span class="page-header-brand">دربي | Darby</span>
    </div>
    <span class="page-header-section">القسم د: المخاطر والأمان</span>
  </div>

  <div class="section-title">تقييم المخاطر وإدارتها</div>

  <table>
    <thead>
      <tr><th>نوع المخاطرة</th><th>الوصف</th><th>احتمال الحدوث</th><th>التأثير</th><th>إجراء التخفيف</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>مخاطر الائتمان</strong></td>
        <td>تعثر العميل عن السداد</td>
        <td><span class="risk-badge risk-medium">متوسط</span></td>
        <td><span class="risk-badge risk-high">عالي</span></td>
        <td>تحقق SIMAH + حدود ائتمانية صارمة + تصنيف المخاطر</td>
      </tr>
      <tr>
        <td><strong>مخاطر الاحتيال</strong></td>
        <td>استخدام هوية مزورة أو معاملات وهمية</td>
        <td><span class="risk-badge risk-low">منخفض</span></td>
        <td><span class="risk-badge risk-high">عالي</span></td>
        <td>تحقق نفاذ + KYC/AML + مراقبة لحظية</td>
      </tr>
      <tr>
        <td><strong>مخاطر تشغيلية</strong></td>
        <td>أعطال النظام أو انقطاع الخدمة</td>
        <td><span class="risk-badge risk-low">منخفض</span></td>
        <td><span class="risk-badge risk-medium">متوسط</span></td>
        <td>نسخ احتياطية + مراقبة 24/7 + خطط طوارئ</td>
      </tr>
      <tr>
        <td><strong>مخاطر أمنية</strong></td>
        <td>هجمات إلكترونية أو اختراق بيانات</td>
        <td><span class="risk-badge risk-low">منخفض</span></td>
        <td><span class="risk-badge risk-high">عالي</span></td>
        <td>7 طبقات حماية + تشفير + فصل بيانات</td>
      </tr>
      <tr>
        <td><strong>مخاطر الامتثال</strong></td>
        <td>عدم التوافق مع لوائح ساما</td>
        <td><span class="risk-badge risk-low">منخفض</span></td>
        <td><span class="risk-badge risk-high">عالي</span></td>
        <td>فريق امتثال + تحديثات دورية + تقارير ساما</td>
      </tr>
      <tr>
        <td><strong>مخاطر السوق</strong></td>
        <td>تغير أسعار الوقود أو ضعف الطلب</td>
        <td><span class="risk-badge risk-medium">متوسط</span></td>
        <td><span class="risk-badge risk-medium">متوسط</span></td>
        <td>تسعير ديناميكي + تنويع الخدمات + تحليل سوقي</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title" style="margin-top:28px;">طبقات الحماية المُطبقة</div>

  <table>
    <thead>
      <tr><th>#</th><th>طبقة الحماية</th><th>التفاصيل</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td><strong>Rate Limiting</strong></td><td>10 طلبات/دقيقة/IP لمنع هجمات Brute Force</td></tr>
      <tr><td>2</td><td><strong>Input Sanitization</strong></td><td>تنقية المدخلات من الأكواد الخبيثة (XSS Prevention)</td></tr>
      <tr><td>3</td><td><strong>ID Validation</strong></td><td>التحقق من صيغة المعرفات (UUID/Alphanumeric)</td></tr>
      <tr><td>4</td><td><strong>Business Validation</strong></td><td>حدود عملية: 1-200 لتر، أسعار مرجعية للوقود</td></tr>
      <tr><td>5</td><td><strong>Server-Side Pricing</strong></td><td>التسعير من الخادم فقط (لا يمكن التلاعب من العميل)</td></tr>
      <tr><td>6</td><td><strong>Credit Limit Checks</strong></td><td>التحقق من الحد الائتماني قبل كل عملية</td></tr>
      <tr><td>7</td><td><strong>ORM Protection</strong></td><td>استعلامات محصنة ضد SQL Injection</td></tr>
      <tr><td>8</td><td><strong>Sandbox Isolation</strong></td><td>فصل تام بين بيئة الاختبار والإنتاج</td></tr>
    </tbody>
  </table>

  <div class="section-subtitle">التهديدات المعالجة</div>
  <table>
    <thead>
      <tr><th>التهديد</th><th>الحماية المطبقة</th><th>مستوى الحماية</th></tr>
    </thead>
    <tbody>
      <tr><td>SQL Injection</td><td>ORM + Parameterized Queries</td><td><span class="risk-badge risk-low">محمي</span></td></tr>
      <tr><td>XSS</td><td>Input Sanitization + CSP</td><td><span class="risk-badge risk-low">محمي</span></td></tr>
      <tr><td>Brute Force</td><td>Rate Limiting + Account Lockout</td><td><span class="risk-badge risk-low">محمي</span></td></tr>
      <tr><td>Parameter Tampering</td><td>Server-side Validation</td><td><span class="risk-badge risk-low">محمي</span></td></tr>
      <tr><td>Price Manipulation</td><td>Server-side Pricing Only</td><td><span class="risk-badge risk-low">محمي</span></td></tr>
      <tr><td>Unauthorized Access</td><td>RBAC (27 دور، 14 قسم)</td><td><span class="risk-badge risk-low">محمي</span></td></tr>
    </tbody>
  </table>

  <div class="footer-line">دربي للتقنية المالية - وثيقة سرية - صفحة 4</div>
</div>

<!-- ============ PAGE 5: VERIFICATION & ARCHITECTURE ============ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">
      <div class="page-header-icon">د</div>
      <span class="page-header-brand">دربي | Darby</span>
    </div>
    <span class="page-header-section">القسم هـ: نظام التحقق والبنية التقنية</span>
  </div>

  <div class="section-title">نظام التحقق متعدد الطبقات (KYC/AML)</div>

  <div class="flow-diagram">
    <div class="flow-step" style="border-color:#2e7d32;">نفاذ (Nafath)</div>
    <span class="flow-arrow">&rarr;</span>
    <div class="flow-step" style="border-color:#1565c0;">سمة (SIMAH)</div>
    <span class="flow-arrow">&rarr;</span>
    <div class="flow-step" style="border-color:#e65100;">التأمينات (GOSI)</div>
    <span class="flow-arrow">&rarr;</span>
    <div class="flow-step" style="border-color:#c62828;">AML Screening</div>
    <span class="flow-arrow">&rarr;</span>
    <div class="flow-step" style="border-color:#ea9c2b; background: #fef9f0;">قرار الموافقة</div>
  </div>

  <table>
    <thead>
      <tr><th>خطوة التحقق</th><th>الخدمة</th><th>الغرض</th><th>المخرجات</th></tr>
    </thead>
    <tbody>
      <tr><td>1. التحقق من الهوية</td><td>نفاذ (Nafath)</td><td>التأكد من الهوية الوطنية</td><td>تأكيد/رفض الهوية</td></tr>
      <tr><td>2. التقرير الائتماني</td><td>سمة (SIMAH)</td><td>تقييم الجدارة الائتمانية</td><td>درجة ائتمانية + تاريخ مالي</td></tr>
      <tr><td>3. الحالة الوظيفية</td><td>التأمينات (GOSI)</td><td>التحقق من التوظيف</td><td>حالة العمل + مستوى الأولوية</td></tr>
      <tr><td>4. مكافحة الغسل</td><td>AML/KYC</td><td>فحص القوائم السوداء</td><td>تقرير الامتثال</td></tr>
    </tbody>
  </table>

  <div class="section-subtitle">نظام تصنيف الائتمان</div>
  <table>
    <thead>
      <tr><th>التصنيف</th><th>نطاق الدرجة</th><th>القرار</th><th>الحد الائتماني</th></tr>
    </thead>
    <tbody>
      <tr><td><span class="risk-badge risk-low">ممتاز</span></td><td>800 - 900</td><td>موافقة فورية</td><td>حتى 5,000 ريال</td></tr>
      <tr><td><span class="risk-badge risk-low">جيد</span></td><td>700 - 799</td><td>موافقة</td><td>حتى 3,000 ريال</td></tr>
      <tr><td><span class="risk-badge risk-medium">مقبول</span></td><td>600 - 699</td><td>موافقة مشروطة</td><td>حتى 1,500 ريال</td></tr>
      <tr><td><span class="risk-badge risk-high">ضعيف</span></td><td>500 - 599</td><td>مراجعة يدوية</td><td>حتى 500 ريال</td></tr>
      <tr><td><span class="risk-badge risk-high">مرفوض</span></td><td>أقل من 500</td><td>رفض</td><td>-</td></tr>
    </tbody>
  </table>

  <div class="section-title" style="margin-top:28px;">البنية التقنية - التطبيقات الثلاثة</div>

  <div class="two-col" style="grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
    <div class="info-card" style="text-align:center;">
      <div class="info-card-title">تطبيق العميل</div>
      <div style="font-size:11px; color:#666;">darbby.co</div>
      <ul class="check-list" style="text-align:right; margin-top:8px;">
        <li>طلب التقسيط</li>
        <li>إدارة الفواتير</li>
        <li>محرك سنافي</li>
        <li>صمم رحلتك</li>
      </ul>
    </div>
    <div class="info-card" style="text-align:center;">
      <div class="info-card-title">بوابة التاجر</div>
      <div style="font-size:11px; color:#666;">partners.darbby.co</div>
      <ul class="check-list" style="text-align:right; margin-top:8px;">
        <li>إدارة المعاملات</li>
        <li>API التكامل</li>
        <li>التقارير المالية</li>
        <li>Webhooks</li>
      </ul>
    </div>
    <div class="info-card" style="text-align:center;">
      <div class="info-card-title">لوحة الإدارة</div>
      <div style="font-size:11px; color:#666;">admin.darbby.co</div>
      <ul class="check-list" style="text-align:right; margin-top:8px;">
        <li>إدارة المستخدمين</li>
        <li>الموافقات</li>
        <li>RBAC (27 دور)</li>
        <li>رقابة ساما</li>
      </ul>
    </div>
  </div>

  <div class="footer-line">دربي للتقنية المالية - وثيقة سرية - صفحة 5</div>
</div>

<!-- ============ PAGE 6: CONCLUSION & SIGNATURES ============ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-logo">
      <div class="page-header-icon">د</div>
      <span class="page-header-brand">دربي | Darby</span>
    </div>
    <span class="page-header-section">القسم و: الخلاصة والتوقيعات</span>
  </div>

  <div class="section-title">الخلاصة</div>

  <div class="highlight-box">
    <p style="font-size:13px; line-height:2;">
      دربي تقدم حلاً مبتكراً ومتخصصاً لقطاع الوقود في المملكة العربية السعودية. المنصة مصممة لتلبية أعلى معايير الامتثال التنظيمي مع تقديم قيمة حقيقية للمستهلكين والتجار والاقتصاد الوطني.
    </p>
  </div>

  <div class="two-col">
    <div class="info-card">
      <div class="info-card-title">ابتكار تقني حقيقي</div>
      محرك سنافي للذكاء الاصطناعي يقدم توصيات ذكية فريدة من نوعها في قطاع الوقود، مع نسبة دقة تتجاوز 85%.
    </div>
    <div class="info-card">
      <div class="info-card-title">إدارة مخاطر محكمة</div>
      حدود متعددة المستويات وبيئة تجريبية معزولة تضمن أعلى مستويات الأمان والسيطرة على المخاطر.
    </div>
    <div class="info-card">
      <div class="info-card-title">شفافية كاملة</div>
      سجلات تدفق الأموال ولوحة رقابة لحظية توفر رؤية شاملة لكل عملية مالية.
    </div>
    <div class="info-card">
      <div class="info-card-title">امتثال تنظيمي</div>
      متوافق مع متطلبات ساما ومعايير البيئة التجريبية مع 7 طبقات حماية.
    </div>
  </div>

  <div style="margin-top: 40px;">
    <div class="section-subtitle">التوقيعات والاعتماد</div>
    <div class="two-col" style="margin-top:16px;">
      <div>
        <table style="font-size:11px;">
          <tbody>
            <tr><td style="padding:8px;"><strong>اسم الممثل القانوني:</strong></td><td style="padding:8px; border-bottom:1px solid #ccc; min-width:160px;"></td></tr>
            <tr><td style="padding:8px;"><strong>المسمى الوظيفي:</strong></td><td style="padding:8px; border-bottom:1px solid #ccc;"></td></tr>
            <tr><td style="padding:8px;"><strong>التوقيع:</strong></td><td style="padding:8px; border-bottom:1px solid #ccc;"></td></tr>
            <tr><td style="padding:8px;"><strong>التاريخ:</strong></td><td style="padding:8px; border-bottom:1px solid #ccc;"></td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <div class="stamp-box">
          <p style="margin-bottom:8px;">مكان الختم الرسمي</p>
          <p>Official Stamp</p>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-line" style="margin-top:60px;">
    <p>تم إعداد هذا المستند بواسطة فريق دربي للتقنية المالية - القسم القانوني والتقني</p>
    <p style="margin-top:4px;">فبراير 2026 | CEO@darbby.co | darbby.co</p>
    <p style="margin-top:4px; color:#ccc;">جميع الحقوق محفوظة &copy; 2026 دربي للتقنية المالية</p>
  </div>
</div>

</body>
</html>`;
}

function findChromiumPath(): string {
  const possiblePaths = [
    "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  const nixMatch = fs.readdirSync("/nix/store")
    .filter(d => d.includes("chromium") && !d.includes(".drv"))
    .map(d => `/nix/store/${d}/bin/chromium`)
    .find(p => fs.existsSync(p));
  if (nixMatch) return nixMatch;
  throw new Error("Could not find Chromium binary");
}

export async function generateDarbyPDF(): Promise<Buffer> {
  const executablePath = findChromiumPath();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    const html = buildHTML();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      displayHeaderFooter: false,
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
