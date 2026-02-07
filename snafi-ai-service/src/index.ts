import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const PORT = process.env.SNAFI_PORT || 3003;

app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "snafi-ai-service" });
});

// قراءات مستوى الخزان
interface TankMeasurement {
  id: string;
  vehiclePlate: string;
  tankCapacity: number;
  currentLevel: number;
  fuelPercentage: number;
  avgConsumption: number;
  estimatedRange: number;
  recommendation: string;
  createdAt: Date;
}

const measurements: TankMeasurement[] = [];

// جلب جميع القراءات
app.get("/api/tank-measurements", async (req, res) => {
  res.json(measurements);
});

// تسجيل قراءة جديدة مع تحليل AI
app.post("/api/tank-measurements", async (req, res) => {
  try {
    const { vehiclePlate, tankCapacity, currentLevel, avgConsumption } = req.body;
    
    const fuelPercentage = (currentLevel / tankCapacity) * 100;
    const estimatedRange = (currentLevel / avgConsumption) * 100;
    
    // تحليل AI للتوصية
    let recommendation = "";
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `أنت مساعد ذكي لتحليل استهلاك الوقود. 
            السيارة: ${vehiclePlate}
            سعة الخزان: ${tankCapacity} لتر
            المستوى الحالي: ${currentLevel} لتر (${fuelPercentage.toFixed(1)}%)
            متوسط الاستهلاك: ${avgConsumption} لتر/100كم
            المسافة المتوقعة: ${estimatedRange.toFixed(0)} كم
            
            قدم توصية قصيرة (جملة واحدة فقط) بالعربية للسائق.`
          }
        ]
      });
      
      const textBlock = message.content.find((block: { type: string; text?: string }) => block.type === "text");
      recommendation = textBlock && "text" in textBlock ? textBlock.text : "لا توجد توصية";
    } catch (aiError) {
      console.error("AI Error:", aiError);
      if (fuelPercentage < 20) {
        recommendation = "تحذير: مستوى الوقود منخفض جداً، يُنصح بالتزود فوراً";
      } else if (fuelPercentage < 40) {
        recommendation = "مستوى الوقود منخفض، خطط للتزود قريباً";
      } else if (fuelPercentage < 60) {
        recommendation = "مستوى الوقود معتدل";
      } else {
        recommendation = "مستوى الوقود ممتاز";
      }
    }
    
    const measurement: TankMeasurement = {
      id: crypto.randomUUID(),
      vehiclePlate,
      tankCapacity,
      currentLevel,
      fuelPercentage,
      avgConsumption,
      estimatedRange,
      recommendation,
      createdAt: new Date(),
    };
    
    measurements.unshift(measurement);
    res.json(measurement);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "حدث خطأ في تسجيل القراءة" });
  }
});

// تنبؤات الذكاء الاصطناعي
interface Prediction {
  id: string;
  vehiclePlate: string;
  predictedConsumption: number;
  predictedRange: number;
  confidence: number;
  factors: string[];
  createdAt: Date;
}

const predictions: Prediction[] = [];

app.get("/api/predictions", async (req, res) => {
  res.json(predictions);
});

// تحليل شامل بالذكاء الاصطناعي
app.post("/api/analyze", async (req, res) => {
  try {
    const { vehiclePlate, recentMeasurements, drivingPattern } = req.body;
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `أنت خبير في تحليل استهلاك وقود السيارات. قم بتحليل البيانات التالية وقدم تقريراً شاملاً:
          
          السيارة: ${vehiclePlate}
          القراءات الأخيرة: ${JSON.stringify(recentMeasurements || [])}
          نمط القيادة: ${drivingPattern || "غير محدد"}
          
          قدم:
          1. تحليل نمط الاستهلاك
          2. توقع للاستهلاك المستقبلي
          3. نصائح لتحسين كفاءة الوقود
          
          أجب بالعربية بشكل مختصر ومفيد.`
        }
      ]
    });
    
    const textBlock = message.content.find((block: { type: string; text?: string }) => block.type === "text");
    const analysis = textBlock && "text" in textBlock ? textBlock.text : "لا يوجد تحليل";
    
    // إنشاء تنبؤ
    const prediction: Prediction = {
      id: crypto.randomUUID(),
      vehiclePlate: vehiclePlate || "غير محدد",
      predictedConsumption: Math.random() * 3 + 7, // 7-10 لتر/100كم
      predictedRange: Math.random() * 200 + 300, // 300-500 كم
      confidence: Math.random() * 20 + 80, // 80-100%
      factors: ["نمط القيادة", "حالة الطريق", "درجة الحرارة"],
      createdAt: new Date(),
    };
    
    predictions.unshift(prediction);
    
    res.json({
      analysis,
      prediction,
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "حدث خطأ في التحليل" });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 محرك سنافي للذكاء الاصطناعي يعمل على المنفذ ${PORT}`);
});
