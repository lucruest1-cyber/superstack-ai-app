import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Search } from "lucide-react";

const ENVIRONMENTS = ["gym", "home", "hotel", "outside"] as const;
type Env = (typeof ENVIRONMENTS)[number];

export default function ExerciseLibrary() {
  const [, setLocation] = useLocation();
  const [env, setEnv] = useState<Env>("gym");
  const [search, setSearch] = useState("");

  const { data: exercises, isLoading } = trpc.exercises.listByEnvironment.useQuery(
    { environment: env }
  );

  const filtered = exercises?.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/dashboard")} className="p-2 hover:bg-muted rounded-md">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Exercise Library</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4 max-w-2xl">
        {/* Environment filter */}
        <div className="flex gap-2 flex-wrap">
          {ENVIRONMENTS.map((e) => (
            <button
              key={e}
              onClick={() => setEnv(e)}
              className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                env === e
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-input rounded-md bg-background text-sm"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((ex) => (
              <div key={ex.id} className="p-4 border border-border rounded-lg bg-card">
                <p className="font-semibold text-foreground">{ex.name}</p>
                {ex.description && (
                  <p className="text-sm text-muted-foreground mt-1">{ex.description}</p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">
                    {ex.difficulty}
                  </span>
                  {ex.muscleGroups?.map((mg) => (
                    <span key={mg} className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">
                      {mg}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No exercises found.</p>
        )}
      </main>
    </div>
  );
}
