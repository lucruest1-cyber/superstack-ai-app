import { router, protectedProcedure } from "../_core/trpc";
import Stripe from "stripe";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({ priceId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured" });
      }

      const stripe = new Stripe(secretKey, { apiVersion: "2025-04-30.basil" });

      const price = await stripe.prices.retrieve(input.priceId);
      const mode = price.recurring ? "subscription" : "payment";

      const baseUrl = process.env.VITE_APP_URL || "https://superstack-ai-app.vercel.app";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: input.priceId, quantity: 1 }],
        mode,
        customer_email: ctx.user.email ?? undefined,
        metadata: { userId: ctx.user.id },
        success_url: `${baseUrl}/dashboard?upgraded=true`,
        cancel_url: `${baseUrl}/paywall`,
      });

      if (!session.url) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No checkout URL returned" });
      }

      return { url: session.url, checkoutUrl: session.url };
    }),
});
