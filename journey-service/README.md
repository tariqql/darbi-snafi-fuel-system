# خدمة تخطيط الرحلات (Journey Service)

## الوصف
خدمة مصغرة لتخطيط المسارات وإدارة محطات الوقود على الطريق.

## التشغيل
```bash
cd journey-service
npm install
npm run dev
```

## نقاط API
- `GET /api/journeys` - جلب خطط الرحلات
- `POST /api/journeys` - إنشاء رحلة جديدة
- `DELETE /api/journeys/:id` - حذف رحلة
- `GET /api/stations` - جلب المحطات المتاحة

## المنفذ
الخدمة تعمل على المنفذ `3002` افتراضياً
