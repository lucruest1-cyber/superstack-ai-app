import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function WorkoutLogger() {
  const { user } = useAuth();
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Log Workout</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Add Exercise</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Environment */}
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select value={environment} onValueChange={(value: any) => setEnvironment(value)}>
                  <SelectTrigger id="environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="outside">Outside</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Exercise Name */}
              <div className="space-y-2">
                <Label htmlFor="exercise">Exercise Name *</Label>
                <Input
                  id="exercise"
                  placeholder="e.g., Barbell Squat"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  required
                />
              </div>

              {/* Sets */}
              <div className="space-y-2">
                <Label htmlFor="sets">Sets *</Label>
                <Input
                  id="sets"
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  required
                />
              </div>

              {/* Reps */}
              <div className="space-y-2">
                <Label htmlFor="reps">Reps *</Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  required
                />
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Optional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={logWorkout.isPending}>
                {logWorkout.isPending ? "Logging..." : "Log Workout"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
