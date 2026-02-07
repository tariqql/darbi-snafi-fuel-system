import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Car, Search, Check, Loader2, X, AlertCircle } from "lucide-react";

interface VehicleSpec {
  id: string;
  make: string;
  makeAr: string;
  model: string;
  modelAr: string;
  yearFrom: number;
  yearTo: number;
  tankCapacity: number;
  fuelType: string;
  avgConsumption: number;
  category: string;
}

interface VehicleSelectorProps {
  onSelect: (vehicle: {
    vehicleId: string;
    make: string;
    model: string;
    year: number;
    tankCapacity: number;
    fuelType: string;
  }) => void;
  initialValues?: {
    make?: string;
    model?: string;
    year?: number;
  };
}

export function VehicleSelector({ onSelect, initialValues }: VehicleSelectorProps) {
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [vehicleConfirmed, setVehicleConfirmed] = useState(false);

  const { data: makes, isLoading: makesLoading, error: makesError } = useQuery<string[]>({
    queryKey: ["/api/vehicles/catalog/makes"],
  });

  const { data: models, isLoading: modelsLoading, error: modelsError } = useQuery<string[]>({
    queryKey: ["/api/vehicles/catalog/models", selectedMake],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/catalog/models/${encodeURIComponent(selectedMake)}`);
      if (!res.ok) throw new Error("فشل جلب الموديلات");
      return res.json();
    },
    enabled: !!selectedMake && !searchMode,
  });

  const { data: years, error: yearsError } = useQuery<number[]>({
    queryKey: ["/api/vehicles/catalog/years", selectedMake, selectedModel],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/catalog/years/${encodeURIComponent(selectedMake)}/${encodeURIComponent(selectedModel)}`);
      if (!res.ok) throw new Error("فشل جلب السنوات");
      return res.json();
    },
    enabled: !!selectedMake && !!selectedModel && !searchMode,
  });

  const { data: vehicleSpec, isLoading: specLoading, error: specError } = useQuery<VehicleSpec>({
    queryKey: ["/api/vehicles/catalog/spec", selectedMake, selectedModel, selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/catalog/spec/${encodeURIComponent(selectedMake)}/${encodeURIComponent(selectedModel)}/${selectedYear}`);
      if (!res.ok) throw new Error("فشل جلب مواصفات السيارة");
      return res.json();
    },
    enabled: !!selectedMake && !!selectedModel && !!selectedYear,
  });

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery<VehicleSpec[]>({
    queryKey: ["/api/vehicles/catalog/search", searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/catalog/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("فشل البحث");
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  useEffect(() => {
    if (vehicleSpec && selectedYear && !vehicleConfirmed) {
      setVehicleConfirmed(true);
      onSelect({
        vehicleId: vehicleSpec.id,
        make: vehicleSpec.makeAr,
        model: vehicleSpec.modelAr,
        year: parseInt(selectedYear),
        tankCapacity: vehicleSpec.tankCapacity,
        fuelType: vehicleSpec.fuelType,
      });
    }
  }, [vehicleSpec, selectedYear, vehicleConfirmed, onSelect]);

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel("");
    setSelectedYear("");
    setVehicleConfirmed(false);
    setSearchMode(false);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setSelectedYear("");
    setVehicleConfirmed(false);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setVehicleConfirmed(false);
  };

  const handleSearchSelect = (vehicle: VehicleSpec) => {
    setSelectedMake(vehicle.makeAr);
    setSelectedModel(vehicle.modelAr);
    setSelectedYear("");
    setSearchQuery("");
    setSearchMode(false);
    setVehicleConfirmed(false);
  };

  const handleClearSelection = () => {
    setSelectedMake("");
    setSelectedModel("");
    setSelectedYear("");
    setVehicleConfirmed(false);
    setSearchQuery("");
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      sedan: "سيدان",
      suv: "دفع رباعي",
      pickup: "بيك أب",
      hatchback: "هاتشباك",
      van: "فان",
      sports: "رياضية",
    };
    return labels[category] || category;
  };

  const getFuelTypeLabel = (type: string) => {
    switch (type) {
      case "91": return "بنزين 91";
      case "95": return "بنزين 95";
      case "diesel": return "ديزل";
      default: return type;
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          اختيار السيارة
        </CardTitle>
        <CardDescription>
          ابحث أو اختر سيارتك من القائمة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(makesError || modelsError || yearsError || specError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {makesError ? "فشل جلب الشركات المصنعة" : 
               modelsError ? "فشل جلب الموديلات" :
               yearsError ? "فشل جلب السنوات" :
               "فشل جلب مواصفات السيارة"}
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن سيارتك... (مثال: كامري 2022)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchMode(true);
            }}
            className="pr-10"
            data-testid="input-vehicle-search"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {searchQuery.length >= 2 && searchMode && (
          <div className="border rounded-lg max-h-60 overflow-y-auto">
            {searchLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : searchError ? (
              <div className="p-4 text-center text-destructive">
                <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                فشل البحث
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="divide-y">
                {searchResults.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleSearchSelect(vehicle)}
                    className="w-full p-3 text-right hover-elevate flex items-center justify-between gap-2"
                    data-testid={`button-search-result-${vehicle.id}`}
                  >
                    <div>
                      <p className="font-medium">{vehicle.makeAr} {vehicle.modelAr}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.yearFrom} - {vehicle.yearTo} | {vehicle.tankCapacity} لتر | {getFuelTypeLabel(vehicle.fuelType)}
                      </p>
                    </div>
                    <Badge variant="secondary">{getCategoryLabel(vehicle.category)}</Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                لا توجد نتائج
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="make">الشركة المصنعة</Label>
            <Select value={selectedMake} onValueChange={handleMakeChange}>
              <SelectTrigger id="make" data-testid="select-vehicle-make">
                <SelectValue placeholder="اختر الشركة" />
              </SelectTrigger>
              <SelectContent>
                {makesLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  makes?.map((make) => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">الموديل</Label>
            <Select 
              value={selectedModel} 
              onValueChange={handleModelChange}
              disabled={!selectedMake}
            >
              <SelectTrigger id="model" data-testid="select-vehicle-model">
                <SelectValue placeholder={selectedMake ? "اختر الموديل" : "اختر الشركة أولاً"} />
              </SelectTrigger>
              <SelectContent>
                {modelsLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  models?.map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">سنة الصنع</Label>
            <Select 
              value={selectedYear} 
              onValueChange={handleYearChange}
              disabled={!selectedModel}
            >
              <SelectTrigger id="year" data-testid="select-vehicle-year">
                <SelectValue placeholder={selectedModel ? "اختر السنة" : "اختر الموديل أولاً"} />
              </SelectTrigger>
              <SelectContent>
                {years?.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {vehicleConfirmed && vehicleSpec && (
          <div className="bg-gradient-to-l from-green-500/10 to-transparent rounded-xl p-4 border border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-600 dark:text-green-400">تم اختيار السيارة</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-muted-foreground"
                data-testid="button-clear-vehicle"
              >
                <X className="h-4 w-4" />
                تغيير
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">السيارة</p>
                <p className="font-medium">{vehicleSpec.makeAr} {vehicleSpec.modelAr}</p>
              </div>
              <div>
                <p className="text-muted-foreground">سنة الصنع</p>
                <p className="font-medium">{selectedYear}</p>
              </div>
              <div>
                <p className="text-muted-foreground">سعة الخزان</p>
                <p className="font-medium">{vehicleSpec.tankCapacity} لتر</p>
              </div>
              <div>
                <p className="text-muted-foreground">نوع الوقود</p>
                <p className="font-medium">{getFuelTypeLabel(vehicleSpec.fuelType)}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary">{getCategoryLabel(vehicleSpec.category)}</Badge>
              <Badge variant="outline">استهلاك: {vehicleSpec.avgConsumption} لتر/100كم</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
