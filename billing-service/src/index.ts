import express from "express";

const app = express();
const PORT = process.env.BILLING_PORT || 3001;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "billing-service" });
});

// أنواع البيانات
interface Invoice {
  id: string;
  userId: string;
  stationId: string;
  stationName: string;
  fuelType: string;
  liters: number;
  pricePerLiter: number;
  amount: number;
  totalInstallments: number;
  paidInstallments: number;
  monthlyAmount: number;
  dueDate: Date;
  status: "active" | "completed" | "overdue";
  createdAt: Date;
}

// تخزين مؤقت في الذاكرة
const invoices: Invoice[] = [
  {
    id: "1",
    userId: "user-1",
    stationId: "station-1",
    stationName: "محطة الرياض المركزية",
    fuelType: "95",
    liters: 60,
    pricePerLiter: 2.18,
    amount: 130.8,
    totalInstallments: 3,
    paidInstallments: 1,
    monthlyAmount: 43.6,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    userId: "user-1",
    stationId: "station-2",
    stationName: "محطة جدة الساحلية",
    fuelType: "91",
    liters: 45,
    pricePerLiter: 2.04,
    amount: 91.8,
    totalInstallments: 2,
    paidInstallments: 0,
    monthlyAmount: 45.9,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: "active",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

// جلب جميع الفواتير
app.get("/api/invoices", async (req, res) => {
  res.json(invoices);
});

// جلب فاتورة واحدة
app.get("/api/invoices/:id", async (req, res) => {
  const invoice = invoices.find(inv => inv.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: "الفاتورة غير موجودة" });
  }
  res.json(invoice);
});

// إنشاء فاتورة جديدة
app.post("/api/invoices", async (req, res) => {
  try {
    const { stationId, stationName, fuelType, liters, pricePerLiter, totalInstallments, dueDate } = req.body;
    
    const amount = liters * pricePerLiter;
    const monthlyAmount = amount / totalInstallments;
    
    const invoice: Invoice = {
      id: crypto.randomUUID(),
      userId: "user-1",
      stationId,
      stationName: stationName || "محطة وقود",
      fuelType,
      liters,
      pricePerLiter,
      amount,
      totalInstallments,
      paidInstallments: 0,
      monthlyAmount,
      dueDate: new Date(dueDate),
      status: "active",
      createdAt: new Date(),
    };
    
    invoices.unshift(invoice);
    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "حدث خطأ في إنشاء الفاتورة" });
  }
});

// سداد قسط
app.post("/api/invoices/:id/pay", async (req, res) => {
  const invoice = invoices.find(inv => inv.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: "الفاتورة غير موجودة" });
  }
  
  if (invoice.paidInstallments >= invoice.totalInstallments) {
    return res.status(400).json({ error: "جميع الأقساط مسددة" });
  }
  
  invoice.paidInstallments += 1;
  if (invoice.paidInstallments >= invoice.totalInstallments) {
    invoice.status = "completed";
  }
  
  res.json(invoice);
});

// إحصائيات الفواتير
app.get("/api/invoices/stats/summary", async (req, res) => {
  const activeInvoices = invoices.filter(inv => inv.status === "active");
  const completedInvoices = invoices.filter(inv => inv.status === "completed");
  const totalOwed = activeInvoices.reduce((sum, inv) => {
    return sum + (inv.amount - inv.paidInstallments * inv.monthlyAmount);
  }, 0);
  
  res.json({
    totalInvoices: invoices.length,
    activeInvoices: activeInvoices.length,
    completedInvoices: completedInvoices.length,
    totalOwed: Math.round(totalOwed * 100) / 100,
  });
});

app.listen(PORT, () => {
  console.log(`🧾 خدمة تقسيط الفواتير تعمل على المنفذ ${PORT}`);
});
