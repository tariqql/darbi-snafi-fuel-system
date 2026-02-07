# خدمة تقسيط الفواتير (Billing Service)

## الوصف
خدمة مصغرة لإدارة فواتير الوقود وخطط التقسيط الشهرية.

## التشغيل
```bash
cd billing-service
npm install
npm run dev
```

## نقاط API
- `GET /api/invoices` - جلب جميع الفواتير
- `POST /api/invoices` - إنشاء فاتورة جديدة
- `POST /api/invoices/:id/pay` - سداد قسط

## المنفذ
الخدمة تعمل على المنفذ `3001` افتراضياً
