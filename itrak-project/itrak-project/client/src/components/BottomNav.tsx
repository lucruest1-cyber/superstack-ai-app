import { useLocation } from "wouter";
import { Home, Dumbbell, Camera, Settings } from "lucide-react";

const TABS = [
  { path: "/dashboard", icon: Home,     label: "Home"    },
  { path: "/log",       icon: Dumbbell, label: "Workout" },
  { path: "/meals",     icon: Camera,   label: "Meals"   },
  { path: "/settings",  icon: Settings, label: "Profile" },
] as const;

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#0d0d14]/95 backdrop-blur-md border-t border-white/8 flex items-stretch">
      {TABS.map(({ path, icon: Icon, label }) => {
        const isMeals = path === "/meals";
        const active   =
          location === path ||
          (path === "/log" && (location.startsWith("/log") || location.startsWith("/workout")));
        const activeColor = isMeals ? "text-blue-400" : "text-red-400";

        return (
          <button
            key={path}
            onClick={() => setLocation(path)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              active ? activeColor : "text-gray-600 hover:text-gray-400"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
