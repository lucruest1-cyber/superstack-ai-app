import { useRef, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Camera, Loader2, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";

function parseRetryAfter(msg: string): number {
  const m = msg.match(/Retry after (\d+)s/);
  return m ? parseInt(m[1], 10) : 0;
}

function fmtCountdown(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function foodEmoji(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes("chicken")) return "🍗";
  if (d.includes("salad")) return "🥗";
  if (d.includes("rice")) return "🍚";
  if (d.includes("burger") || d.includes("beef")) return "🍔";
  if (d.includes("egg")) return "🥚";
  if (d.includes("fish") || d.includes("salmon") || d.includes("tuna")) return "🐟";
  if (d.includes("pizza")) return "🍕";
  if (d.includes("pasta")) return "🍝";
  if (d.includes("sandwich")) return "🥪";
  if (d.includes("smoothie") || d.includes("shake")) return "🥤";
  if (d.includes("oat") || d.includes("cereal")) return "🥣";
  if (d.includes("steak")) return "🥩";
  if (d.includes("soup")) return "🍲";
  if (d.includes("coffee")) return "☕";
  return "🍽️";
}

export default function Meals() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [retryAfterSecs, setRetryAfterSecs] = useState<number | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<(typeof meals)[number] | null>(null);

  useEffect(() => {
    if (retryAfterSecs === null || retryAfterSecs <= 0) return;
    const id = setInterval(() => {
      setRetryAfterSecs((s) => {
        if (s === null || s <= 1) { clearInterval(id); return null; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfterSecs]);

  const today = new Date().toISOString().split("T")[0];

  const summaryQuery = trpc.photoTracker.getDailySummary.useQuery({ date: today });
  const remainingQuery = trpc.photoTracker.getRemainingPhotos.useQuery();
  const todayQuery = trpc.photoTracker.getToday.useQuery();
  const uploadMutation = trpc.photoTracker.uploadAndAnalyze.useMutation();

  const summary = summaryQuery.data;
  const meals = todayQuery.data ?? [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;
    setIsAnalyzing(true);
    try {
      await uploadMutation.mutateAsync({
        imageBase64: preview.split(",")[1],
        mimeType: preview.split(",")[0].split(":")[1].split(";")[0] || "image/jpeg",
      });
      toast.success("Meal logged!");
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      remainingQuery.refetch();
      todayQuery.refetch();
      summaryQuery.refetch();
    } catch (err: any) {
      console.error("[meals] upload error — code:", err?.data?.code, "httpStatus:", err?.data?.httpStatus, "message:", err?.message);
      console.error("[meals] full error object:", JSON.stringify(err, null, 2));
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("daily photo limit")) {
        toast.error("You've reached your daily photo limit. Try again tomorrow.");
      } else {
        const secs = parseRetryAfter(msg);
        if (err?.data?.code === "TOO_MANY_REQUESTS" || secs > 0) {
          setRetryAfterSecs(secs || 60);
        } else {
          toast.error(msg || "Failed to analyze photo");
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-16">

      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Today's Meals</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track your nutrition with AI</p>
      </header>

      <div className="px-5 space-y-4">

        {/* Daily Summary Card */}
        <div className="rounded-2xl bg-[#13131a] border border-white/5 p-4">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">
            Daily Macros
          </p>
          <div className="grid grid-cols-4 divide-x divide-white/5">
            <div className="flex flex-col items-center gap-1 pr-3">
              <span className="text-xl font-bold text-white">{summary?.totalCalories ?? 0}</span>
              <span className="text-gray-500 text-[10px] uppercase tracking-wide">Cal</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-3">
              <span className="text-xl font-bold text-blue-400">{summary?.totalProtein ?? 0}g</span>
              <span className="text-gray-500 text-[10px] uppercase tracking-wide">Protein</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-3">
              <span className="text-xl font-bold text-blue-400">{summary?.totalCarbs ?? 0}g</span>
              <span className="text-gray-500 text-[10px] uppercase tracking-wide">Carbs</span>
            </div>
            <div className="flex flex-col items-center gap-1 pl-3">
              <span className="text-xl font-bold text-blue-400">{summary?.totalFat ?? 0}g</span>
              <span className="text-gray-500 text-[10px] uppercase tracking-wide">Fat</span>
            </div>
          </div>

          {/* Quota */}
          {remainingQuery.data && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-gray-500 text-xs">Photos remaining today</p>
                <p className="text-blue-400 text-xs font-bold">
                  {remainingQuery.data.remaining} / {remainingQuery.data.total}
                </p>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(remainingQuery.data.remaining / remainingQuery.data.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Upload Card */}
        <div className="rounded-2xl bg-[#13131a] border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-blue-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/80">
              {preview ? "Review Photo" : "Log a Meal"}
            </h2>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {preview ? (
            <div className="space-y-3">
              <img src={preview} alt="Preview" className="w-full rounded-xl border border-white/10 object-cover max-h-64" />
              <button
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm tracking-wide uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleUpload}
                disabled={isAnalyzing || uploadMutation.isPending || retryAfterSecs !== null}
              >
                {isAnalyzing || uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze & Log"
                )}
              </button>
              <button
                className="w-full py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-white/30 hover:text-white transition-colors"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={isAnalyzing}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed border-white/15 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Camera className="w-7 h-7 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white/80">Tap to take or upload a photo</p>
                <p className="text-xs text-white/30 mt-1">Max 5MB · JPG, PNG, HEIC</p>
              </div>
            </button>
          )}
        </div>

        {/* Meal History */}
        {todayQuery.isLoading ? (
          <div className="text-gray-600 text-sm py-4 text-center">Loading...</div>
        ) : meals.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-white/10 py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-600/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-6 h-6 text-gray-600" />
            <p className="text-gray-600 text-sm">No meals logged yet — tap to add one</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1 mb-1">
              <div className="w-1 h-4 rounded-full bg-blue-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Today's Meals</p>
            </div>
            {meals.map((meal) => (
              <div
                key={meal.id}
                onClick={() => setSelectedMeal(meal)}
                className="flex items-center gap-3 rounded-xl bg-[#13131a] border border-white/5 border-l-[3px] border-l-blue-500 px-4 py-3 cursor-pointer active:opacity-70 transition-opacity"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl shrink-0">
                  {foodEmoji(meal.foodDescription ?? "")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {meal.foodDescription ?? "Unknown meal"}
                  </p>
                  <p className="text-blue-400 font-bold text-sm">{meal.calories} cal</p>
                  <p className="text-gray-500 text-xs">
                    P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Meal Detail Bottom Sheet */}
      {selectedMeal && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setSelectedMeal(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative w-full rounded-t-3xl bg-[#13131a] border-t border-white/10 p-5 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            {/* Close button */}
            <button
              onClick={() => setSelectedMeal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Photo */}
            {selectedMeal.photoUrl && (
              <img
                src={selectedMeal.photoUrl}
                alt={selectedMeal.foodDescription ?? "Meal photo"}
                className="w-full rounded-2xl object-cover max-h-52 mb-5 border border-white/10"
              />
            )}

            {/* Title */}
            <p className="text-white font-bold text-lg leading-snug mb-1">
              {selectedMeal.foodDescription ?? "Unknown meal"}
            </p>
            <p className="text-gray-500 text-xs mb-5">
              {new Date(selectedMeal.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-3 mb-2">
              {[
                { label: "Calories", value: selectedMeal.calories ?? 0, unit: "", color: "text-white" },
                { label: "Protein", value: selectedMeal.protein ?? 0, unit: "g", color: "text-blue-400" },
                { label: "Carbs",   value: selectedMeal.carbs ?? 0,   unit: "g", color: "text-blue-400" },
                { label: "Fat",     value: selectedMeal.fat ?? 0,     unit: "g", color: "text-blue-400" },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="rounded-xl bg-white/5 p-3 flex flex-col items-center gap-1">
                  <span className={`text-xl font-bold ${color}`}>{value}{unit}</span>
                  <span className="text-gray-500 text-[10px] uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {retryAfterSecs !== null && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-5 pb-4">
          <div className="rounded-2xl bg-[#13131a] border border-blue-500/40 p-4 flex items-center gap-4 shadow-xl shadow-blue-900/20">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">AI is analyzing your meal…</p>
              <p className="text-gray-400 text-xs mt-0.5">Please wait before trying again</p>
            </div>
            <span className="text-blue-400 font-mono font-bold text-lg tabular-nums">
              {fmtCountdown(retryAfterSecs)}
            </span>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
