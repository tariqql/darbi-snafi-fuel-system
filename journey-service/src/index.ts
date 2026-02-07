import express from "express";

const app = express();
const PORT = process.env.JOURNEY_PORT || 3002;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "journey-service" });
});

// أنواع البيانات
interface FuelStation {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  fuelTypes: string[];
  prices: { type: string; price: number }[];
  amenities: string[];
  rating: number;
}

interface Journey {
  id: string;
  userId: string;
  name: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedFuel: number;
  estimatedCost: number;
  selectedStations: string[];
  createdAt: Date;
}

// محطات الوقود
const stations: FuelStation[] = [
  {
    id: "station-1",
    name: "محطة الرياض المركزية",
    location: "الرياض - طريق الملك فهد",
    lat: 24.7136,
    lng: 46.6753,
    fuelTypes: ["91", "95", "ديزل"],
    prices: [
      { type: "91", price: 2.04 },
      { type: "95", price: 2.18 },
      { type: "ديزل", price: 0.52 },
    ],
    amenities: ["مغسلة", "متجر", "مسجد", "مطعم"],
    rating: 4.5,
  },
  {
    id: "station-2",
    name: "محطة جدة الساحلية",
    location: "جدة - طريق الكورنيش",
    lat: 21.5433,
    lng: 39.1728,
    fuelTypes: ["91", "95"],
    prices: [
      { type: "91", price: 2.04 },
      { type: "95", price: 2.18 },
    ],
    amenities: ["متجر", "مسجد"],
    rating: 4.2,
  },
  {
    id: "station-3",
    name: "محطة الدمام الشرقية",
    location: "الدمام - طريق الملك عبدالله",
    lat: 26.4207,
    lng: 50.0888,
    fuelTypes: ["91", "95", "ديزل"],
    prices: [
      { type: "91", price: 2.04 },
      { type: "95", price: 2.18 },
      { type: "ديزل", price: 0.52 },
    ],
    amenities: ["مغسلة", "متجر", "مسجد", "كافيه"],
    rating: 4.7,
  },
  {
    id: "station-4",
    name: "محطة مكة المكرمة",
    location: "مكة - طريق الحرم",
    lat: 21.4225,
    lng: 39.8262,
    fuelTypes: ["91", "95"],
    prices: [
      { type: "91", price: 2.04 },
      { type: "95", price: 2.18 },
    ],
    amenities: ["متجر", "مسجد", "استراحة"],
    rating: 4.4,
  },
  {
    id: "station-5",
    name: "محطة المدينة المنورة",
    location: "المدينة - طريق الهجرة",
    lat: 24.4672,
    lng: 39.6024,
    fuelTypes: ["91", "95", "ديزل"],
    prices: [
      { type: "91", price: 2.04 },
      { type: "95", price: 2.18 },
      { type: "ديزل", price: 0.52 },
    ],
    amenities: ["مغسلة", "متجر", "مسجد", "مطعم", "فندق"],
    rating: 4.8,
  },
];

// الرحلات المحفوظة
const journeys: Journey[] = [
  {
    id: "journey-1",
    userId: "user-1",
    name: "رحلة العيد",
    startLocation: "الرياض",
    endLocation: "جدة",
    distance: 950,
    estimatedFuel: 76,
    estimatedCost: 165.68,
    selectedStations: ["station-1", "station-4"],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "journey-2",
    userId: "user-1",
    name: "رحلة نهاية الأسبوع",
    startLocation: "الرياض",
    endLocation: "الدمام",
    distance: 400,
    estimatedFuel: 32,
    estimatedCost: 69.76,
    selectedStations: ["station-3"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

// جلب جميع المحطات
app.get("/api/stations", async (req, res) => {
  res.json(stations);
});

// جلب محطة واحدة
app.get("/api/stations/:id", async (req, res) => {
  const station = stations.find(s => s.id === req.params.id);
  if (!station) {
    return res.status(404).json({ error: "المحطة غير موجودة" });
  }
  res.json(station);
});

// جلب جميع الرحلات
app.get("/api/journeys", async (req, res) => {
  res.json(journeys);
});

// جلب رحلة واحدة
app.get("/api/journeys/:id", async (req, res) => {
  const journey = journeys.find(j => j.id === req.params.id);
  if (!journey) {
    return res.status(404).json({ error: "الرحلة غير موجودة" });
  }
  res.json(journey);
});

// إنشاء رحلة جديدة
app.post("/api/journeys", async (req, res) => {
  try {
    const { name, startLocation, endLocation, distance, estimatedFuel, estimatedCost, selectedStations } = req.body;
    
    const journey: Journey = {
      id: crypto.randomUUID(),
      userId: "user-1",
      name,
      startLocation,
      endLocation,
      distance,
      estimatedFuel,
      estimatedCost,
      selectedStations: selectedStations || [],
      createdAt: new Date(),
    };
    
    journeys.unshift(journey);
    res.status(201).json(journey);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "حدث خطأ في إنشاء الرحلة" });
  }
});

// حذف رحلة
app.delete("/api/journeys/:id", async (req, res) => {
  const index = journeys.findIndex(j => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "الرحلة غير موجودة" });
  }
  
  journeys.splice(index, 1);
  res.json({ success: true, message: "تم حذف الرحلة بنجاح" });
});

// البحث عن محطات قريبة
app.get("/api/stations/nearby", async (req, res) => {
  const { lat, lng, radius = 50 } = req.query;
  
  if (!lat || !lng) {
    return res.json(stations);
  }
  
  // حساب المسافة (تقريبي)
  const nearbyStations = stations.filter(station => {
    const distance = Math.sqrt(
      Math.pow(Number(lat) - station.lat, 2) + 
      Math.pow(Number(lng) - station.lng, 2)
    ) * 111; // تحويل تقريبي إلى كيلومترات
    
    return distance <= Number(radius);
  });
  
  res.json(nearbyStations);
});

app.listen(PORT, () => {
  console.log(`🗺️ خدمة تخطيط الرحلات تعمل على المنفذ ${PORT}`);
});
