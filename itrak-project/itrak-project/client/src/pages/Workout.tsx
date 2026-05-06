import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import WorkoutGenerator from "@/components/WorkoutGenerator";

/**
 * /workout and /exercises routes — thin wrapper around the WorkoutGenerator
 * component used by the Dashboard. Provides reasonable defaults so the page
 * works as a direct entry point (e.g. shareable URL or bottom-nav target),
 * and routes back to /dashboard on close or after logging.
 */
export default function Workout() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  return (
    <WorkoutGenerator
      environment="gym"
      muscleGroup="All"
      trainingMode="Muscle"
      onClose={() => navigate("/dashboard")}
      onLogged={() => {
        // Refresh the dashboard's today list before navigating back
        void utils.workouts.getToday.invalidate();
        navigate("/dashboard");
      }}
    />
  );
}
