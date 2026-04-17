import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { toast } from "sonner";

const ENVIRONMENTS = [
  { value: "gym", label: "Gym", emoji: "🏋️" },
  { value: "home", label: "Home", emoji: "🏠" },
  { value: "hotel", label: "Hotel", emoji: "🛎️" },
  { value: "outside", label: "Outside", emoji: "🌲" },
] as const;

export default function WorkoutLogger() {
  const [, setLocation] = useLocation();
  const [environment, setEnvironment] = useState<"gym" | "home" | "hotel" | "outside">("gym");
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const logWorkout = trpc.workouts.log.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exerciseName || !weight) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await logWorkout.mutateAsync({
        exerciseName,
        environment,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseFloat(weight),
        notes: notes || undefined,
      });

      toast.success("Workout logged successfully!");
      setExerciseName("");
      setSets("3");
      setReps("10");
      setWeight("");
      setNotes("");
    } catch (error) {
      toast.error("Failed to log workout");
      console.error(error);
    }
  };

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
            <Dumbbell className="w-5 h-5 text-red-500" />
            <h1 className="text-xl font-bold text-white tracking-wide">LOG WORKOUT</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-md">
        {/* Environment Pills */}
        <div className="mb-6">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-3">Environment</p>
          <div className="grid grid-cols-4 gap-2">
            {ENVIRONMENTS.map((env) => (
              <button
                key={env.value}
                onClick={() => setEnvironment(env.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all text-sm font-medium ${
                  environment === env.value
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-[#13131a] border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                <span className="text-lg">{env.emoji}</span>
                <span className="text-xs">{env.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#13131a] rounded-2xl border border-white/10 p-5 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-red-600 rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/80">Exercise Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Exercise Name */}
            <div className="space-y-1.5">
              <Label htmlFor="exercise" className="text-xs text-white/50 uppercase tracking-wider">
                Exercise Name *
              </Label>
              <Input
                id="exercise"
                placeholder="e.g., Barbell Squat"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                required
                className="bg-[#0a0a0f] border-white/10 text-white placeholder:text-white/30 focus:border-red-600 focus:ring-0"
              />
            </div>

            {/* Sets / Reps row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sets" className="text-xs text-white/50 uppercase tracking-wider">
                  Sets *
                </Label>
                <Input
                  id="sets"
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  required
                  className="bg-[#0a0a0f] border-white/10 text-white focus:border-red-600 focus:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reps" className="text-xs text-white/50 uppercase tracking-wider">
                  Reps *
                </Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  required
                  className="bg-[#0a0a0f] border-white/10 text-white focus:border-red-600 focus:ring-0"
                />
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-1.5">
              <Label htmlFor="weight" className="text-xs text-white/50 uppercase tracking-wider">
                Weight (lbs) *
              </Label>
              <div className="relative">
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                  className="bg-[#0a0a0f] border-white/10 text-white placeholder:text-white/30 focus:border-red-600 focus:ring-0 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">lbs</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs text-white/50 uppercase tracking-wider">
                Notes
              </Label>
              <Input
                id="notes"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-[#0a0a0f] border-white/10 text-white placeholder:text-white/30 focus:border-red-600 focus:ring-0"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors"
              disabled={logWorkout.isPending}
            >
              {logWorkout.isPending ? "Logging..." : "LOG WORKOUT"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
