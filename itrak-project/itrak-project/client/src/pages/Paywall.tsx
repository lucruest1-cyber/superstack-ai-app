import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const Paywall = () => {
  const [, navigate] = useLocation();
  const createCheckout = trpc.stripe.createCheckoutSession.useMutation();

  const handleSubscribe = async () => {
    try {
      const { checkoutUrl } = await createCheckout.mutateAsync({
        priceId: import.meta.env.VITE_STRIPE_PRICE_PREMIUM,
      });
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      toast.error("Failed to start checkout.");
    }
  };

  const handleExtendTrial = async () => {
    try {
      const { checkoutUrl } = await createCheckout.mutateAsync({
        priceId: import.meta.env.VITE_STRIPE_PRICE_TRIAL_EXT,
      });
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      toast.error("Failed to start checkout.");
    }
  };

  const freeFeatures = [
    "5 workouts per month",
    "Basic exercise library",
    "No meal logging",
    "Limited support",
  ];

  const premiumFeatures = [
    "Unlimited workouts",
    "100+ exercise library",
    "AI meal photo analysis",
    "Macro tracking",
    "Priority support",
    "Export data",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm font-medium text-slate-400 hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-white">I-TRAK Premium</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Upgrade to Premium
        </h2>
        <p className="text-lg text-slate-300 mb-2">
          Unlock unlimited workouts and AI-powered meal tracking
        </p>
        <p className="text-sm text-slate-400">
          No-frills Canadian fitness tracking, supercharged
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-slate-700 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">Free</CardTitle>
              <p className="text-sm text-slate-400 mt-2">Get started tracking</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-3xl font-bold text-white">$0</p>
                <p className="text-sm text-slate-400">forever</p>
              </div>

              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="w-full border-slate-700 text-white hover:bg-slate-800"
              >
                Current Plan
              </Button>

              <div className="space-y-3">
                {freeFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/50 bg-slate-900 ring-1 ring-red-500/30 relative md:transform md:scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
              RECOMMENDED
            </div>
            <CardHeader>
              <CardTitle className="text-white">Premium</CardTitle>
              <p className="text-sm text-slate-400 mt-2">Full power unlocked</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-3xl font-bold text-white">$9.99</p>
                <p className="text-sm text-slate-400">/month CAD</p>
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={createCheckout.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {createCheckout.isPending ? "Loading..." : "Subscribe Now"}
              </Button>

              <div className="space-y-3">
                {premiumFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-600/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="w-3 h-3 text-red-400" />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-3">
                  Or extend your trial for 2 more weeks
                </p>
                <Button
                  onClick={handleExtendTrial}
                  disabled={createCheckout.isPending}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  {createCheckout.isPending ? "Loading..." : "Extend Trial – $3.69"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-t border-slate-800 py-8 text-center">
        <p className="text-xs text-slate-500">
          By subscribing, you agree to our terms. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default Paywall;
