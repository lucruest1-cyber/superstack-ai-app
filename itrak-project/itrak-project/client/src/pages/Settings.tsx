import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [unitPref, setUnitPref] = useState("lbs");
  const [envPref, setEnvPref] = useState("gym");
  const [genderPref, setGenderPref] = useState("neutral");

  const preferencesQuery = trpc.user.getPreferences.useQuery();
  const updateMutation = trpc.user.updatePreferences.useMutation();

  useEffect(() => {
    if (preferencesQuery.data) {
      setUnitPref(preferencesQuery.data.unitPreference);
      setEnvPref(preferencesQuery.data.environmentPreference);
      setGenderPref(preferencesQuery.data.genderDemoPreference);
    }
  }, [preferencesQuery.data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        unitPreference: unitPref as "lbs" | "kg",
        environmentPreference: envPref as "gym" | "home" | "hotel" | "outside",
        genderDemoPreference: genderPref as "male" | "female" | "neutral",
      });
      toast.success("Settings saved!");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-md space-y-4">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold text-foreground">{user?.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold text-foreground">{user?.email || "Not set"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Unit Preference */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Weight Unit</label>
              <Select value={unitPref} onValueChange={setUnitPref}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Environment Preference */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Default Environment</label>
              <Select value={envPref} onValueChange={setEnvPref}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gym">Gym</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="outside">Outside</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gender Demo Preference */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Exercise Demo Figure</label>
              <Select value={genderPref} onValueChange={setGenderPref}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

        {/* Logout Card */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
