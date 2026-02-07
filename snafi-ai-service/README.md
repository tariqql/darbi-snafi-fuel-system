# محرك سنافي للذكاء الاصطناعي (Snafi AI Service)

## الوصف
خدمة مصغرة للذكاء الاصطناعي لقياس وتحليل استهلاك الوقود والتنبؤ بالمسافة المتبقية.

## التشغيل
```bash
cd snafi-ai-service
npm install
npm run dev
```

## نقاط API
- `GET /api/tank-measurements` - جلب قراءات مستوى الخزان
- `POST /api/tank-measurements` - تسجيل قراءة جديدة
- `GET /api/predictions` - جلب تنبؤات الذكاء الاصطناعي
- `POST /api/analyze` - تحليل استهلاك الوقود

## المنفذ
الخدمة تعمل على المنفذ `3003` افتراضياً

## الذكاء الاصطناعي
الخدمة تستخدم Claude AI من Anthropic لتحليل أنماط الاستهلاك وتقديم توصيات.
