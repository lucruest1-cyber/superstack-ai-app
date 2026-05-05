import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Search, Plus } from "lucide-react";

export default function ExerciseLibrary() {
  const [, navigate] = useLocation();
  const [environment, setEnvironment] = useState("gym");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  const searchResults = trpc.exercises.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.trim().length > 0 }
  );

  const envResults = trpc.exercises.listByEnvironment.useQuery(
    { environment },
    { enabled: searchQuery.trim().length === 0 }
  );

  const exercises = searchQuery.trim()
    ? (searchResults.data ?? [])
    : (envResults.data ?? []);

  const handleConfirmAdd = () => {
    if (selectedExercise) {
      navigate(`/dashboard?exercise=${selectedExercise.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Exercise Library</h1>
        <div className="w-6" />
      </div>

      {/* Environment Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["gym", "home", "hotel", "outside"].map(env => (
          <button
            key={env}
            onClick={() => { setEnvironment(env); setSearchQuery(""); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              environment === env
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {env.charAt(0).toUpperCase() + env.slice(1)}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-800 focus:border-red-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        {exercises.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No exercises found</p>
        ) : (
          exercises.map(exercise => (
            <div
              key={exercise.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
                  <p className="text-sm text-gray-400">{exercise.category}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${
                      exercise.difficulty === "beginner"
                        ? "bg-green-900 text-green-200"
                        : exercise.difficulty === "intermediate"
                        ? "bg-yellow-900 text-yellow-200"
                        : "bg-red-900 text-red-200"
                    }`}>
                      {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                    </span>
                    {exercise.muscleGroups.map(mg => (
                      <span key={mg} className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded">
                        {mg}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{exercise.formTips}</p>
                </div>
                <button
                  onClick={() => setSelectedExercise(exercise)}
                  className="ml-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-2"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end z-50">
          <div className="bg-gray-900 w-full rounded-t-2xl p-6 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">{selectedExercise.name}</h2>
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">FORM TIPS</h3>
                <p className="text-white">{selectedExercise.formTips}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">COMMON MISTAKES</h3>
                <p className="text-white">{selectedExercise.commonMistakes}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedExercise(null)}
                className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={handleConfirmAdd}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
              >
                Add to Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
