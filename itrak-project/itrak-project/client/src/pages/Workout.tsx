import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpcClient } from "@/lib/trpc";
import { ChevronLeft, Dumbbell } from "lucide-react";

export default function Workout() {
  const [, navigate] = useLocation();
  const [environment, setEnvironment] = useState("gym");
  const [workout, setWorkout] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [formData, setFormData] = useState<Record<number, { sets: number; reps: number; weight: number }>>({});

  useEffect(() => {
    const fetchWorkout = async () => {
      setIsLoading(true);
      try {
        const result = await trpcClient.system.workoutGenerator.query({ environment });
        setWorkout(result ?? []);
        const initial: Record<number, { sets: number; reps: number; weight: number }> = {};
        result?.forEach((_: any, idx: number) => { initial[idx] = { sets: 4, reps: 10, weight: 0 }; });
        setFormData(initial);
      } catch (err) {
        console.error("Failed to generate workout:", err);
        setWorkout([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkout();
  }, [environment]);

  const handleInputChange = (index: number, field: string, value: number) => {
    setFormData(prev => ({ ...prev, [index]: { ...prev[index], [field]: value } }));
  };

  const handleFinishWorkout = async () => {
    try {
      const workoutLogs = workout.map((ex, idx) => ({
        exerciseName: ex.name,
        environment,
        sets: formData[idx]?.sets ?? 4,
        reps: formData[idx]?.reps ?? 10,
        weight: formData[idx]?.weight ?? 0,
        notes: "",
      }));
      await trpcClient.workouts.logBatch.mutate(workoutLogs);
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to log workout:", err);
    }
  };

  if (!workoutStarted) {
    return (
      <div className="min-h-screen bg-black text-white p-4 pb-20">
        <h1 className="text-3xl font-bold mb-8">Select Environment</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {["gym", "home", "hotel", "outside"].map(env => (
            <button
              key={env}
              onClick={() => setEnvironment(env)}
              className={`py-6 rounded-lg font-bold text-lg transition ${
                environment === env
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {env.charAt(0).toUpperCase() + env.slice(1)}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-gray-400 mb-8">Generating workout…</p>}

        {workout.length > 0 && !isLoading && (
          <>
            <h2 className="text-xl font-semibold mb-4">Your Workout ({workout.length} exercises)</h2>
            <div className="space-y-2 mb-8 max-h-64 overflow-y-auto">
              {workout.map((ex, i) => (
                <div key={i} className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                  <p className="font-medium text-sm">{i + 1}. {ex.name}</p>
                  <p className="text-xs text-gray-500">{ex.category}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => setWorkoutStarted(true)}
          disabled={workout.length === 0 || isLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg"
        >
          <Dumbbell className="inline mr-2" size={20} />
          START WORKOUT
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <button onClick={() => setWorkoutStarted(false)} className="text-gray-400 hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold flex-1">Log Workout</h1>
        </div>

        <div className="space-y-4">
          {workout.map((exercise, idx) => (
            <div key={idx} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <div className="flex justify-between mb-3">
                <h3 className="font-bold">{exercise.name}</h3>
                <span className="text-gray-500 text-sm">#{idx + 1}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase block mb-1">Sets</label>
                  <input
                    type="number" min="1"
                    value={formData[idx]?.sets ?? 4}
                    onChange={e => handleInputChange(idx, "sets", parseInt(e.target.value) || 0)}
                    className="w-full bg-black text-white p-2 rounded border border-gray-700 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase block mb-1">Reps</label>
                  <input
                    type="number" min="1"
                    value={formData[idx]?.reps ?? 10}
                    onChange={e => handleInputChange(idx, "reps", parseInt(e.target.value) || 0)}
                    className="w-full bg-black text-white p-2 rounded border border-gray-700 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase block mb-1">Weight</label>
                  <input
                    type="number" min="0"
                    value={formData[idx]?.weight ?? 0}
                    onChange={e => handleInputChange(idx, "weight", parseInt(e.target.value) || 0)}
                    className="w-full bg-black text-white p-2 rounded border border-gray-700 text-center"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleFinishWorkout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold mt-8"
        >
          FINISH WORKOUT
        </button>
      </div>
    </div>
  );
}
