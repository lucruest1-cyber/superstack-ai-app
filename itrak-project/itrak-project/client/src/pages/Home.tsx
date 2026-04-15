import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { user, loading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) setLocation("/dashboard");
  }, [user, loading, setLocation]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f]">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Ready to train pill badge */}
        <span className="flex items-center gap-2 bg-red-600/20 text-red-500 text-xs font-semibold px-4 py-1.5 rounded-full border border-red-600/30 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Ready to train
        </span>

        {/* Title + tagline */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">I-TRAK</h1>
          <p className="text-gray-400 mt-2 text-sm">No-frills Canadian fitness tracking</p>
        </div>

        {/* Quick Stats card */}
        <div className="w-full rounded-xl p-5 bg-[#13131a] border border-white/5">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">
            Quick Stats
          </p>
          <div className="grid grid-cols-3 divide-x divide-white/5">

            <div className="flex flex-col items-center gap-1 pr-4">
              {/* Dumbbell icon */}
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4" />
              </svg>
              <span className="text-2xl font-bold text-white">0</span>
              <span className="text-gray-500 text-xs">Workouts</span>
            </div>

            <div className="flex flex-col items-center gap-1 px-4">
              {/* Flame icon */}
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
              <span className="text-2xl font-bold text-white">0</span>
              <span className="text-gray-500 text-xs">Calories</span>
            </div>

            <div className="flex flex-col items-center gap-1 pl-4">
              {/* Clock icon */}
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-2xl font-bold text-white">0</span>
              <span className="text-gray-500 text-xs">Minutes</span>
            </div>

          </div>
        </div>

        {/* Google Sign-In button — dark bg, red left border */}
        <button
          onClick={login}
          disabled={loading}
          className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl bg-[#13131a] border border-white/5 border-l-[3px] border-l-red-600 text-white font-medium hover:bg-[#1a1a24] transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{loading ? "Loading..." : "Sign in with Google"}</span>
        </button>

        {/* Feature tagline */}
        <p className="text-white/50 text-xs text-center">
          Track workouts&nbsp;&bull;&nbsp;Log meals&nbsp;&bull;&nbsp;Monitor progress
        </p>

        {/* Proudly Canadian */}
        <div className="flex items-center gap-2">
          {/* Maple leaf SVG */}
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 100 120" fill="currentColor">
            <path d="M50,5 L55,20 L65,15 L60,28 L75,25 L65,38 L80,42 L65,48 L70,65 L55,58 L55,95 L45,95 L45,58 L30,65 L35,48 L20,42 L35,38 L25,25 L40,28 L35,15 L45,20 Z" />
          </svg>
          <span className="text-gray-500 text-xs">Proudly Canadian</span>
        </div>

      </div>
    </div>
  );
}
