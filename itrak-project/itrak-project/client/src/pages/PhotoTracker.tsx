import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Camera, Loader2, Utensils } from "lucide-react";
import { toast } from "sonner";

export default function PhotoTracker() {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const uploadMutation = trpc.photoTracker.uploadAndAnalyze.useMutation();
  const remainingQuery = trpc.photoTracker.getRemainingPhotos.useQuery();
  const todayQuery = trpc.photoTracker.getToday.useQuery();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setIsAnalyzing(true);
    try {
      const base64 = preview.split(",")[1];
      await uploadMutation.mutateAsync({
        imageBase64: base64,
        mimeType: "image/jpeg",
      });

      toast.success("Meal logged successfully!");
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      remainingQuery.refetch();
      todayQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze photo");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalCalories = todayQuery.data?.reduce((s, m) => s + (m.calories ?? 0), 0) ?? 0;
  const totalProtein = todayQuery.data?.reduce((s, m) => s + (m.protein ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f0f17]">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setLocation("/dashboard")}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-wide">LOG MEAL</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-md space-y-5">
        {/* Daily quota */}
        {remainingQuery.data && (
          <div className="bg-[#13131a] rounded-2xl border border-blue-500/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/50 uppercase tracking-widest">Photos Remaining Today</p>
              <p className="text-sm font-bold text-blue-400">
                {remainingQuery.data.remaining} <span className="text-white/30">/ {remainingQuery.data.total}</span>
              </p>
            </div>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(remainingQuery.data.remaining / remainingQuery.data.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Today's totals (if meals logged) */}
        {(todayQuery.data?.length ?? 0) > 0 && (
          <div className="bg-[#13131a] rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Today's Totals</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-white">{totalCalories}</p>
                <p className="text-xs text-white/40">Calories</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalProtein}g</p>
                <p className="text-xs text-white/40">Protein</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-[#13131a] rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-blue-500 rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/80">
              {preview ? "Review Photo" : "Take or Upload Photo"}
            </h2>
          </div>

          {preview ? (
            <div className="space-y-3">
              <img src={preview} alt="Preview" className="w-full rounded-xl border border-white/10" />
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                onClick={handleUpload}
                disabled={isAnalyzing || uploadMutation.isPending}
              >
                {isAnalyzing || uploadMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  "ANALYZE & LOG"
                )}
              </Button>
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
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
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
            </>
          )}
        </div>

        {/* Today's Meals */}
        {(todayQuery.data?.length ?? 0) > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Today's Meals</p>
            </div>
            {todayQuery.data!.map((log) => (
              <div
                key={log.id}
                className="bg-[#13131a] rounded-2xl border border-white/10 p-4 border-l-[3px] border-l-blue-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm leading-snug">
                      {log.foodDescription ?? "Unknown meal"}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">{log.calories} kcal</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">{log.protein}g</p>
                    <p className="text-xs text-white/40">Protein</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">{log.carbs}g</p>
                    <p className="text-xs text-white/40">Carbs</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">{log.fat}g</p>
                    <p className="text-xs text-white/40">Fat</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
