import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, AlertCircle, Dumbbell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── types ─────────────────────────────────────────────────────────────────────

type Env = "gym" | "home" | "hotel" | "outside";

interface WorkoutItem {
  exerciseName: string;
  muscleGroups: string[];
  difficulty: string;
  sets: number;
  reps: number;
  weight: string;
}

interface Props {
  environment: Env;
  muscleGroup: string;
  trainingMode: string;
  onClose: () => void;
  onLogged: () => void;
}

// ── constants ─────────────────────────────────────────────────────────────────

const ENV_LABELS: Record<Env, string> = { gym: "Gym", home: "Home", hotel: "Hotel", outside: "Outside" };

const MODE_DEFAULTS: Record<string, { sets: number; reps: number; label: string }> = {
  Muscle: { sets: 4, reps: 10, label: "4 × 10" },
  Power:  { sets: 5, reps: 5,  label: "5 × 5"  },
  Sculpt: { sets: 3, reps: 15, label: "3 × 15" },
};

// ── workout generation algorithm ─────────────────────────────────────────────

type RawExercise = {
  id?: string;
  name: string;
  category?: string | null;
  muscleGroups?: string[] | null;
  difficulty: string;
  environments: string[];
};

function generateWorkout(
  exercises: RawExercise[],
  trainingMode: string,
  muscleGroup: string,
  count = 7
): WorkoutItem[] {
  // Filter by muscle group (category field matches filter pill labels)
  let pool = muscleGroup === "All"
    ? [...exercises]
    : exercises.filter((ex) => ex.category === muscleGroup);

  // Fall back to full list if filter yields too few
  if (pool.length < 3) pool = [...exercises];

  // Score each exercise based on training mode suitability, then shuffle
  const scored = pool.map((ex) => {
    const muscleCount = ex.muscleGroups?.length ?? 1;
    let score = Math.random(); // base randomness ensures different results each tap

    if (trainingMode === "Muscle") {
      // Hypertrophy: prefer intermediate/advanced compound movements
      if (ex.difficulty === "intermediate") score += 2;
      if (ex.difficulty === "advanced")     score += 1;
      if (muscleCount >= 3)                 score += 1.5; // compound bonus
    } else if (trainingMode === "Power") {
      // Strength: prefer advanced compound movements
      if (ex.difficulty === "advanced")     score += 3;
      if (ex.difficulty === "intermediate") score += 1;
      if (muscleCount >= 3)                 score += 2;   // compound strongly preferred
    } else {
      // Sculpt: prefer beginner/intermediate isolation movements
      if (ex.difficulty === "beginner")     score += 2;
      if (ex.difficulty === "intermediate") score += 1.5;
      if (muscleCount === 1)                score += 1.5; // isolation bonus
    }
    return { ex, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const defaults = MODE_DEFAULTS[trainingMode] ?? { sets: 3, reps: 10 };
  const take = Math.min(count, scored.length);

  return scored.slice(0, take).map(({ ex }) => ({
    exerciseName: ex.name,
    muscleGroups: ex.muscleGroups ?? [],
    difficulty:   ex.difficulty,
    sets:         defaults.sets,
    reps:         defaults.reps,
    weight:       "",
  }));
}

// ── component ─────────────────────────────────────────────────────────────────

export default function WorkoutGenerator({ environment, muscleGroup, trainingMode, onClose, onLogged }: Props) {
  const { data: exercises = [], isLoading, isError, error, refetch } =
    trpc.exercises.listByEnvironment.useQuery(
      { environment },
      { staleTime: 5 * 60 * 1000, retry: 1 }
    );
  const { data: prefs } = trpc.user.getPreferences.useQuery();
  const unit = prefs?.unitPreference ?? "lbs";

  const [plan, setPlan] = useState<WorkoutItem[]>([]);
  const [step, setStep] = useState<"preview" | "log">("preview");

  useEffect(() => {
    if (exercises.length > 0) {
      setPlan(generateWorkout(exercises as RawExercise[], trainingMode, muscleGroup));
      // Reset to preview step whenever filters change so users see the new plan first
      setStep("preview");
    }
  }, [exercises, trainingMode, muscleGroup]);

  function regenerate() {
    setPlan(generateWorkout(exercises as RawExercise[], trainingMode, muscleGroup));
  }

  const logBatch = trpc.workouts.logBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} exercise${data.count === 1 ? "" : "s"} logged!`);
      onLogged();
    },
    onError: (err) => toast.error(err.message || "Failed to log workout"),
  });

  function handleLog() {
    const items = plan.map((item) => ({
      exerciseName: item.exerciseName,
      environment,
      sets:   item.sets,
      reps:   item.reps,
      weight: parseFloat(item.weight) || 0,
      notes:  undefined as string | undefined,
    }));
    logBatch.mutate(items);
  }

  const modeInfo = MODE_DEFAULTS[trainingMode] ?? { sets: 3, reps: 10, label: "3 × 10" };

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0a0f] flex flex-col">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-3 shrink-0">
        <button
          onClick={() => (step === "log" ? setStep("preview") : onClose())}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          title={step === "log" ? "Back to preview" : "Close"}
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            {step === "preview" ? "Today's Workout" : "Log Workout"}
          </h1>
          <p className="text-gray-500 text-xs mt-0.5 truncate">
            {trainingMode} · {ENV_LABELS[environment]} · {muscleGroup === "All" ? "All Muscles" : muscleGroup}
          </p>
        </div>
        {step === "preview" && (
          <button
            onClick={regenerate}
            disabled={isLoading || exercises.length === 0}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40"
            title="Generate new workout"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </header>

      {/* ── Mode badge ───────────────────────────────────────────────────────── */}
      <div className="px-5 mb-4 flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-1 rounded-full">
          {trainingMode}: {modeInfo.label}
        </span>
        {!isLoading && plan.length > 0 && (
          <span className="text-xs text-gray-500">{plan.length} exercises</span>
        )}
      </div>

      {/* ── Exercise list ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-5 overflow-y-auto pb-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-[92px] rounded-xl bg-[#13131a] animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-white font-semibold text-sm">Couldn't load exercises</p>
            <p className="text-gray-500 text-xs max-w-xs">
              {(error as { message?: string })?.message ?? "Check that FIREBASE_SERVICE_ACCOUNT_KEY is set in Vercel env vars."}
            </p>
            <button
              onClick={() => void refetch()}
              className="flex items-center gap-1.5 text-red-400 text-sm border border-red-400/30 px-4 py-1.5 rounded-full hover:bg-red-400/10 transition-colors mt-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : plan.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <p className="text-gray-500 text-sm">No exercises available for this selection</p>
            <button onClick={regenerate} className="text-red-400 text-sm underline">Try regenerating</button>
          </div>
        ) : (
          <div className="space-y-3">
            {plan.map((item, i) => (
              <div key={i} className="rounded-xl bg-[#13131a] border border-white/5 px-4 py-3">
                {/* Exercise name + index */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-snug">{item.exerciseName}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.muscleGroups.slice(0, 2).map((m) => (
                        <span key={m} className="text-[10px] text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full capitalize">{m}</span>
                      ))}
                      {step === "preview" && (
                        <span className="text-[10px] text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                          {item.sets} × {item.reps}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                    #{i + 1}
                  </span>
                </div>

                {/* Sets / Reps / Weight inputs — only in log step */}
                {step === "log" && (
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { label: "Sets",            key: "sets"   as const, min: 1, step: 1   },
                        { label: "Reps",            key: "reps"   as const, min: 1, step: 1   },
                        { label: `Wt (${unit})`,    key: "weight" as const, min: 0, step: 2.5 },
                      ]
                    ).map(({ label, key, min, step: stepAttr }) => (
                      <div key={key}>
                        <label className="text-gray-600 text-[10px] uppercase tracking-wider block mb-1">{label}</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={min}
                          step={stepAttr}
                          placeholder={key === "weight" ? "0" : undefined}
                          value={key === "weight" ? item.weight : item[key]}
                          onChange={(e) =>
                            setPlan((p) =>
                              p.map((x, j) =>
                                j !== i ? x : {
                                  ...x,
                                  [key]: key === "weight"
                                    ? e.target.value
                                    : Math.max(1, parseInt(e.target.value) || 1),
                                }
                              )
                            )
                          }
                          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-1 py-2 text-white text-center text-sm font-bold focus:outline-none focus:border-red-600/50 placeholder-gray-700"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      {!isLoading && !isError && plan.length > 0 && (
        <div className="px-5 py-5 border-t border-white/5 shrink-0">
          {step === "preview" ? (
            <div className="flex gap-3">
              <button
                onClick={regenerate}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-200 font-bold text-base tracking-wide hover:bg-white/10 active:bg-white/15 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                REGENERATE
              </button>
              <button
                onClick={() => setStep("log")}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold text-base tracking-wide hover:bg-red-700 active:bg-red-800 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <Dumbbell className="w-4 h-4" />
                START WORKOUT
              </button>
            </div>
          ) : (
            <button
              onClick={handleLog}
              disabled={logBatch.isPending}
              className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold text-base tracking-wide hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 shadow-lg shadow-red-600/20"
            >
              {logBatch.isPending ? "Logging…" : `FINISH WORKOUT (${plan.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
