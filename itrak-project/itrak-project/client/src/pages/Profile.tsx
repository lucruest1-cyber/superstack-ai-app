import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { ChevronLeft } from "lucide-react";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-5">
      <div className="flex items-center gap-3 mb-8 pt-10">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-extrabold">Profile</h1>
      </div>

      <div className="rounded-2xl bg-[#13131a] border border-white/5 p-5">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
          {((user?.name ?? user?.email ?? "U").split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase())}
        </div>
        <p className="text-white font-bold text-lg">{user?.name ?? "Athlete"}</p>
        <p className="text-gray-400 text-sm">{user?.email ?? ""}</p>
      </div>
    </div>
  );
}
