import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, X, Zap, ArrowLeft, Loader2 } from "lucide-react";

const FREE_FEATURES = [
  "Log unlimited workouts",
  "AI workout generator",
  "Exercise library (100+ exercises)",
  "Basic meal tracking (3 photos/day)",
  "7-day history",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Unlimited meal photo analysis",
  "Advanced nutrition analytics",
  "Full workout history",
  "Priority AI responses",
  "Early access to new features",
];

export default function Paywall() {
  const [, setLocation] = useLocation();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation();

  const handleSubscribe = async (priceId: string) => {
    setLoadingPriceId(priceId);
    checkoutMutation.mutate(
      { priceId },
      {
        onSuccess: (data) => {
          window.location.href = data.url;
        },
        onError: (err) => {
          toast.error(err.message || "Failed to start checkout");
          setLoadingPriceId(null);
        },
      }
    );
  };

  const premiumPriceId = import.meta.env.VITE_STRIPE_PRICE_PREMIUM as string;
  const trialExtPriceId = import.meta.env.VITE_STRIPE_PRICE_TRIAL_EXT as string;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-10">

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-6">
        <button
          onClick={() => setLocation("/dashboard")}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Upgrade to Premium</h1>
      </header>

      <div className="px-5 space-y-5">

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-500/20 p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">I-TRAK Premium</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Unlock unlimited AI-powered meal tracking and advanced analytics to hit your goals faster.
          </p>
          <div className="mt-4">
            <span className="text-4xl font-black text-white">$9.99</span>
            <span className="text-gray-400 text-sm ml-1">CAD / month</span>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="grid grid-cols-2 gap-3">

          {/* Free */}
          <div className="rounded-2xl bg-[#13131a] border border-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Free</p>
            <div className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                  <span className="text-gray-400 text-xs leading-snug">{f}</span>
                </div>
              ))}
              <div className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-red-500/50 mt-0.5 shrink-0" />
                <span className="text-gray-600 text-xs leading-snug">Unlimited photos</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-red-500/50 mt-0.5 shrink-0" />
                <span className="text-gray-600 text-xs leading-snug">Full history</span>
              </div>
            </div>
          </div>

          {/* Premium */}
          <div className="rounded-2xl bg-gradient-to-b from-red-600/10 to-transparent border border-red-500/30 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4">Premium</p>
            <div className="space-y-3">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-white text-xs leading-snug">{f}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Subscribe button */}
        <button
          onClick={() => handleSubscribe(premiumPriceId)}
          disabled={loadingPriceId !== null}
          className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold text-base tracking-wide flex items-center justify-center gap-2 hover:bg-red-700 active:bg-red-800 transition-colors shadow-lg shadow-red-600/30 disabled:opacity-60 disabled:pointer-events-none"
        >
          {loadingPriceId === premiumPriceId ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          Subscribe — $9.99 CAD/mo
        </button>

        {/* Trial extension option */}
        <div className="rounded-2xl bg-[#13131a] border border-white/5 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white font-bold text-sm">Not ready to commit?</p>
            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-2 py-0.5 font-semibold">One-time</span>
          </div>
          <p className="text-gray-400 text-xs mb-4 leading-relaxed">
            Extend your trial by 2 extra weeks for a one-time payment of $3.69 CAD.
          </p>
          <button
            onClick={() => handleSubscribe(trialExtPriceId)}
            disabled={loadingPriceId !== null}
            className="w-full py-3 rounded-xl border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-60 disabled:pointer-events-none"
          >
            {loadingPriceId === trialExtPriceId ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Extend Trial — $3.69 CAD
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Cancel anytime · Secure payment via Stripe · Canadian pricing
        </p>

      </div>
    </div>
  );
}
