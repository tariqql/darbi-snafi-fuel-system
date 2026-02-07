import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Map, MapPin, Fuel, Navigation, Route, Clock, Trash2, AlertCircle } from "lucide-react";
import type { JourneyPlan, FuelStation } from "@shared/schema";

export default function Journey() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    startPoint: "",
    endPoint: "",
  });

  const { data: journeys = [], isLoading } = useQuery<JourneyPlan[]>({
    queryKey: ["/api/journeys"],
  });

  const { data: stations = [] } = useQuery<FuelStation[]>({
    queryKey: ["/api/stations"],
  });

  const createJourneyMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/journeys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      setIsDialogOpen(false);
      setFormData({ name: "", startPoint: "", endPoint: "" });
      setSelectedStations([]);
      toast({
        title: "تم إنشاء الرحلة",
        description: "تم حفظ خطة الرحلة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الرحلة",
        variant: "destructive",
      });
    },
  });

  const deleteJourneyMutation = useMutation({
    mutationFn: async (journeyId: string) => {
      return apiRequest("DELETE", `/api/journeys/${journeyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف خطة الرحلة",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stops = selectedStations.map((stationId, index) => {
      const station = stations.find(s => s.id === stationId);
      return {
        stationId,
        stationName: station?.name || "",
        order: index + 1,
        distanceFromPrevious: Math.floor(Math.random() * 100) + 20,
      };
    });

    const totalDistance = stops.reduce((sum, stop) => sum + stop.distanceFromPrevious, 0);
    const estimatedFuel = totalDistance * 0.08; // 8L per 100km average
    const avgPrice = stations.reduce((sum, s) => sum + s.pricePerLiter, 0) / stations.length || 2.5;

    createJourneyMutation.mutate({
      userId: "user-1",
      name: formData.name,
      startPoint: formData.startPoint,
      endPoint: formData.endPoint,
      totalDistance,
      estimatedFuel,
      estimatedCost: estimatedFuel * avgPrice,
      stops,
    });
  };

  const toggleStation = (stationId: string) => {
    setSelectedStations(prev =>
      prev.includes(stationId)
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  return (
    <div className="min-h-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-journey-title">صمم رحلتك</h1>
          <p className="text-muted-foreground">خطط لمسارك واختر محطات التوقف المناسبة</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-new-journey">
              <Plus className="h-4 w-4" />
              رحلة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تخطيط رحلة جديدة</DialogTitle>
              <DialogDescription>
                حدد نقاط البداية والنهاية واختر محطات التوقف
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الرحلة</Label>
                <Input
                  id="name"
                  placeholder="مثال: رحلة العيد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-journey-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startPoint">نقطة البداية</Label>
                  <Input
                    id="startPoint"
                    placeholder="الرياض"
                    value={formData.startPoint}
                    onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
                    data-testid="input-start-point"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endPoint">نقطة النهاية</Label>
                  <Input
                    id="endPoint"
                    placeholder="جدة"
                    value={formData.endPoint}
                    onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
                    data-testid="input-end-point"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>محطات التوقف (اختياري)</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {stations.map((station) => (
                    <div
                      key={station.id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        selectedStations.includes(station.id)
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted/50 hover-elevate"
                      }`}
                      onClick={() => toggleStation(station.id)}
                      data-testid={`station-${station.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{station.name}</p>
                          <p className="text-xs text-muted-foreground">{station.address}</p>
                        </div>
                      </div>
                      <Badge variant={selectedStations.includes(station.id) ? "default" : "secondary"}>
                        {station.pricePerLiter} ر.س
                      </Badge>
                    </div>
                  ))}
                  {stations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لا توجد محطات متاحة
                    </p>
                  )}
                </div>
              </div>

              {selectedStations.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  تم اختيار {selectedStations.length} محطة توقف
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!formData.name || !formData.startPoint || !formData.endPoint || createJourneyMutation.isPending}
                data-testid="button-submit-journey"
              >
                {createJourneyMutation.isPending ? "جاري الحفظ..." : "حفظ الرحلة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">الرحلات المحفوظة</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-journeys-count">
              {journeys.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المسافات</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {journeys.reduce((sum, j) => sum + (j.totalDistance || 0), 0).toFixed(0)} كم
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">المحطات المتاحة</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stations-count">
              {stations.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          رحلاتي
        </h2>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-24 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : journeys.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد رحلات محفوظة</p>
              <p className="text-sm text-muted-foreground mt-1">
                أنشئ رحلة جديدة لتخطيط مسارك
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {journeys.map((journey) => (
              <Card key={journey.id} data-testid={`card-journey-${journey.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{journey.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteJourneyMutation.mutate(journey.id)}
                      data-testid={`button-delete-journey-${journey.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {journey.startPoint} → {journey.endPoint}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">المسافة</p>
                      <p className="font-bold">{journey.totalDistance?.toFixed(0) || 0} كم</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">الوقود المتوقع</p>
                      <p className="font-bold">{journey.estimatedFuel?.toFixed(1) || 0} لتر</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">التكلفة المتوقعة</p>
                      <p className="font-bold text-primary">{journey.estimatedCost?.toFixed(0) || 0} ر.س</p>
                    </div>
                  </div>

                  {journey.stops && (journey.stops as any[]).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Fuel className="h-3 w-3" />
                        محطات التوقف ({(journey.stops as any[]).length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(journey.stops as any[]).map((stop: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {stop.stationName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            المحطات المتاحة
          </CardTitle>
          <CardDescription>محطات الوقود المتاحة للتوقف</CardDescription>
        </CardHeader>
        <CardContent>
          {stations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد محطات متاحة حالياً</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  data-testid={`station-card-${station.id}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Fuel className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{station.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{station.address}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-primary">{station.pricePerLiter} ر.س</p>
                    <Badge variant={station.isOpen ? "default" : "secondary"} className="text-xs">
                      {station.isOpen ? "مفتوحة" : "مغلقة"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
