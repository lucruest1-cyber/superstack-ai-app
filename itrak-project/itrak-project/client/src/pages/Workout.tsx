import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Dumbbell } from "lucide-react";

export default function Workout() {
  const [, navigate] = useLocation();
  const [environment, setEnvironment] = useState("gym");
  const [workoutStarted, setWorkoutStarted] = useState(false);

  const { data: workout = [], isLoading } = trpc.system.workoutGenerator.useQuery({ environment });

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {!workoutStarted ? (
        <div className="p-4">
          <h1 className="text-3xl font-bold mb-8">Select Your Environment</h1>

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

          {isLoading ? (
            <p className="text-gray-500 text-center py-4">Generating workout…</p>
          ) : workout.length > 0 ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Your Workout ({workout.length} exercises)</h2>
              <div className="space-y-3 mb-8">
                {workout.map((ex, i) => (
                  <div key={i} className="bg-gray-900 p-3 rounded-lg">
                    <p className="font-medium">{ex.name}</p>
                    <p className="text-sm text-gray-400">{ex.category}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <button
            onClick={() => setWorkoutStarted(true)}
            disabled={workout.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg"
          >
            <Dumbbell className="inline mr-2" size={20} />
            START WORKOUT
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center mb-6">
            <button onClick={() => setWorkoutStarted(false)} className="text-gray-400">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold flex-1">Today's Workout</h1>
          </div>

          <div className="space-y-4">
            {workout.map((exercise, index) => (
              <div key={index} className="bg-gray-900 p-4 rounded-lg">
                <div className="flex justify-between mb-3">
                  <h3 className="font-bold text-lg">{exercise.name}</h3>
                  <span className="text-gray-400">#{index + 1}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Sets</label>
                    <input type="number" defaultValue="4" className="w-full bg-black text-white p-2 rounded border border-gray-700" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Reps</label>
                    <input type="number" defaultValue="10" className="w-full bg-black text-white p-2 rounded border border-gray-700" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Weight (lbs)</label>
                    <input type="number" defaultValue="0" className="w-full bg-black text-white p-2 rounded border border-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold mt-8">
            FINISH WORKOUT
          </button>
        </div>
      )}
    </div>
  );
}
