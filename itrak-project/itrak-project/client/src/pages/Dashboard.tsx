import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Dumbbell, Camera, Settings, LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const workoutQuery = trpc.workouts.getToday.useQuery();
  const photoQuery = trpc.photoTracker.getToday.useQuery();
  const summaryQuery = trpc.photoTracker.getDailySummary.useQuery({
    date: new Date().toISOString().split("T")[0],
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">I-TRAK</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
            <Button variant="ghost" size="icon" onClick={() => setLocation("/settings")}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Today's Workouts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {workoutQuery.data?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">exercises logged</p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => setLocation("/workout")}
                  >
                    Log Workout
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Today's Meals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {photoQuery.data?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">photos logged</p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => setLocation("/photos")}
                  >
                    Log Meal
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Nutrition Summary */}
            {summaryQuery.data && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Nutrition Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {summaryQuery.data.totalCalories}
                      </p>
                      <p className="text-xs text-muted-foreground">Calories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(parseFloat(summaryQuery.data.totalProtein))}g
                      </p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(parseFloat(summaryQuery.data.totalCarbs))}g
                      </p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(parseFloat(summaryQuery.data.totalFat))}g
                      </p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts">
            <Card>
              <CardHeader>
                <CardTitle>Today's Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                {workoutQuery.isLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : workoutQuery.data && workoutQuery.data.length > 0 ? (
                  <div className="space-y-2">
                    {workoutQuery.data.map((log) => (
                      <div key={log.id} className="p-3 border border-border rounded-lg">
                        <p className="font-semibold text-foreground">{log.exerciseName}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.sets} sets × {log.reps} reps @ {log.weight} lbs
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No workouts logged yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <Card>
              <CardHeader>
                <CardTitle>Today's Meals</CardTitle>
              </CardHeader>
              <CardContent>
                {photoQuery.isLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : photoQuery.data && photoQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {photoQuery.data.map((log) => (
                      <div key={log.id} className="p-3 border border-border rounded-lg">
                        <p className="font-semibold text-foreground">{log.foodDescription}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.calories} cal | P: {log.protein}g | C: {log.carbs}g | F: {log.fat}g
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No meals logged yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
