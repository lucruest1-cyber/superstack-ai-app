import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Settings, Plus, Camera } from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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

// Minimal muscle-map thumbnail: coloured body silhouette SVG
function MuscleThumbnail({ group }: { group: string }) {
  const colors: Record<string, string> = {
    Chest: "#dc2626", Back: "#2563eb", Shoulders: "#7c3aed",
    Arms: "#d97706", Legs: "#059669", Core: "#e11d48",
  };
  const color = colors[group] ?? "#dc2626";
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
      style={{ backgroundColor: color + "33", border: `1.5px solid ${color}55` }}
    >
      <svg viewBox="0 0 32 40" className="w-6 h-6" fill="none">
        {/* head */}
        <circle cx="16" cy="5" r="4" fill={color} opacity="0.6" />
        {/* torso */}
        <rect x="10" y="10" width="12" height="14" rx="2"
          fill={["Chest","Core","Shoulders"].includes(group) ? color : "#374151"} opacity="0.8" />
        {/* left arm */}
        <rect x="4" y="10" width="5" height="12" rx="2"
          fill={group === "Arms" ? color : "#374151"} opacity="0.8" />
        {/* right arm */}
        <rect x="23" y="10" width="5" height="12" rx="2"
          fill={group === "Arms" ? color : "#374151"} opacity="0.8" />
        {/* left leg */}
        <rect x="10" y="25" width="5" height="13" rx="2"
          fill={group === "Legs" ? color : "#374151"} opacity="0.8" />
        {/* right leg */}
        <rect x="17" y="25" width="5" height="13" rx="2"
          fill={group === "Legs" ? color : "#374151"} opacity="0.8" />
      </svg>
    </div>
  );
}

// Guess muscle group from exercise name
function guessMuscleGroup(name: string): string {
  const n = name.toLowerCase();
  if (n.match(/squat|lunge|leg|deadlift|hamstring|quad|calf/)) return "Legs";
  if (n.match(/bench|chest|fly|pec|push.?up/)) return "Chest";
  if (n.match(/row|pull|lat|back|deadlift|rdl/)) return "Back";
  if (n.match(/shoulder|press|lateral|delt|ohp/)) return "Shoulders";
  if (n.match(/curl|tricep|bicep|arm|dip/)) return "Arms";
  if (n.match(/crunch|plank|core|ab|sit.?up/)) return "Core";
  return "Chest"; // default
}

// ── constants ──────────────────────────────────────────────────────────────────

const TRAINING_MODES = ["Muscle", "Power", "Sculpt"] as const;
const ENVIRONMENTS = ["Gym", "Home", "Hotel", "Outside"] as const;
const MUSCLE_GROUPS = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"] as const;

// ── component ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [trainingMode, setTrainingMode] = useState<string>("Muscle");
  const [activeEnv, setActiveEnv] = useState<string>("Gym");
  const [activeMuscle, setActiveMuscle] = useState<string>("All");

  const workoutQuery = trpc.workouts.getToday.useQuery();
  const photoQuery = trpc.photoTracker.getToday.useQuery();
  const summaryQuery = trpc.photoTracker.getDailySummary.useQuery({
    date: new Date().toISOString().split("T")[0],
  });

  const workouts = workoutQuery.data ?? [];
  const meals = photoQuery.data ?? [];
  const summary = summaryQuery.data;

  // Apply muscle-group filter
  const filteredWorkouts = activeMuscle === "All"
    ? workouts
    : workouts.filter((w) => guessMuscleGroup(w.name) === activeMuscle);

  // Derived summary stats
  const totalCalories = summary?.totalCalories ?? 0;
  const totalMinutes = workouts.reduce((s, w) => s + w.sets * 2, 0);

  // Avatar initials
  const initials = (user?.name ?? user?.email ?? "U")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">I-TRAK</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/settings")}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
          <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </div>
      </header>

      {/* ── Greeting ─────────────────────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        <p className="text-xl font-bold text-white">
          {getGreeting()}, {user?.name?.split(" ")[0] ?? "Athlete"} 💪
        </p>
        <p className="text-gray-500 text-sm mt-0.5">Let's crush today's session</p>
      </div>

      {/* ── Training Mode Toggle ─────────────────────────────────────────────── */}
      <div className="px-5 mb-4">
        <div className="flex rounded-xl overflow-hidden border border-white/5 bg-[#13131a]">
          {TRAINING_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setTrainingMode(mode)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                trainingMode === mode
                  ? "bg-red-600 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ── Environment Pills ────────────────────────────────────────────────── */}
      <div className="px-5 mb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env}
              onClick={() => setActiveEnv(env)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeEnv === env
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* ── Muscle Group Pills ───────────────────────────────────────────────── */}
      <div className="px-5 mb-5">
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

      {/* ── Today's Summary ──────────────────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <div className="rounded-xl bg-[#13131a] border border-white/5 p-4">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">
            Today's Summary
          </p>
          <div className="grid grid-cols-3 divide-x divide-white/5">

            <div className="flex flex-col items-center gap-1 pr-4">
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4" />
              </svg>
              <span className="text-2xl font-bold text-white">{workouts.length}</span>
              <span className="text-gray-500 text-xs">Workouts</span>
            </div>

            <div className="flex flex-col items-center gap-1 px-4">
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
              <span className="text-2xl font-bold text-white">{totalCalories}</span>
              <span className="text-gray-500 text-xs">Calories</span>
            </div>

            <div className="flex flex-col items-center gap-1 pl-4">
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-2xl font-bold text-white">{totalMinutes}</span>
              <span className="text-gray-500 text-xs">Minutes</span>
            </div>

          </div>
        </div>
      </div>

      {/* ── Today's Workouts ─────────────────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-red-600" />
            <span className="text-white font-bold text-sm tracking-wide uppercase">
              Today's Workouts
            </span>
          </div>
          <button
            onClick={() => setLocation("/workout")}
            className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        {workoutQuery.isLoading ? (
          <div className="text-gray-600 text-sm py-4 text-center">Loading...</div>
        ) : filteredWorkouts.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-white/10 py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-red-600/30 transition-colors"
            onClick={() => setLocation("/workout")}
          >
            <Plus className="w-6 h-6 text-gray-600" />
            <p className="text-gray-600 text-sm">Tap + to log your first exercise</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWorkouts.map((log) => {
              const group = guessMuscleGroup(log.name);
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-xl bg-[#13131a] border border-white/5 border-l-[3px] border-l-red-600 px-4 py-3"
                >
                  <MuscleThumbnail group={group} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{log.name}</p>
                    <p className="text-white font-bold text-base">
                      {log.sets} sets · {log.reps} reps · {log.weightLbs} lbs
                    </p>
                    {log.notes ? (
                      <p className="text-gray-500 text-xs truncate">{log.notes}</p>
                    ) : (
                      <p className="text-gray-600 text-xs">Last session</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                    {group}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Today's Meals ────────────────────────────────────────────────────── */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-blue-500" />
            <span className="text-white font-bold text-sm tracking-wide uppercase">
              Today's Meals
            </span>
          </div>
          <button
            onClick={() => setLocation("/photos")}
            className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>

        {photoQuery.isLoading ? (
          <div className="text-gray-600 text-sm py-4 text-center">Loading...</div>
        ) : meals.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-white/10 py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-600/30 transition-colors"
            onClick={() => setLocation("/photos")}
          >
            <Camera className="w-6 h-6 text-gray-600" />
            <p className="text-gray-600 text-sm">Tap 📷 to log your first meal</p>
          </div>
        ) : (
          <div className="space-y-2">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center gap-3 rounded-xl bg-[#13131a] border border-white/5 px-4 py-3"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl shrink-0">
                  {foodEmoji(meal.foodDescription)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {meal.foodDescription}
                  </p>
                  <p className="text-red-400 font-bold text-sm">{meal.calories} cal</p>
                  <p className="text-gray-500 text-xs">
                    P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
