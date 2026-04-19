import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Search, Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── types ─────────────────────────────────────────────────────────────────────

type Env = "gym" | "home" | "hotel" | "outside";
const ENVS: Env[] = ["gym", "home", "hotel", "outside"];
const ENV_LABELS: Record<Env, string> = { gym: "Gym", home: "Home", hotel: "Hotel", outside: "Outside" };

const MUSCLE_GROUPS = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"] as const;
type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

const DIFF_STYLE: Record<string, string> = {
  beginner:     "text-green-400 bg-green-400/10 border-green-400/20",
  intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  advanced:     "text-red-400  bg-red-400/10  border-red-400/20",
};

interface LogForm { sets: string; reps: string; weight: string; notes: string }

// ── component ─────────────────────────────────────────────────────────────────

export default function ExerciseSelector() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);

  const rawEnv    = params.get("env")    ?? "gym";
  const rawMuscle = params.get("muscle") ?? "all";

  const [activeEnv, setActiveEnv] = useState<Env>(
    ENVS.includes(rawEnv as Env) ? (rawEnv as Env) : "gym"
  );
  const [activeMuscle, setActiveMuscle] = useState<MuscleGroup>(() => {
    const m = rawMuscle.charAt(0).toUpperCase() + rawMuscle.slice(1);
    return (MUSCLE_GROUPS as readonly string[]).includes(m) ? (m as MuscleGroup) : "All";
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<{
    id?: string; name: string; category?: string | null; muscleGroups?: string[] | null; difficulty: string;
  } | null>(null);
  const [form, setForm] = useState<LogForm>({ sets: "3", reps: "10", weight: "", notes: "" });

  const { data: exercises = [], isLoading } = trpc.exercises.listByEnvironment.useQuery(
    { environment: activeEnv },
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: prefs } = trpc.user.getPreferences.useQuery();
  const unit = prefs?.unitPreference ?? "lbs";

  const logMutation = trpc.workouts.log.useMutation({
    onSuccess: () => {
      toast.success(`${selectedExercise?.name} logged!`);
      setSelectedExercise(null);
      setLocation("/dashboard");
    },
    onError: (err) => toast.error(err.message || "Failed to log workout"),
  });

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const cat = (ex as { category?: string | null }).category ?? "";
      if (activeMuscle !== "All" && cat !== activeMuscle) return false;
      if (searchTerm && !ex.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [exercises, activeMuscle, searchTerm]);

  function selectExercise(ex: typeof filtered[0]) {
    setSelectedExercise({
      id: ex.id,
      name: ex.name,
      category: (ex as { category?: string | null }).category,
      muscleGroups: ex.muscleGroups,
      difficulty: ex.difficulty,
    });
    setForm({ sets: "3", reps: "10", weight: "", notes: "" });
  }

  function handleLog() {
    if (!selectedExercise) return;
    const sets   = parseInt(form.sets,   10);
    const reps   = parseInt(form.reps,   10);
    const weight = parseFloat(form.weight);
    if (!sets   || sets   <= 0) { toast.error("Enter a valid number of sets");   return; }
    if (!reps   || reps   <= 0) { toast.error("Enter a valid number of reps");   return; }
    if (!weight || weight <= 0) { toast.error("Enter a valid weight");            return; }
    logMutation.mutate({
      exerciseName: selectedExercise.name,
      environment:  activeEnv,
      sets, reps, weight,
      notes: form.notes || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0">
        <button
          onClick={() => setLocation("/dashboard")}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Select Exercise</h1>
      </header>

      {/* ── Environment Pills ────────────────────────────────────────────────── */}
      <div className="px-5 mb-3 shrink-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {ENVS.map((env) => (
            <button
              key={env}
              onClick={() => setActiveEnv(env)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeEnv === env
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {ENV_LABELS[env]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Muscle Group Pills ───────────────────────────────────────────────── */}
      <div className="px-5 mb-4 shrink-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {MUSCLE_GROUPS.map((grp) => (
            <button
              key={grp}
              onClick={() => setActiveMuscle(grp)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeMuscle === grp
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div className="px-5 mb-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search exercises…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#13131a] border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* ── Exercise List ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-5 pb-10 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-[68px] rounded-xl bg-[#13131a] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-2 text-center">
            <Search className="w-8 h-8 text-gray-700" />
            <p className="text-gray-500 text-sm">No exercises found</p>
            <p className="text-gray-700 text-xs">Try a different filter or environment</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ex) => {
              const diffStyle = DIFF_STYLE[ex.difficulty] ?? DIFF_STYLE.beginner;
              return (
                <div
                  key={ex.id ?? ex.name}
                  className="flex items-center gap-3 rounded-xl bg-[#13131a] border border-white/5 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-snug">{ex.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ex.muscleGroups?.slice(0, 3).map((m) => (
                        <span
                          key={m}
                          className="text-[10px] text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full capitalize"
                        >
                          {m}
                        </span>
                      ))}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize border ${diffStyle}`}>
                        {ex.difficulty}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => selectExercise(ex)}
                    className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Log Form Bottom Sheet ────────────────────────────────────────────── */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedExercise(null)}
          />
          {/* sheet */}
          <div className="relative rounded-t-2xl bg-[#13131a] border-t border-white/10 px-5 pt-4 pb-10">
            {/* drag handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <p className="text-white font-bold text-lg leading-tight mb-0.5">
              {selectedExercise.name}
            </p>
            <p className="text-gray-500 text-xs mb-5 capitalize">
              {selectedExercise.muscleGroups?.join(" · ")}
            </p>

            {/* sets / reps / weight */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {(
                [
                  { label: "Sets",           key: "sets",   min: 1, step: 1,   placeholder: "3"  },
                  { label: "Reps",           key: "reps",   min: 1, step: 1,   placeholder: "10" },
                  { label: `Weight (${unit})`, key: "weight", min: 0, step: 2.5, placeholder: "0"  },
                ] as const
              ).map(({ label, key, min, step, placeholder }) => (
                <div key={key}>
                  <label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                    {label}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={min}
                    step={step}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-2 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-red-600/50 placeholder-gray-700"
                  />
                </div>
              ))}
            </div>

            {/* notes */}
            <div className="mb-5">
              <label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                Notes (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. felt strong today"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-600/50 placeholder-gray-700"
              />
            </div>

            {/* action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedExercise(null)}
                className="w-28 py-3.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLog}
                disabled={logMutation.isPending}
                className="flex-1 py-3.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50"
              >
                {logMutation.isPending ? "Saving…" : "Log Exercise"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
