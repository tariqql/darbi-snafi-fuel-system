import { db } from "./db";
import { fuelStations, invoices, journeys, tankMeasurements, aiPredictions, vehicles, users, wallets, vehicleCatalog } from "@shared/schema";

export async function seedDatabase() {
  try {
    const existingStations = await db.select().from(fuelStations);
    if (existingStations.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database...");

    const stationsData = [
      {
        name: "محطة الراجحي",
        address: "طريق الملك فهد، الرياض",
        latitude: 24.7136,
        longitude: 46.6753,
        city: "الرياض",
        region: "الرياض",
        fuelTypes: ["91", "95", "diesel"],
        pricePerLiter: 2.33,
        isActive: true,
      },
      {
        name: "محطة أرامكو",
        address: "طريق الدمام، الرياض",
        latitude: 24.6877,
        longitude: 46.7219,
        city: "الرياض",
        region: "الرياض",
        fuelTypes: ["91", "95"],
        pricePerLiter: 2.35,
        isActive: true,
      },
      {
        name: "محطة ساسكو",
        address: "طريق جدة السريع، مكة",
        latitude: 21.4225,
        longitude: 39.8262,
        city: "مكة",
        region: "مكة",
        fuelTypes: ["91", "95", "diesel"],
        pricePerLiter: 2.30,
        isActive: true,
      },
      {
        name: "محطة الخليج",
        address: "طريق الملك عبدالعزيز، جدة",
        latitude: 21.4858,
        longitude: 39.1925,
        city: "جدة",
        region: "مكة",
        fuelTypes: ["91", "95"],
        pricePerLiter: 2.32,
        isActive: true,
      },
      {
        name: "محطة بترومين",
        address: "طريق الطائف، الهدا",
        latitude: 21.3547,
        longitude: 40.2976,
        city: "الطائف",
        region: "مكة",
        fuelTypes: ["91", "95", "diesel"],
        pricePerLiter: 2.38,
        isActive: false,
      },
    ];

    const insertedStations = await db.insert(fuelStations).values(stationsData).returning();

    const userData = {
      phone: "0501234567",
      passwordHash: "hashed_password_123",
      fullName: "أحمد محمد العلي",
      nationalId: "1234567890",
      userType: "individual",
      status: "active",
      creditLimit: 2000,
      creditScore: 750,
    };

    const [insertedUser] = await db.insert(users).values(userData).returning();

    await db.insert(wallets).values({
      userId: insertedUser.id,
      balance: 500,
      currency: "SAR",
    });

    const vehicleData = {
      userId: insertedUser.id,
      plateNumber: "أ ب ج 1234",
      make: "تويوتا",
      model: "كامري",
      year: 2022,
      tankCapacity: 60,
      avgConsumption: 8,
      odometerReading: 45000,
    };

    const [insertedVehicle] = await db.insert(vehicles).values(vehicleData).returning();

    const invoicesData = [
      {
        userId: insertedUser.id,
        totalAmount: 175.0,
        paidAmount: 58.33,
        installmentMonths: 3,
        monthlyAmount: 58.33,
        status: "active",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
      {
        userId: insertedUser.id,
        totalAmount: 117.5,
        paidAmount: 0,
        installmentMonths: 2,
        monthlyAmount: 58.75,
        status: "active",
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
      {
        userId: insertedUser.id,
        totalAmount: 92.0,
        paidAmount: 92.0,
        installmentMonths: 2,
        monthlyAmount: 46.0,
        status: "paid",
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.insert(invoices).values(invoicesData);

    const journeysData = [
      {
        userId: insertedUser.id,
        title: "رحلة العيد",
        startLocation: "الرياض",
        endLocation: "جدة",
        totalDistance: 950.0,
        estimatedFuel: 76.0,
        estimatedCost: 177.08,
        status: "planned",
      },
      {
        userId: insertedUser.id,
        title: "رحلة نهاية الأسبوع",
        startLocation: "الرياض",
        endLocation: "الطائف",
        totalDistance: 820.0,
        estimatedFuel: 65.6,
        estimatedCost: 152.85,
        status: "planned",
      },
    ];

    await db.insert(journeys).values(journeysData);

    const measurementsData = [
      {
        vehicleId: insertedVehicle.id,
        fuelLevel: 35.0,
        odometer: 45000,
        aiConfidence: 0.95,
      },
      {
        vehicleId: insertedVehicle.id,
        fuelLevel: 18.0,
        odometer: 45500,
        aiConfidence: 0.92,
      },
    ];

    const insertedMeasurements = await db.insert(tankMeasurements).values(measurementsData).returning();

    const predictionsData = [
      {
        vehicleId: insertedVehicle.id,
        measurementId: insertedMeasurements[0].id,
        predictedConsumption: 8.5,
        remainingRange: 437.5,
        recommendations: ["مستوى الوقود جيد", "يمكنك التعبئة عند المرور بمحطة"],
      },
    ];

    await db.insert(aiPredictions).values(predictionsData);

    // Seed vehicle catalog with top 50 cars in Saudi Arabia
    await seedVehicleCatalog();

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// بيانات أكثر 50 سيارة انتشاراً في السعودية
export async function seedVehicleCatalog() {
  const existingCatalog = await db.select().from(vehicleCatalog);
  if (existingCatalog.length > 0) {
    console.log("Vehicle catalog already seeded, skipping...");
    return;
  }

  console.log("Seeding vehicle catalog...");

  const vehicleCatalogData = [
    // تويوتا - الأكثر انتشاراً (20 موديل)
    { make: "Toyota", makeAr: "تويوتا", model: "Camry", modelAr: "كامري", yearFrom: 1990, yearTo: 2026, tankCapacity: 60, fuelType: "91", avgConsumption: 12.5, popularity: 1, category: "sedan" },
    { make: "Toyota", makeAr: "تويوتا", model: "Corolla", modelAr: "كورولا", yearFrom: 1990, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 14.0, popularity: 2, category: "sedan" },
    { make: "Toyota", makeAr: "تويوتا", model: "Land Cruiser", modelAr: "لاند كروزر", yearFrom: 1990, yearTo: 2026, tankCapacity: 93, fuelType: "91", avgConsumption: 8.0, popularity: 3, category: "suv" },
    { make: "Toyota", makeAr: "تويوتا", model: "Hilux", modelAr: "هايلوكس", yearFrom: 1990, yearTo: 2026, tankCapacity: 80, fuelType: "diesel", avgConsumption: 10.0, popularity: 4, category: "pickup" },
    { make: "Toyota", makeAr: "تويوتا", model: "Yaris", modelAr: "يارس", yearFrom: 1999, yearTo: 2026, tankCapacity: 42, fuelType: "91", avgConsumption: 16.0, popularity: 5, category: "hatchback" },
    { make: "Toyota", makeAr: "تويوتا", model: "Fortuner", modelAr: "فورتشنر", yearFrom: 2005, yearTo: 2026, tankCapacity: 80, fuelType: "91", avgConsumption: 9.0, popularity: 6, category: "suv" },
    { make: "Toyota", makeAr: "تويوتا", model: "RAV4", modelAr: "راف فور", yearFrom: 1994, yearTo: 2026, tankCapacity: 55, fuelType: "91", avgConsumption: 11.0, popularity: 7, category: "suv" },
    { make: "Toyota", makeAr: "تويوتا", model: "Avalon", modelAr: "أفالون", yearFrom: 1994, yearTo: 2022, tankCapacity: 64, fuelType: "91", avgConsumption: 10.5, popularity: 8, category: "sedan" },
    { make: "Toyota", makeAr: "تويوتا", model: "Prado", modelAr: "برادو", yearFrom: 1996, yearTo: 2026, tankCapacity: 87, fuelType: "91", avgConsumption: 9.0, popularity: 9, category: "suv" },
    { make: "Toyota", makeAr: "تويوتا", model: "Innova", modelAr: "إنوفا", yearFrom: 2004, yearTo: 2026, tankCapacity: 55, fuelType: "91", avgConsumption: 11.0, popularity: 10, category: "suv" },
    { make: "Toyota", makeAr: "تويوتا", model: "Sequoia", modelAr: "سيكويا", yearFrom: 2000, yearTo: 2026, tankCapacity: 100, fuelType: "91", avgConsumption: 7.0, popularity: 11, category: "suv" },
    { make: "Toyota", makeAr: "تويوتا", model: "4Runner", modelAr: "فور رانر", yearFrom: 1984, yearTo: 2026, tankCapacity: 87, fuelType: "91", avgConsumption: 8.5, popularity: 12, category: "suv" },
    { make: "Toyota", makeAr: "تويوتا", model: "Highlander", modelAr: "هايلاندر", yearFrom: 2000, yearTo: 2026, tankCapacity: 72, fuelType: "91", avgConsumption: 9.5, popularity: 13, category: "suv" },
    { make: "Toyota", makeAr: "تويوتا", model: "Tundra", modelAr: "تندرا", yearFrom: 1999, yearTo: 2026, tankCapacity: 100, fuelType: "91", avgConsumption: 7.5, popularity: 14, category: "pickup" },
    { make: "Toyota", makeAr: "تويوتا", model: "Tacoma", modelAr: "تاكوما", yearFrom: 1995, yearTo: 2026, tankCapacity: 80, fuelType: "91", avgConsumption: 9.0, popularity: 15, category: "pickup" },
    { make: "Toyota", makeAr: "تويوتا", model: "FJ Cruiser", modelAr: "إف جي كروزر", yearFrom: 2006, yearTo: 2014, tankCapacity: 72, fuelType: "91", avgConsumption: 8.5, popularity: 16, category: "suv" },
    { make: "Toyota", makeAr: "تويوتا", model: "86", modelAr: "86", yearFrom: 2012, yearTo: 2026, tankCapacity: 50, fuelType: "95", avgConsumption: 11.5, popularity: 17, category: "coupe" },
    { make: "Toyota", makeAr: "تويوتا", model: "Supra", modelAr: "سوبرا", yearFrom: 1978, yearTo: 2026, tankCapacity: 52, fuelType: "95", avgConsumption: 10.0, popularity: 18, category: "coupe" },
    { make: "Toyota", makeAr: "تويوتا", model: "Crown", modelAr: "كراون", yearFrom: 1955, yearTo: 2026, tankCapacity: 65, fuelType: "91", avgConsumption: 11.0, popularity: 19, category: "sedan" },
    { make: "Toyota", makeAr: "تويوتا", model: "Sienna", modelAr: "سيينا", yearFrom: 1997, yearTo: 2026, tankCapacity: 75, fuelType: "91", avgConsumption: 9.5, popularity: 20, category: "minivan" },
    
    // هيونداي (15 موديل)
    { make: "Hyundai", makeAr: "هيونداي", model: "Accent", modelAr: "أكسنت", yearFrom: 1994, yearTo: 2026, tankCapacity: 45, fuelType: "91", avgConsumption: 15.0, popularity: 21, category: "sedan" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Elantra", modelAr: "إلنترا", yearFrom: 1990, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 13.5, popularity: 22, category: "sedan" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Sonata", modelAr: "سوناتا", yearFrom: 1985, yearTo: 2026, tankCapacity: 60, fuelType: "91", avgConsumption: 12.0, popularity: 23, category: "sedan" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Tucson", modelAr: "توسان", yearFrom: 2004, yearTo: 2026, tankCapacity: 54, fuelType: "91", avgConsumption: 11.5, popularity: 24, category: "suv" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Santa Fe", modelAr: "سانتا في", yearFrom: 2000, yearTo: 2026, tankCapacity: 67, fuelType: "91", avgConsumption: 10.0, popularity: 25, category: "suv" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Azera", modelAr: "أزيرا", yearFrom: 2005, yearTo: 2023, tankCapacity: 70, fuelType: "91", avgConsumption: 10.5, popularity: 26, category: "sedan" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Creta", modelAr: "كريتا", yearFrom: 2015, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 13.0, popularity: 27, category: "suv" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Palisade", modelAr: "باليسيد", yearFrom: 2018, yearTo: 2026, tankCapacity: 71, fuelType: "91", avgConsumption: 9.0, popularity: 28, category: "suv" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Kona", modelAr: "كونا", yearFrom: 2017, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 13.5, popularity: 29, category: "suv" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Venue", modelAr: "فينيو", yearFrom: 2019, yearTo: 2026, tankCapacity: 45, fuelType: "91", avgConsumption: 14.5, popularity: 30, category: "suv" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Genesis", modelAr: "جينيسيس", yearFrom: 2008, yearTo: 2016, tankCapacity: 77, fuelType: "95", avgConsumption: 9.0, popularity: 31, category: "sedan" },
    { make: "Hyundai", makeAr: "هيونداي", model: "Veloster", modelAr: "فيلوستر", yearFrom: 2011, yearTo: 2022, tankCapacity: 50, fuelType: "91", avgConsumption: 12.5, popularity: 32, category: "hatchback" },
    { make: "Hyundai", makeAr: "هيونداي", model: "i10", modelAr: "آي 10", yearFrom: 2007, yearTo: 2026, tankCapacity: 35, fuelType: "91", avgConsumption: 18.0, popularity: 33, category: "hatchback" },
    { make: "Hyundai", makeAr: "هيونداي", model: "i20", modelAr: "آي 20", yearFrom: 2008, yearTo: 2026, tankCapacity: 40, fuelType: "91", avgConsumption: 16.0, popularity: 34, category: "hatchback" },
    { make: "Hyundai", makeAr: "هيونداي", model: "i30", modelAr: "آي 30", yearFrom: 2007, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 14.0, popularity: 35, category: "hatchback" },
    
    // كيا (12 موديل)
    { make: "Kia", makeAr: "كيا", model: "Cerato", modelAr: "سيراتو", yearFrom: 2003, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 13.0, popularity: 36, category: "sedan" },
    { make: "Kia", makeAr: "كيا", model: "Optima", modelAr: "أوبتيما", yearFrom: 2000, yearTo: 2021, tankCapacity: 70, fuelType: "91", avgConsumption: 11.5, popularity: 37, category: "sedan" },
    { make: "Kia", makeAr: "كيا", model: "K5", modelAr: "كي 5", yearFrom: 2021, yearTo: 2026, tankCapacity: 52, fuelType: "91", avgConsumption: 12.0, popularity: 38, category: "sedan" },
    { make: "Kia", makeAr: "كيا", model: "Sportage", modelAr: "سبورتاج", yearFrom: 1993, yearTo: 2026, tankCapacity: 54, fuelType: "91", avgConsumption: 11.0, popularity: 39, category: "suv" },
    { make: "Kia", makeAr: "كيا", model: "Sorento", modelAr: "سورينتو", yearFrom: 2002, yearTo: 2026, tankCapacity: 67, fuelType: "91", avgConsumption: 10.0, popularity: 40, category: "suv" },
    { make: "Kia", makeAr: "كيا", model: "Picanto", modelAr: "بيكانتو", yearFrom: 2004, yearTo: 2026, tankCapacity: 35, fuelType: "91", avgConsumption: 18.0, popularity: 41, category: "hatchback" },
    { make: "Kia", makeAr: "كيا", model: "Rio", modelAr: "ريو", yearFrom: 1999, yearTo: 2026, tankCapacity: 43, fuelType: "91", avgConsumption: 15.5, popularity: 42, category: "sedan" },
    { make: "Kia", makeAr: "كيا", model: "Carnival", modelAr: "كرنفال", yearFrom: 1998, yearTo: 2026, tankCapacity: 80, fuelType: "91", avgConsumption: 9.0, popularity: 43, category: "minivan" },
    { make: "Kia", makeAr: "كيا", model: "Telluride", modelAr: "تيلورايد", yearFrom: 2019, yearTo: 2026, tankCapacity: 71, fuelType: "91", avgConsumption: 9.0, popularity: 44, category: "suv" },
    { make: "Kia", makeAr: "كيا", model: "Stinger", modelAr: "ستينجر", yearFrom: 2017, yearTo: 2026, tankCapacity: 60, fuelType: "95", avgConsumption: 10.5, popularity: 45, category: "sedan" },
    { make: "Kia", makeAr: "كيا", model: "Cadenza", modelAr: "كادينزا", yearFrom: 2009, yearTo: 2022, tankCapacity: 70, fuelType: "91", avgConsumption: 10.0, popularity: 46, category: "sedan" },
    { make: "Kia", makeAr: "كيا", model: "Seltos", modelAr: "سيلتوس", yearFrom: 2019, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 13.0, popularity: 47, category: "suv" },
    
    // نيسان (12 موديل)
    { make: "Nissan", makeAr: "نيسان", model: "Altima", modelAr: "التيما", yearFrom: 1992, yearTo: 2026, tankCapacity: 61, fuelType: "91", avgConsumption: 11.5, popularity: 48, category: "sedan" },
    { make: "Nissan", makeAr: "نيسان", model: "Patrol", modelAr: "باترول", yearFrom: 1951, yearTo: 2026, tankCapacity: 100, fuelType: "91", avgConsumption: 7.5, popularity: 49, category: "suv" },
    { make: "Nissan", makeAr: "نيسان", model: "Sunny", modelAr: "صني", yearFrom: 1966, yearTo: 2026, tankCapacity: 41, fuelType: "91", avgConsumption: 15.0, popularity: 50, category: "sedan" },
    { make: "Nissan", makeAr: "نيسان", model: "X-Trail", modelAr: "إكس تريل", yearFrom: 2000, yearTo: 2026, tankCapacity: 60, fuelType: "91", avgConsumption: 10.5, popularity: 51, category: "suv" },
    { make: "Nissan", makeAr: "نيسان", model: "Pathfinder", modelAr: "باثفايندر", yearFrom: 1985, yearTo: 2026, tankCapacity: 74, fuelType: "91", avgConsumption: 9.5, popularity: 52, category: "suv" },
    { make: "Nissan", makeAr: "نيسان", model: "Maxima", modelAr: "ماكسيما", yearFrom: 1981, yearTo: 2023, tankCapacity: 76, fuelType: "91", avgConsumption: 10.0, popularity: 53, category: "sedan" },
    { make: "Nissan", makeAr: "نيسان", model: "Sentra", modelAr: "سنترا", yearFrom: 1982, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 13.0, popularity: 54, category: "sedan" },
    { make: "Nissan", makeAr: "نيسان", model: "Armada", modelAr: "أرمادا", yearFrom: 2003, yearTo: 2026, tankCapacity: 98, fuelType: "91", avgConsumption: 7.0, popularity: 55, category: "suv" },
    { make: "Nissan", makeAr: "نيسان", model: "Titan", modelAr: "تيتان", yearFrom: 2003, yearTo: 2026, tankCapacity: 98, fuelType: "91", avgConsumption: 7.5, popularity: 56, category: "pickup" },
    { make: "Nissan", makeAr: "نيسان", model: "Navara", modelAr: "نافارا", yearFrom: 1997, yearTo: 2026, tankCapacity: 80, fuelType: "diesel", avgConsumption: 10.0, popularity: 57, category: "pickup" },
    { make: "Nissan", makeAr: "نيسان", model: "Kicks", modelAr: "كيكس", yearFrom: 2016, yearTo: 2026, tankCapacity: 41, fuelType: "91", avgConsumption: 15.0, popularity: 58, category: "suv" },
    { make: "Nissan", makeAr: "نيسان", model: "370Z", modelAr: "370 زد", yearFrom: 2009, yearTo: 2020, tankCapacity: 72, fuelType: "95", avgConsumption: 9.5, popularity: 59, category: "coupe" },
    
    // هوندا (12 موديل)
    { make: "Honda", makeAr: "هوندا", model: "Accord", modelAr: "أكورد", yearFrom: 1976, yearTo: 2026, tankCapacity: 56, fuelType: "91", avgConsumption: 12.0, popularity: 60, category: "sedan" },
    { make: "Honda", makeAr: "هوندا", model: "Civic", modelAr: "سيفيك", yearFrom: 1972, yearTo: 2026, tankCapacity: 47, fuelType: "91", avgConsumption: 14.0, popularity: 61, category: "sedan" },
    { make: "Honda", makeAr: "هوندا", model: "CR-V", modelAr: "سي آر في", yearFrom: 1995, yearTo: 2026, tankCapacity: 57, fuelType: "91", avgConsumption: 11.0, popularity: 62, category: "suv" },
    { make: "Honda", makeAr: "هوندا", model: "Pilot", modelAr: "بايلوت", yearFrom: 2002, yearTo: 2026, tankCapacity: 73, fuelType: "91", avgConsumption: 9.0, popularity: 63, category: "suv" },
    { make: "Honda", makeAr: "هوندا", model: "HR-V", modelAr: "إتش آر في", yearFrom: 1998, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 13.0, popularity: 64, category: "suv" },
    { make: "Honda", makeAr: "هوندا", model: "Odyssey", modelAr: "أوديسي", yearFrom: 1994, yearTo: 2026, tankCapacity: 75, fuelType: "91", avgConsumption: 9.5, popularity: 65, category: "minivan" },
    { make: "Honda", makeAr: "هوندا", model: "City", modelAr: "سيتي", yearFrom: 1981, yearTo: 2026, tankCapacity: 40, fuelType: "91", avgConsumption: 16.0, popularity: 66, category: "sedan" },
    { make: "Honda", makeAr: "هوندا", model: "Jazz", modelAr: "جاز", yearFrom: 2001, yearTo: 2026, tankCapacity: 40, fuelType: "91", avgConsumption: 15.5, popularity: 67, category: "hatchback" },
    { make: "Honda", makeAr: "هوندا", model: "Passport", modelAr: "باسبورت", yearFrom: 1993, yearTo: 2026, tankCapacity: 74, fuelType: "91", avgConsumption: 9.5, popularity: 68, category: "suv" },
    { make: "Honda", makeAr: "هوندا", model: "Ridgeline", modelAr: "ريدجلاين", yearFrom: 2005, yearTo: 2026, tankCapacity: 83, fuelType: "91", avgConsumption: 9.0, popularity: 69, category: "pickup" },
    { make: "Honda", makeAr: "هوندا", model: "S2000", modelAr: "إس 2000", yearFrom: 1999, yearTo: 2009, tankCapacity: 50, fuelType: "95", avgConsumption: 11.0, popularity: 70, category: "convertible" },
    { make: "Honda", makeAr: "هوندا", model: "Prelude", modelAr: "بريلود", yearFrom: 1978, yearTo: 2001, tankCapacity: 60, fuelType: "91", avgConsumption: 11.5, popularity: 71, category: "coupe" },
    
    // فورد - موسعة (15 موديل مع كراون فيكتوريا وماركيز)
    { make: "Ford", makeAr: "فورد", model: "Crown Victoria", modelAr: "كراون فيكتوريا", yearFrom: 1991, yearTo: 2011, tankCapacity: 72, fuelType: "91", avgConsumption: 8.5, popularity: 72, category: "sedan" },
    { make: "Ford", makeAr: "فورد", model: "Taurus", modelAr: "تورس", yearFrom: 1985, yearTo: 2019, tankCapacity: 70, fuelType: "91", avgConsumption: 10.0, popularity: 73, category: "sedan" },
    { make: "Ford", makeAr: "فورد", model: "Explorer", modelAr: "إكسبلورر", yearFrom: 1990, yearTo: 2026, tankCapacity: 75, fuelType: "91", avgConsumption: 9.0, popularity: 74, category: "suv" },
    { make: "Ford", makeAr: "فورد", model: "Edge", modelAr: "إيدج", yearFrom: 2006, yearTo: 2026, tankCapacity: 68, fuelType: "91", avgConsumption: 10.0, popularity: 75, category: "suv" },
    { make: "Ford", makeAr: "فورد", model: "F-150", modelAr: "إف-150", yearFrom: 1975, yearTo: 2026, tankCapacity: 98, fuelType: "91", avgConsumption: 8.0, popularity: 76, category: "pickup" },
    { make: "Ford", makeAr: "فورد", model: "Expedition", modelAr: "إكسبيديشن", yearFrom: 1996, yearTo: 2026, tankCapacity: 104, fuelType: "91", avgConsumption: 7.5, popularity: 77, category: "suv" },
    { make: "Ford", makeAr: "فورد", model: "Fusion", modelAr: "فيوجن", yearFrom: 2005, yearTo: 2020, tankCapacity: 62, fuelType: "91", avgConsumption: 11.5, popularity: 78, category: "sedan" },
    { make: "Ford", makeAr: "فورد", model: "Mustang", modelAr: "موستانج", yearFrom: 1964, yearTo: 2026, tankCapacity: 61, fuelType: "95", avgConsumption: 9.5, popularity: 79, category: "coupe" },
    { make: "Ford", makeAr: "فورد", model: "Focus", modelAr: "فوكس", yearFrom: 1998, yearTo: 2018, tankCapacity: 52, fuelType: "91", avgConsumption: 13.5, popularity: 80, category: "hatchback" },
    { make: "Ford", makeAr: "فورد", model: "Escape", modelAr: "إسكيب", yearFrom: 2000, yearTo: 2026, tankCapacity: 57, fuelType: "91", avgConsumption: 11.0, popularity: 81, category: "suv" },
    { make: "Ford", makeAr: "فورد", model: "Ranger", modelAr: "رينجر", yearFrom: 1983, yearTo: 2026, tankCapacity: 80, fuelType: "diesel", avgConsumption: 10.5, popularity: 82, category: "pickup" },
    { make: "Ford", makeAr: "فورد", model: "F-250", modelAr: "إف-250", yearFrom: 1953, yearTo: 2026, tankCapacity: 136, fuelType: "diesel", avgConsumption: 7.0, popularity: 83, category: "pickup" },
    { make: "Ford", makeAr: "فورد", model: "Bronco", modelAr: "برونكو", yearFrom: 1966, yearTo: 2026, tankCapacity: 74, fuelType: "91", avgConsumption: 8.5, popularity: 84, category: "suv" },
    { make: "Ford", makeAr: "فورد", model: "Flex", modelAr: "فليكس", yearFrom: 2008, yearTo: 2019, tankCapacity: 75, fuelType: "91", avgConsumption: 9.0, popularity: 85, category: "suv" },
    { make: "Ford", makeAr: "فورد", model: "Excursion", modelAr: "إكسكورشن", yearFrom: 1999, yearTo: 2005, tankCapacity: 166, fuelType: "diesel", avgConsumption: 6.5, popularity: 86, category: "suv" },
    
    // ميركوري (6 موديلات - علامة فورد الفاخرة)
    { make: "Mercury", makeAr: "ميركوري", model: "Grand Marquis", modelAr: "جراند ماركيز", yearFrom: 1983, yearTo: 2011, tankCapacity: 72, fuelType: "91", avgConsumption: 8.5, popularity: 87, category: "sedan" },
    { make: "Mercury", makeAr: "ميركوري", model: "Mountaineer", modelAr: "ماونتينير", yearFrom: 1996, yearTo: 2010, tankCapacity: 75, fuelType: "91", avgConsumption: 9.0, popularity: 88, category: "suv" },
    { make: "Mercury", makeAr: "ميركوري", model: "Mariner", modelAr: "مارينر", yearFrom: 2004, yearTo: 2011, tankCapacity: 57, fuelType: "91", avgConsumption: 11.0, popularity: 89, category: "suv" },
    { make: "Mercury", makeAr: "ميركوري", model: "Milan", modelAr: "ميلان", yearFrom: 2005, yearTo: 2011, tankCapacity: 62, fuelType: "91", avgConsumption: 11.5, popularity: 90, category: "sedan" },
    { make: "Mercury", makeAr: "ميركوري", model: "Sable", modelAr: "سيبل", yearFrom: 1985, yearTo: 2009, tankCapacity: 70, fuelType: "91", avgConsumption: 10.0, popularity: 91, category: "sedan" },
    { make: "Mercury", makeAr: "ميركوري", model: "Villager", modelAr: "فيليجر", yearFrom: 1992, yearTo: 2002, tankCapacity: 75, fuelType: "91", avgConsumption: 9.5, popularity: 92, category: "minivan" },
    
    // لينكون (8 موديلات - علامة فورد الفاخرة)
    { make: "Lincoln", makeAr: "لينكون", model: "Town Car", modelAr: "تاون كار", yearFrom: 1981, yearTo: 2011, tankCapacity: 72, fuelType: "91", avgConsumption: 8.5, popularity: 93, category: "sedan" },
    { make: "Lincoln", makeAr: "لينكون", model: "Navigator", modelAr: "نافيجيتور", yearFrom: 1997, yearTo: 2026, tankCapacity: 106, fuelType: "91", avgConsumption: 7.0, popularity: 94, category: "suv" },
    { make: "Lincoln", makeAr: "لينكون", model: "Continental", modelAr: "كونتيننتال", yearFrom: 1939, yearTo: 2020, tankCapacity: 66, fuelType: "95", avgConsumption: 10.0, popularity: 95, category: "sedan" },
    { make: "Lincoln", makeAr: "لينكون", model: "MKZ", modelAr: "إم كي زد", yearFrom: 2006, yearTo: 2020, tankCapacity: 66, fuelType: "91", avgConsumption: 10.5, popularity: 96, category: "sedan" },
    { make: "Lincoln", makeAr: "لينكون", model: "MKX", modelAr: "إم كي إكس", yearFrom: 2007, yearTo: 2018, tankCapacity: 68, fuelType: "91", avgConsumption: 10.0, popularity: 97, category: "suv" },
    { make: "Lincoln", makeAr: "لينكون", model: "Aviator", modelAr: "أفياتور", yearFrom: 2002, yearTo: 2026, tankCapacity: 75, fuelType: "95", avgConsumption: 9.0, popularity: 98, category: "suv" },
    { make: "Lincoln", makeAr: "لينكون", model: "Corsair", modelAr: "كورسير", yearFrom: 2019, yearTo: 2026, tankCapacity: 56, fuelType: "91", avgConsumption: 11.0, popularity: 99, category: "suv" },
    { make: "Lincoln", makeAr: "لينكون", model: "Mark LT", modelAr: "مارك إل تي", yearFrom: 2005, yearTo: 2014, tankCapacity: 98, fuelType: "91", avgConsumption: 8.0, popularity: 100, category: "pickup" },
    
    // مازدا (8 موديلات)
    { make: "Mazda", makeAr: "مازدا", model: "3", modelAr: "3", yearFrom: 2003, yearTo: 2026, tankCapacity: 51, fuelType: "91", avgConsumption: 13.5, popularity: 101, category: "sedan" },
    { make: "Mazda", makeAr: "مازدا", model: "6", modelAr: "6", yearFrom: 2002, yearTo: 2026, tankCapacity: 62, fuelType: "91", avgConsumption: 11.5, popularity: 102, category: "sedan" },
    { make: "Mazda", makeAr: "مازدا", model: "CX-5", modelAr: "سي إكس-5", yearFrom: 2012, yearTo: 2026, tankCapacity: 58, fuelType: "91", avgConsumption: 11.0, popularity: 103, category: "suv" },
    { make: "Mazda", makeAr: "مازدا", model: "CX-9", modelAr: "سي إكس-9", yearFrom: 2006, yearTo: 2026, tankCapacity: 74, fuelType: "91", avgConsumption: 9.5, popularity: 104, category: "suv" },
    { make: "Mazda", makeAr: "مازدا", model: "CX-3", modelAr: "سي إكس-3", yearFrom: 2015, yearTo: 2026, tankCapacity: 48, fuelType: "91", avgConsumption: 14.0, popularity: 105, category: "suv" },
    { make: "Mazda", makeAr: "مازدا", model: "CX-30", modelAr: "سي إكس-30", yearFrom: 2019, yearTo: 2026, tankCapacity: 48, fuelType: "91", avgConsumption: 13.0, popularity: 106, category: "suv" },
    { make: "Mazda", makeAr: "مازدا", model: "MX-5", modelAr: "إم إكس-5", yearFrom: 1989, yearTo: 2026, tankCapacity: 45, fuelType: "95", avgConsumption: 12.5, popularity: 107, category: "convertible" },
    { make: "Mazda", makeAr: "مازدا", model: "RX-8", modelAr: "آر إكس-8", yearFrom: 2003, yearTo: 2012, tankCapacity: 65, fuelType: "95", avgConsumption: 8.5, popularity: 108, category: "coupe" },
    
    // شيفروليه (12 موديل)
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Tahoe", modelAr: "تاهو", yearFrom: 1995, yearTo: 2026, tankCapacity: 91, fuelType: "91", avgConsumption: 7.5, popularity: 109, category: "suv" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Suburban", modelAr: "سوبربان", yearFrom: 1935, yearTo: 2026, tankCapacity: 117, fuelType: "91", avgConsumption: 7.0, popularity: 110, category: "suv" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Silverado", modelAr: "سيلفرادو", yearFrom: 1998, yearTo: 2026, tankCapacity: 98, fuelType: "91", avgConsumption: 8.0, popularity: 111, category: "pickup" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Malibu", modelAr: "ماليبو", yearFrom: 1964, yearTo: 2026, tankCapacity: 61, fuelType: "91", avgConsumption: 11.5, popularity: 112, category: "sedan" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Camaro", modelAr: "كامارو", yearFrom: 1966, yearTo: 2024, tankCapacity: 72, fuelType: "95", avgConsumption: 9.0, popularity: 113, category: "coupe" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Corvette", modelAr: "كورفيت", yearFrom: 1953, yearTo: 2026, tankCapacity: 70, fuelType: "95", avgConsumption: 8.5, popularity: 114, category: "coupe" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Traverse", modelAr: "ترافيرس", yearFrom: 2008, yearTo: 2026, tankCapacity: 83, fuelType: "91", avgConsumption: 9.0, popularity: 115, category: "suv" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Equinox", modelAr: "إكوينوكس", yearFrom: 2004, yearTo: 2026, tankCapacity: 59, fuelType: "91", avgConsumption: 11.0, popularity: 116, category: "suv" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Blazer", modelAr: "بليزر", yearFrom: 1969, yearTo: 2026, tankCapacity: 61, fuelType: "91", avgConsumption: 10.5, popularity: 117, category: "suv" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Colorado", modelAr: "كولورادو", yearFrom: 2003, yearTo: 2026, tankCapacity: 76, fuelType: "91", avgConsumption: 10.0, popularity: 118, category: "pickup" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Impala", modelAr: "إمبالا", yearFrom: 1957, yearTo: 2020, tankCapacity: 70, fuelType: "91", avgConsumption: 10.0, popularity: 119, category: "sedan" },
    { make: "Chevrolet", makeAr: "شيفروليه", model: "Caprice", modelAr: "كابريس", yearFrom: 1965, yearTo: 2017, tankCapacity: 72, fuelType: "91", avgConsumption: 8.5, popularity: 120, category: "sedan" },
    
    // جي إم سي (8 موديلات)
    { make: "GMC", makeAr: "جي إم سي", model: "Yukon", modelAr: "يوكن", yearFrom: 1991, yearTo: 2026, tankCapacity: 91, fuelType: "91", avgConsumption: 7.5, popularity: 121, category: "suv" },
    { make: "GMC", makeAr: "جي إم سي", model: "Yukon XL", modelAr: "يوكن إكس إل", yearFrom: 1999, yearTo: 2026, tankCapacity: 117, fuelType: "91", avgConsumption: 7.0, popularity: 122, category: "suv" },
    { make: "GMC", makeAr: "جي إم سي", model: "Sierra", modelAr: "سييرا", yearFrom: 1998, yearTo: 2026, tankCapacity: 98, fuelType: "91", avgConsumption: 8.0, popularity: 123, category: "pickup" },
    { make: "GMC", makeAr: "جي إم سي", model: "Acadia", modelAr: "أكاديا", yearFrom: 2006, yearTo: 2026, tankCapacity: 78, fuelType: "91", avgConsumption: 9.5, popularity: 124, category: "suv" },
    { make: "GMC", makeAr: "جي إم سي", model: "Terrain", modelAr: "تيرين", yearFrom: 2009, yearTo: 2026, tankCapacity: 59, fuelType: "91", avgConsumption: 11.0, popularity: 125, category: "suv" },
    { make: "GMC", makeAr: "جي إم سي", model: "Canyon", modelAr: "كانيون", yearFrom: 2003, yearTo: 2026, tankCapacity: 76, fuelType: "91", avgConsumption: 10.0, popularity: 126, category: "pickup" },
    { make: "GMC", makeAr: "جي إم سي", model: "Denali", modelAr: "دينالي", yearFrom: 1999, yearTo: 2026, tankCapacity: 91, fuelType: "91", avgConsumption: 7.5, popularity: 127, category: "suv" },
    { make: "GMC", makeAr: "جي إم سي", model: "Envoy", modelAr: "إنفوي", yearFrom: 1998, yearTo: 2009, tankCapacity: 83, fuelType: "91", avgConsumption: 9.0, popularity: 128, category: "suv" },
    
    // كاديلاك (8 موديلات)
    { make: "Cadillac", makeAr: "كاديلاك", model: "Escalade", modelAr: "إسكاليد", yearFrom: 1998, yearTo: 2026, tankCapacity: 91, fuelType: "95", avgConsumption: 7.0, popularity: 129, category: "suv" },
    { make: "Cadillac", makeAr: "كاديلاك", model: "CTS", modelAr: "سي تي إس", yearFrom: 2002, yearTo: 2019, tankCapacity: 66, fuelType: "95", avgConsumption: 10.0, popularity: 130, category: "sedan" },
    { make: "Cadillac", makeAr: "كاديلاك", model: "CT6", modelAr: "سي تي 6", yearFrom: 2016, yearTo: 2020, tankCapacity: 72, fuelType: "95", avgConsumption: 9.5, popularity: 131, category: "sedan" },
    { make: "Cadillac", makeAr: "كاديلاك", model: "XT5", modelAr: "إكس تي 5", yearFrom: 2016, yearTo: 2026, tankCapacity: 68, fuelType: "91", avgConsumption: 10.0, popularity: 132, category: "suv" },
    { make: "Cadillac", makeAr: "كاديلاك", model: "XT6", modelAr: "إكس تي 6", yearFrom: 2019, yearTo: 2026, tankCapacity: 78, fuelType: "91", avgConsumption: 9.5, popularity: 133, category: "suv" },
    { make: "Cadillac", makeAr: "كاديلاك", model: "DeVille", modelAr: "ديفيل", yearFrom: 1949, yearTo: 2005, tankCapacity: 75, fuelType: "91", avgConsumption: 8.0, popularity: 134, category: "sedan" },
    { make: "Cadillac", makeAr: "كاديلاك", model: "STS", modelAr: "إس تي إس", yearFrom: 2004, yearTo: 2011, tankCapacity: 66, fuelType: "95", avgConsumption: 9.5, popularity: 135, category: "sedan" },
    { make: "Cadillac", makeAr: "كاديلاك", model: "XLR", modelAr: "إكس إل آر", yearFrom: 2003, yearTo: 2009, tankCapacity: 68, fuelType: "95", avgConsumption: 9.0, popularity: 136, category: "convertible" },
    
    // ميتسوبيشي (8 موديلات)
    { make: "Mitsubishi", makeAr: "ميتسوبيشي", model: "Pajero", modelAr: "باجيرو", yearFrom: 1982, yearTo: 2021, tankCapacity: 88, fuelType: "91", avgConsumption: 9.0, popularity: 137, category: "suv" },
    { make: "Mitsubishi", makeAr: "ميتسوبيشي", model: "Lancer", modelAr: "لانسر", yearFrom: 1973, yearTo: 2017, tankCapacity: 59, fuelType: "91", avgConsumption: 12.5, popularity: 138, category: "sedan" },
    { make: "Mitsubishi", makeAr: "ميتسوبيشي", model: "Outlander", modelAr: "أوتلاندر", yearFrom: 2003, yearTo: 2026, tankCapacity: 63, fuelType: "91", avgConsumption: 10.5, popularity: 139, category: "suv" },
    { make: "Mitsubishi", makeAr: "ميتسوبيشي", model: "ASX", modelAr: "إيه إس إكس", yearFrom: 2010, yearTo: 2026, tankCapacity: 60, fuelType: "91", avgConsumption: 12.0, popularity: 140, category: "suv" },
    { make: "Mitsubishi", makeAr: "ميتسوبيشي", model: "L200", modelAr: "إل 200", yearFrom: 1978, yearTo: 2026, tankCapacity: 75, fuelType: "diesel", avgConsumption: 10.5, popularity: 141, category: "pickup" },
    { make: "Mitsubishi", makeAr: "ميتسوبيشي", model: "Eclipse", modelAr: "إكليبس", yearFrom: 1989, yearTo: 2012, tankCapacity: 59, fuelType: "91", avgConsumption: 11.0, popularity: 142, category: "coupe" },
    { make: "Mitsubishi", makeAr: "ميتسوبيشي", model: "Montero", modelAr: "مونتيرو", yearFrom: 1982, yearTo: 2006, tankCapacity: 88, fuelType: "91", avgConsumption: 9.0, popularity: 143, category: "suv" },
    { make: "Mitsubishi", makeAr: "ميتسوبيشي", model: "Galant", modelAr: "جالانت", yearFrom: 1969, yearTo: 2012, tankCapacity: 67, fuelType: "91", avgConsumption: 11.0, popularity: 144, category: "sedan" },
    
    // لكزس (10 موديلات)
    { make: "Lexus", makeAr: "لكزس", model: "ES", modelAr: "إي إس", yearFrom: 1989, yearTo: 2026, tankCapacity: 60, fuelType: "95", avgConsumption: 11.0, popularity: 145, category: "sedan" },
    { make: "Lexus", makeAr: "لكزس", model: "LX", modelAr: "إل إكس", yearFrom: 1995, yearTo: 2026, tankCapacity: 93, fuelType: "95", avgConsumption: 7.5, popularity: 146, category: "suv" },
    { make: "Lexus", makeAr: "لكزس", model: "RX", modelAr: "آر إكس", yearFrom: 1998, yearTo: 2026, tankCapacity: 72, fuelType: "95", avgConsumption: 9.5, popularity: 147, category: "suv" },
    { make: "Lexus", makeAr: "لكزس", model: "GX", modelAr: "جي إكس", yearFrom: 2002, yearTo: 2026, tankCapacity: 87, fuelType: "95", avgConsumption: 8.0, popularity: 148, category: "suv" },
    { make: "Lexus", makeAr: "لكزس", model: "IS", modelAr: "آي إس", yearFrom: 1998, yearTo: 2026, tankCapacity: 66, fuelType: "95", avgConsumption: 10.5, popularity: 149, category: "sedan" },
    { make: "Lexus", makeAr: "لكزس", model: "LS", modelAr: "إل إس", yearFrom: 1989, yearTo: 2026, tankCapacity: 82, fuelType: "95", avgConsumption: 9.0, popularity: 150, category: "sedan" },
    { make: "Lexus", makeAr: "لكزس", model: "NX", modelAr: "إن إكس", yearFrom: 2014, yearTo: 2026, tankCapacity: 56, fuelType: "95", avgConsumption: 11.5, popularity: 151, category: "suv" },
    { make: "Lexus", makeAr: "لكزس", model: "UX", modelAr: "يو إكس", yearFrom: 2018, yearTo: 2026, tankCapacity: 47, fuelType: "95", avgConsumption: 13.0, popularity: 152, category: "suv" },
    { make: "Lexus", makeAr: "لكزس", model: "GS", modelAr: "جي إس", yearFrom: 1991, yearTo: 2020, tankCapacity: 71, fuelType: "95", avgConsumption: 10.0, popularity: 153, category: "sedan" },
    { make: "Lexus", makeAr: "لكزس", model: "RC", modelAr: "آر سي", yearFrom: 2014, yearTo: 2026, tankCapacity: 66, fuelType: "95", avgConsumption: 10.0, popularity: 154, category: "coupe" },
    
    // إنفينيتي (8 موديلات)
    { make: "Infiniti", makeAr: "إنفينيتي", model: "QX80", modelAr: "كيو إكس 80", yearFrom: 2010, yearTo: 2026, tankCapacity: 98, fuelType: "95", avgConsumption: 7.0, popularity: 155, category: "suv" },
    { make: "Infiniti", makeAr: "إنفينيتي", model: "QX60", modelAr: "كيو إكس 60", yearFrom: 2012, yearTo: 2026, tankCapacity: 74, fuelType: "95", avgConsumption: 9.0, popularity: 156, category: "suv" },
    { make: "Infiniti", makeAr: "إنفينيتي", model: "QX50", modelAr: "كيو إكس 50", yearFrom: 2013, yearTo: 2026, tankCapacity: 60, fuelType: "95", avgConsumption: 10.5, popularity: 157, category: "suv" },
    { make: "Infiniti", makeAr: "إنفينيتي", model: "Q50", modelAr: "كيو 50", yearFrom: 2013, yearTo: 2026, tankCapacity: 74, fuelType: "95", avgConsumption: 10.0, popularity: 158, category: "sedan" },
    { make: "Infiniti", makeAr: "إنفينيتي", model: "Q70", modelAr: "كيو 70", yearFrom: 2010, yearTo: 2019, tankCapacity: 80, fuelType: "95", avgConsumption: 9.0, popularity: 159, category: "sedan" },
    { make: "Infiniti", makeAr: "إنفينيتي", model: "FX", modelAr: "إف إكس", yearFrom: 2002, yearTo: 2013, tankCapacity: 90, fuelType: "95", avgConsumption: 8.5, popularity: 160, category: "suv" },
    { make: "Infiniti", makeAr: "إنفينيتي", model: "G35", modelAr: "جي 35", yearFrom: 2002, yearTo: 2008, tankCapacity: 76, fuelType: "95", avgConsumption: 9.5, popularity: 161, category: "sedan" },
    { make: "Infiniti", makeAr: "إنفينيتي", model: "G37", modelAr: "جي 37", yearFrom: 2008, yearTo: 2013, tankCapacity: 76, fuelType: "95", avgConsumption: 9.0, popularity: 162, category: "sedan" },
    
    // جيب (8 موديلات)
    { make: "Jeep", makeAr: "جيب", model: "Wrangler", modelAr: "رانجلر", yearFrom: 1986, yearTo: 2026, tankCapacity: 70, fuelType: "91", avgConsumption: 8.5, popularity: 163, category: "suv" },
    { make: "Jeep", makeAr: "جيب", model: "Grand Cherokee", modelAr: "جراند شيروكي", yearFrom: 1992, yearTo: 2026, tankCapacity: 93, fuelType: "91", avgConsumption: 8.0, popularity: 164, category: "suv" },
    { make: "Jeep", makeAr: "جيب", model: "Cherokee", modelAr: "شيروكي", yearFrom: 1974, yearTo: 2026, tankCapacity: 59, fuelType: "91", avgConsumption: 10.0, popularity: 165, category: "suv" },
    { make: "Jeep", makeAr: "جيب", model: "Compass", modelAr: "كومباس", yearFrom: 2006, yearTo: 2026, tankCapacity: 51, fuelType: "91", avgConsumption: 12.0, popularity: 166, category: "suv" },
    { make: "Jeep", makeAr: "جيب", model: "Renegade", modelAr: "رينيجيد", yearFrom: 2014, yearTo: 2026, tankCapacity: 48, fuelType: "91", avgConsumption: 13.0, popularity: 167, category: "suv" },
    { make: "Jeep", makeAr: "جيب", model: "Liberty", modelAr: "ليبرتي", yearFrom: 2001, yearTo: 2012, tankCapacity: 74, fuelType: "91", avgConsumption: 9.5, popularity: 168, category: "suv" },
    { make: "Jeep", makeAr: "جيب", model: "Commander", modelAr: "كوماندر", yearFrom: 2005, yearTo: 2010, tankCapacity: 85, fuelType: "91", avgConsumption: 8.0, popularity: 169, category: "suv" },
    { make: "Jeep", makeAr: "جيب", model: "Gladiator", modelAr: "جلادياتور", yearFrom: 2019, yearTo: 2026, tankCapacity: 83, fuelType: "91", avgConsumption: 8.5, popularity: 170, category: "pickup" },
    
    // دودج (8 موديلات)
    { make: "Dodge", makeAr: "دودج", model: "Charger", modelAr: "تشارجر", yearFrom: 1966, yearTo: 2026, tankCapacity: 70, fuelType: "91", avgConsumption: 9.0, popularity: 171, category: "sedan" },
    { make: "Dodge", makeAr: "دودج", model: "Challenger", modelAr: "تشالنجر", yearFrom: 1970, yearTo: 2024, tankCapacity: 72, fuelType: "95", avgConsumption: 8.5, popularity: 172, category: "coupe" },
    { make: "Dodge", makeAr: "دودج", model: "Durango", modelAr: "دورانجو", yearFrom: 1997, yearTo: 2026, tankCapacity: 93, fuelType: "91", avgConsumption: 8.0, popularity: 173, category: "suv" },
    { make: "Dodge", makeAr: "دودج", model: "Journey", modelAr: "جورني", yearFrom: 2008, yearTo: 2020, tankCapacity: 78, fuelType: "91", avgConsumption: 10.0, popularity: 174, category: "suv" },
    { make: "Dodge", makeAr: "دودج", model: "Ram 1500", modelAr: "رام 1500", yearFrom: 1981, yearTo: 2026, tankCapacity: 98, fuelType: "91", avgConsumption: 8.0, popularity: 175, category: "pickup" },
    { make: "Dodge", makeAr: "دودج", model: "Ram 2500", modelAr: "رام 2500", yearFrom: 1994, yearTo: 2026, tankCapacity: 136, fuelType: "diesel", avgConsumption: 7.0, popularity: 176, category: "pickup" },
    { make: "Dodge", makeAr: "دودج", model: "Nitro", modelAr: "نيترو", yearFrom: 2006, yearTo: 2012, tankCapacity: 74, fuelType: "91", avgConsumption: 9.5, popularity: 177, category: "suv" },
    { make: "Dodge", makeAr: "دودج", model: "Grand Caravan", modelAr: "جراند كارافان", yearFrom: 1987, yearTo: 2020, tankCapacity: 76, fuelType: "91", avgConsumption: 9.5, popularity: 178, category: "minivan" },
    
    // كرايسلر (6 موديلات)
    { make: "Chrysler", makeAr: "كرايسلر", model: "300", modelAr: "300", yearFrom: 2004, yearTo: 2023, tankCapacity: 72, fuelType: "91", avgConsumption: 9.5, popularity: 179, category: "sedan" },
    { make: "Chrysler", makeAr: "كرايسلر", model: "Pacifica", modelAr: "باسيفيكا", yearFrom: 2016, yearTo: 2026, tankCapacity: 72, fuelType: "91", avgConsumption: 9.5, popularity: 180, category: "minivan" },
    { make: "Chrysler", makeAr: "كرايسلر", model: "Town & Country", modelAr: "تاون آند كانتري", yearFrom: 1990, yearTo: 2016, tankCapacity: 76, fuelType: "91", avgConsumption: 9.0, popularity: 181, category: "minivan" },
    { make: "Chrysler", makeAr: "كرايسلر", model: "PT Cruiser", modelAr: "بي تي كروزر", yearFrom: 2000, yearTo: 2010, tankCapacity: 57, fuelType: "91", avgConsumption: 11.0, popularity: 182, category: "hatchback" },
    { make: "Chrysler", makeAr: "كرايسلر", model: "Sebring", modelAr: "سيبرينج", yearFrom: 1995, yearTo: 2010, tankCapacity: 61, fuelType: "91", avgConsumption: 11.5, popularity: 183, category: "sedan" },
    { make: "Chrysler", makeAr: "كرايسلر", model: "200", modelAr: "200", yearFrom: 2010, yearTo: 2017, tankCapacity: 60, fuelType: "91", avgConsumption: 11.5, popularity: 184, category: "sedan" },
    
    // بي إم دبليو (10 موديلات)
    { make: "BMW", makeAr: "بي إم دبليو", model: "3 Series", modelAr: "الفئة 3", yearFrom: 1975, yearTo: 2026, tankCapacity: 59, fuelType: "95", avgConsumption: 11.5, popularity: 185, category: "sedan" },
    { make: "BMW", makeAr: "بي إم دبليو", model: "5 Series", modelAr: "الفئة 5", yearFrom: 1972, yearTo: 2026, tankCapacity: 68, fuelType: "95", avgConsumption: 10.0, popularity: 186, category: "sedan" },
    { make: "BMW", makeAr: "بي إم دبليو", model: "7 Series", modelAr: "الفئة 7", yearFrom: 1977, yearTo: 2026, tankCapacity: 78, fuelType: "95", avgConsumption: 9.0, popularity: 187, category: "sedan" },
    { make: "BMW", makeAr: "بي إم دبليو", model: "X3", modelAr: "إكس 3", yearFrom: 2003, yearTo: 2026, tankCapacity: 65, fuelType: "95", avgConsumption: 10.5, popularity: 188, category: "suv" },
    { make: "BMW", makeAr: "بي إم دبليو", model: "X5", modelAr: "إكس 5", yearFrom: 1999, yearTo: 2026, tankCapacity: 83, fuelType: "95", avgConsumption: 9.0, popularity: 189, category: "suv" },
    { make: "BMW", makeAr: "بي إم دبليو", model: "X7", modelAr: "إكس 7", yearFrom: 2018, yearTo: 2026, tankCapacity: 83, fuelType: "95", avgConsumption: 8.5, popularity: 190, category: "suv" },
    { make: "BMW", makeAr: "بي إم دبليو", model: "X6", modelAr: "إكس 6", yearFrom: 2008, yearTo: 2026, tankCapacity: 85, fuelType: "95", avgConsumption: 8.5, popularity: 191, category: "suv" },
    { make: "BMW", makeAr: "بي إم دبليو", model: "4 Series", modelAr: "الفئة 4", yearFrom: 2013, yearTo: 2026, tankCapacity: 59, fuelType: "95", avgConsumption: 11.0, popularity: 192, category: "coupe" },
    { make: "BMW", makeAr: "بي إم دبليو", model: "6 Series", modelAr: "الفئة 6", yearFrom: 1976, yearTo: 2019, tankCapacity: 70, fuelType: "95", avgConsumption: 9.5, popularity: 193, category: "coupe" },
    { make: "BMW", makeAr: "بي إم دبليو", model: "Z4", modelAr: "زد 4", yearFrom: 2002, yearTo: 2026, tankCapacity: 52, fuelType: "95", avgConsumption: 10.5, popularity: 194, category: "convertible" },
    
    // مرسيدس (10 موديلات)
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "C-Class", modelAr: "الفئة سي", yearFrom: 1993, yearTo: 2026, tankCapacity: 66, fuelType: "95", avgConsumption: 11.0, popularity: 195, category: "sedan" },
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "E-Class", modelAr: "الفئة إي", yearFrom: 1953, yearTo: 2026, tankCapacity: 66, fuelType: "95", avgConsumption: 10.0, popularity: 196, category: "sedan" },
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "S-Class", modelAr: "الفئة إس", yearFrom: 1972, yearTo: 2026, tankCapacity: 80, fuelType: "95", avgConsumption: 9.0, popularity: 197, category: "sedan" },
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "GLC", modelAr: "جي إل سي", yearFrom: 2015, yearTo: 2026, tankCapacity: 66, fuelType: "95", avgConsumption: 10.5, popularity: 198, category: "suv" },
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "GLE", modelAr: "جي إل إي", yearFrom: 2015, yearTo: 2026, tankCapacity: 85, fuelType: "95", avgConsumption: 9.0, popularity: 199, category: "suv" },
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "GLS", modelAr: "جي إل إس", yearFrom: 2006, yearTo: 2026, tankCapacity: 100, fuelType: "95", avgConsumption: 8.0, popularity: 200, category: "suv" },
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "G-Class", modelAr: "الفئة جي", yearFrom: 1979, yearTo: 2026, tankCapacity: 100, fuelType: "95", avgConsumption: 7.5, popularity: 201, category: "suv" },
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "A-Class", modelAr: "الفئة إيه", yearFrom: 1997, yearTo: 2026, tankCapacity: 43, fuelType: "95", avgConsumption: 14.0, popularity: 202, category: "hatchback" },
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "CLA", modelAr: "سي إل إيه", yearFrom: 2013, yearTo: 2026, tankCapacity: 56, fuelType: "95", avgConsumption: 12.0, popularity: 203, category: "sedan" },
    { make: "Mercedes-Benz", makeAr: "مرسيدس بنز", model: "AMG GT", modelAr: "إيه إم جي جي تي", yearFrom: 2014, yearTo: 2026, tankCapacity: 75, fuelType: "95", avgConsumption: 8.0, popularity: 204, category: "coupe" },
    
    // أودي (8 موديلات)
    { make: "Audi", makeAr: "أودي", model: "A4", modelAr: "إيه 4", yearFrom: 1994, yearTo: 2026, tankCapacity: 58, fuelType: "95", avgConsumption: 11.5, popularity: 205, category: "sedan" },
    { make: "Audi", makeAr: "أودي", model: "A6", modelAr: "إيه 6", yearFrom: 1994, yearTo: 2026, tankCapacity: 73, fuelType: "95", avgConsumption: 10.0, popularity: 206, category: "sedan" },
    { make: "Audi", makeAr: "أودي", model: "A8", modelAr: "إيه 8", yearFrom: 1994, yearTo: 2026, tankCapacity: 82, fuelType: "95", avgConsumption: 9.0, popularity: 207, category: "sedan" },
    { make: "Audi", makeAr: "أودي", model: "Q5", modelAr: "كيو 5", yearFrom: 2008, yearTo: 2026, tankCapacity: 70, fuelType: "95", avgConsumption: 10.5, popularity: 208, category: "suv" },
    { make: "Audi", makeAr: "أودي", model: "Q7", modelAr: "كيو 7", yearFrom: 2005, yearTo: 2026, tankCapacity: 85, fuelType: "95", avgConsumption: 9.0, popularity: 209, category: "suv" },
    { make: "Audi", makeAr: "أودي", model: "Q8", modelAr: "كيو 8", yearFrom: 2018, yearTo: 2026, tankCapacity: 85, fuelType: "95", avgConsumption: 8.5, popularity: 210, category: "suv" },
    { make: "Audi", makeAr: "أودي", model: "A3", modelAr: "إيه 3", yearFrom: 1996, yearTo: 2026, tankCapacity: 50, fuelType: "95", avgConsumption: 13.0, popularity: 211, category: "hatchback" },
    { make: "Audi", makeAr: "أودي", model: "TT", modelAr: "تي تي", yearFrom: 1998, yearTo: 2026, tankCapacity: 55, fuelType: "95", avgConsumption: 11.0, popularity: 212, category: "coupe" },
    
    // فولكسفاجن (8 موديلات)
    { make: "Volkswagen", makeAr: "فولكسفاجن", model: "Jetta", modelAr: "جيتا", yearFrom: 1979, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 13.0, popularity: 213, category: "sedan" },
    { make: "Volkswagen", makeAr: "فولكسفاجن", model: "Passat", modelAr: "باسات", yearFrom: 1973, yearTo: 2026, tankCapacity: 66, fuelType: "91", avgConsumption: 11.0, popularity: 214, category: "sedan" },
    { make: "Volkswagen", makeAr: "فولكسفاجن", model: "Golf", modelAr: "جولف", yearFrom: 1974, yearTo: 2026, tankCapacity: 50, fuelType: "91", avgConsumption: 14.0, popularity: 215, category: "hatchback" },
    { make: "Volkswagen", makeAr: "فولكسفاجن", model: "Tiguan", modelAr: "تيجوان", yearFrom: 2007, yearTo: 2026, tankCapacity: 60, fuelType: "91", avgConsumption: 11.0, popularity: 216, category: "suv" },
    { make: "Volkswagen", makeAr: "فولكسفاجن", model: "Touareg", modelAr: "طوارق", yearFrom: 2002, yearTo: 2026, tankCapacity: 90, fuelType: "95", avgConsumption: 9.0, popularity: 217, category: "suv" },
    { make: "Volkswagen", makeAr: "فولكسفاجن", model: "Beetle", modelAr: "بيتل", yearFrom: 1938, yearTo: 2019, tankCapacity: 55, fuelType: "91", avgConsumption: 12.5, popularity: 218, category: "hatchback" },
    { make: "Volkswagen", makeAr: "فولكسفاجن", model: "Atlas", modelAr: "أطلس", yearFrom: 2017, yearTo: 2026, tankCapacity: 74, fuelType: "91", avgConsumption: 9.5, popularity: 219, category: "suv" },
    { make: "Volkswagen", makeAr: "فولكسفاجن", model: "Arteon", modelAr: "أرتيون", yearFrom: 2017, yearTo: 2026, tankCapacity: 66, fuelType: "95", avgConsumption: 10.5, popularity: 220, category: "sedan" },
    
    // بورش (6 موديلات)
    { make: "Porsche", makeAr: "بورش", model: "Cayenne", modelAr: "كايين", yearFrom: 2002, yearTo: 2026, tankCapacity: 90, fuelType: "95", avgConsumption: 8.0, popularity: 221, category: "suv" },
    { make: "Porsche", makeAr: "بورش", model: "Panamera", modelAr: "باناميرا", yearFrom: 2009, yearTo: 2026, tankCapacity: 80, fuelType: "95", avgConsumption: 9.0, popularity: 222, category: "sedan" },
    { make: "Porsche", makeAr: "بورش", model: "911", modelAr: "911", yearFrom: 1963, yearTo: 2026, tankCapacity: 64, fuelType: "95", avgConsumption: 9.5, popularity: 223, category: "coupe" },
    { make: "Porsche", makeAr: "بورش", model: "Macan", modelAr: "ماكان", yearFrom: 2014, yearTo: 2026, tankCapacity: 65, fuelType: "95", avgConsumption: 10.0, popularity: 224, category: "suv" },
    { make: "Porsche", makeAr: "بورش", model: "Boxster", modelAr: "بوكستر", yearFrom: 1996, yearTo: 2026, tankCapacity: 64, fuelType: "95", avgConsumption: 10.5, popularity: 225, category: "convertible" },
    { make: "Porsche", makeAr: "بورش", model: "Cayman", modelAr: "كايمان", yearFrom: 2005, yearTo: 2026, tankCapacity: 64, fuelType: "95", avgConsumption: 10.0, popularity: 226, category: "coupe" },
    
    // رينج روفر / لاند روفر (6 موديلات)
    { make: "Land Rover", makeAr: "لاند روفر", model: "Range Rover", modelAr: "رينج روفر", yearFrom: 1970, yearTo: 2026, tankCapacity: 105, fuelType: "95", avgConsumption: 7.0, popularity: 227, category: "suv" },
    { make: "Land Rover", makeAr: "لاند روفر", model: "Range Rover Sport", modelAr: "رينج روفر سبورت", yearFrom: 2005, yearTo: 2026, tankCapacity: 86, fuelType: "95", avgConsumption: 8.0, popularity: 228, category: "suv" },
    { make: "Land Rover", makeAr: "لاند روفر", model: "Discovery", modelAr: "ديسكفري", yearFrom: 1989, yearTo: 2026, tankCapacity: 90, fuelType: "95", avgConsumption: 8.5, popularity: 229, category: "suv" },
    { make: "Land Rover", makeAr: "لاند روفر", model: "Defender", modelAr: "ديفندر", yearFrom: 1983, yearTo: 2026, tankCapacity: 90, fuelType: "diesel", avgConsumption: 9.0, popularity: 230, category: "suv" },
    { make: "Land Rover", makeAr: "لاند روفر", model: "Evoque", modelAr: "إيفوك", yearFrom: 2011, yearTo: 2026, tankCapacity: 67, fuelType: "95", avgConsumption: 10.5, popularity: 231, category: "suv" },
    { make: "Land Rover", makeAr: "لاند روفر", model: "Velar", modelAr: "فيلار", yearFrom: 2017, yearTo: 2026, tankCapacity: 82, fuelType: "95", avgConsumption: 9.0, popularity: 232, category: "suv" },
  ];

  await db.insert(vehicleCatalog).values(vehicleCatalogData.map(v => ({ ...v, isActive: true })));
  console.log(`Vehicle catalog seeded with ${vehicleCatalogData.length} vehicles!`);
}
