import { useEffect, useMemo, useRef, useState } from "react";
import { Barcode, Camera, ScanLine, Search, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useAuthUser } from "@/hooks/useAuthUser";
import { createMealLog, type MealLogDoc, type MealLogFoodInput, type MealType, uploadMealPhoto } from "@/lib/firestore";
import { lookupFoodByBarcode, searchFoodCatalog } from "@/lib/food-catalog";
import { toast } from "sonner";

interface LogMealDialogProps {
  children?: React.ReactNode;
  onSaved?: (meal: MealLogDoc) => Promise<void> | void;
}

const DEFAULT_CUSTOM_FOOD = {
  name: "",
  portion: "",
  calories: "",
  carbs: "",
};

export default function LogMealDialog({ children, onSaved }: LogMealDialogProps) {
  const { user } = useAuthUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [loggedAt, setLoggedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<MealLogFoodInput[]>([]);
  const [customFood, setCustomFood] = useState(DEFAULT_CUSTOM_FOOD);
  const [mealPhoto, setMealPhoto] = useState<File | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerStarting, setScannerStarting] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const searchResults = useMemo(() => searchFoodCatalog(searchQuery), [searchQuery]);

  useEffect(() => {
    setScannerSupported(Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  const loadCameraDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");
      setCameraDevices(videoInputs);
      if (!selectedCameraId && videoInputs.length > 0) {
        setSelectedCameraId(videoInputs[0].deviceId);
      }
    } catch {
      setCameraDevices([]);
    }
  };

  useEffect(() => {
    if (open) {
      void loadCameraDevices();
    }
  }, [open]);

  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    readerRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
    setScannerStarting(false);
  };

  useEffect(() => {
    if (!open) {
      stopScanner();
      setScannerMessage("");
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const resetForm = () => {
    setMealType("breakfast");
    setLoggedAt(new Date().toISOString().slice(0, 16));
    setNotes("");
    setSearchQuery("");
    setBarcodeInput("");
    setSelectedFoods([]);
    setCustomFood(DEFAULT_CUSTOM_FOOD);
    setMealPhoto(null);
    setScannerMessage("");
    setSelectedCameraId("");
  };

  const addFood = (food: MealLogFoodInput) => {
    setSelectedFoods((items) => [...items, food]);
  };

  const removeFood = (index: number) => {
    setSelectedFoods((items) => items.filter((_, idx) => idx !== index));
  };

  const handleAddCustomFood = () => {
    if (!customFood.name.trim() || !customFood.portion.trim()) {
      toast.error("Custom food needs a name and portion.");
      return;
    }

    addFood({
      name: customFood.name,
      portion: customFood.portion,
      calories: customFood.calories ? Number(customFood.calories) : undefined,
      carbs: customFood.carbs ? Number(customFood.carbs) : undefined,
    });
    setCustomFood(DEFAULT_CUSTOM_FOOD);
  };

  const handleAddBarcodeFood = () => {
    const match = lookupFoodByBarcode(barcodeInput);
    if (!match) {
      toast.error("Barcode not found in the packaged food list. You can still add it as a custom food.");
      return;
    }

    addFood({
      name: match.name,
      portion: match.portion,
      calories: match.calories,
      carbs: match.carbs,
    });
    setBarcodeInput("");
  };

  const handleBarcodeDetected = (barcode: string) => {
    setBarcodeInput(barcode);
    const match = lookupFoodByBarcode(barcode);
    if (!match) {
      setScannerMessage(`Scanned barcode ${barcode}, but it is not in the packaged food list yet.`);
      return;
    }

    addFood({
      name: match.name,
      portion: match.portion,
      calories: match.calories,
      carbs: match.carbs,
    });
    setScannerMessage(`Added ${match.name} from barcode scan.`);
    stopScanner();
  };

  const startScanner = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerMessage("Camera barcode scanning is not supported on this device/browser.");
      return;
    }

    stopScanner();
    setScannerStarting(true);
    setScannerMessage("");

    try {
      const video = videoRef.current;
      if (!video) {
        throw new Error("Scanner preview is unavailable.");
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      const controls = await reader.decodeFromVideoDevice(
        selectedCameraId || undefined,
        video,
        (result, error) => {
          if (result) {
            handleBarcodeDetected(result.getText());
            return;
          }
          if (error) {
            setScannerMessage("Unable to read barcode from camera. Try better lighting or move closer.");
          }
        }
      );
      controlsRef.current = controls;
      await loadCameraDevices();
      setScannerActive(true);
      setScannerStarting(false);
    } catch (error) {
      console.error("Failed to start barcode scanner:", error);
      setScannerMessage((error as { message?: string })?.message ?? "Failed to start barcode scanner.");
      stopScanner();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedFoods.length) {
      toast.error("Add at least one food item.");
      return;
    }

    const when = new Date(loggedAt);
    if (Number.isNaN(when.getTime())) {
      toast.error("Please choose a valid date and time.");
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | undefined;
      let photoPath: string | undefined;
      if (mealPhoto) {
        const uploaded = await uploadMealPhoto(mealPhoto, user.uid);
        photoUrl = uploaded.photoUrl;
        photoPath = uploaded.photoPath;
      }

      const savedMeal = await createMealLog(user.uid, {
        mealType,
        loggedAt: when,
        foods: selectedFoods,
        notes: notes.trim() || undefined,
        photoUrl,
        photoPath,
      });

      await onSaved?.(savedMeal);
      toast.success("Meal log saved.");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save meal log:", error);
      toast.error((error as { message?: string })?.message ?? "Failed to save meal log.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="hero" size="lg">
            <Utensils className="w-5 h-5 mr-2" />
            Log Meal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Meal Log
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date and Time</Label>
              <Input type="datetime-local" value={loggedAt} onChange={(e) => setLoggedAt(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-4 space-y-4">
            <div className="space-y-2">
              <Label>Manual Food Search</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search foods like idli, roti, dal, egg..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-lg border border-border/60 p-3 text-left hover:bg-muted/40 transition-colors"
                  onClick={() =>
                    addFood({
                      name: item.name,
                      portion: item.portion,
                      calories: item.calories,
                      carbs: item.carbs,
                    })
                  }
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.portion} | {item.calories} kcal | {item.carbs} g carbs
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-4 space-y-3">
            <Label className="flex items-center gap-2">
              <Barcode className="w-4 h-4" />
              Barcode / Packaged Food Lookup
            </Label>
            <div className="flex flex-col md:flex-row gap-3">
              {cameraDevices.length > 0 && (
                <select
                  className="w-full md:w-72 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  disabled={scannerActive || scannerStarting}
                >
                  {cameraDevices.map((device, index) => (
                    <option key={device.deviceId || `camera-${index}`} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void startScanner()}
                disabled={!scannerSupported || scannerStarting || scannerActive}
              >
                <ScanLine className="w-4 h-4 mr-2" />
                {scannerStarting ? "Starting Camera..." : scannerActive ? "Scanner Running" : "Scan with Camera"}
              </Button>
              {scannerActive && (
                <Button type="button" variant="ghost" onClick={stopScanner}>
                  Stop Scanner
                </Button>
              )}
            </div>
            {scannerActive && (
              <div className="space-y-2">
                <video
                  ref={videoRef}
                  className="w-full max-w-md rounded-lg border border-border/60 bg-black"
                  muted
                  playsInline
                />
                <p className="text-xs text-muted-foreground">
                  Point the camera at a packaged-food barcode.
                </p>
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Enter barcode digits, e.g. 8901234567008"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleAddBarcodeFood}>
                Add by Barcode
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use your laptop webcam or another connected camera for scanning, or paste/type a barcode manually.
            </p>
            {scannerMessage && (
              <p className="text-xs text-muted-foreground">{scannerMessage}</p>
            )}
            {!scannerSupported && (
              <p className="text-xs text-muted-foreground">
                Camera scanning is not supported in this browser, so manual barcode entry is still available.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border/60 p-4 space-y-3">
            <Label>Add Custom Food</Label>
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                placeholder="Food name"
                value={customFood.name}
                onChange={(e) => setCustomFood((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Portion"
                value={customFood.portion}
                onChange={(e) => setCustomFood((prev) => ({ ...prev, portion: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Calories (optional)"
                value={customFood.calories}
                onChange={(e) => setCustomFood((prev) => ({ ...prev, calories: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Carbs in g (optional)"
                value={customFood.carbs}
                onChange={(e) => setCustomFood((prev) => ({ ...prev, carbs: e.target.value }))}
              />
            </div>
            <Button type="button" variant="outline" onClick={handleAddCustomFood}>
              Add Custom Food
            </Button>
          </div>

          <div className="space-y-3">
            <Label>Selected Foods</Label>
            {selectedFoods.length === 0 && (
              <p className="text-sm text-muted-foreground">No foods added yet.</p>
            )}
            {selectedFoods.map((food, index) => (
              <div key={`${food.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                <div>
                  <p className="font-medium">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {food.portion}
                    {typeof food.calories === "number" ? ` | ${food.calories} kcal` : ""}
                    {typeof food.carbs === "number" ? ` | ${food.carbs} g carbs` : ""}
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={() => removeFood(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Meal Photo (optional)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setMealPhoto(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              Upload a plate photo to remember what was eaten.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={3}
              placeholder="Anything notable about this meal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Meal Log"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
