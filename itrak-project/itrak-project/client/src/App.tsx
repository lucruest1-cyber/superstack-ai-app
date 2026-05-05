import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Paywall from "@/pages/Paywall";
import Workout from "@/pages/Workout";
import Profile from "@/pages/Profile";
import Meals from "@/pages/Meals";
import Settings from "@/pages/Settings";
import PhotoTracker from "@/pages/PhotoTracker";
import WorkoutLogger from "@/pages/WorkoutLogger";
import ExerciseSelector from "@/pages/ExerciseSelector";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/workout" component={Workout} />
            <Route path="/exercises" component={Workout} />
            <Route path="/log" component={ExerciseSelector} />
            <Route path="/logger" component={WorkoutLogger} />
            <Route path="/meals" component={Meals} />
            <Route path="/photos" component={PhotoTracker} />
            <Route path="/settings" component={Settings} />
            <Route path="/paywall" component={Paywall} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
