import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <button
          onClick={() => setLocation("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
