import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
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

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Create preview
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Log Meal</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-md space-y-4">
        {/* Daily Limit */}
        {remainingQuery.data && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                Photos remaining today: <span className="font-bold">{remainingQuery.data.remaining}</span> / {remainingQuery.data.total}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Take or Upload Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full rounded-lg border border-border" />
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={handleUpload}
                    disabled={isAnalyzing || uploadMutation.isPending}
                  >
                    {isAnalyzing || uploadMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze & Log"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={isAnalyzing}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Choose Photo
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Meals */}
        {todayQuery.data && todayQuery.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Meals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayQuery.data.map((log) => (
                <div key={log.id} className="p-3 border border-border rounded-lg">
                  <p className="font-semibold text-foreground">{log.foodDescription}</p>
                  <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                    <div>
                      <p className="font-bold text-foreground">{log.calories}</p>
                      <p>Calories</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{log.protein}g</p>
                      <p>Protein</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{log.carbs}g</p>
                      <p>Carbs</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{log.fat}g</p>
                      <p>Fat</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
