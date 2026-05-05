import Stripe from "stripe";
import * as db from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  console.log("[webhook] received event type:", event.type);

  switch (event.type) {
    case "customer.created": {
      const customer = event.data.object as Stripe.Customer;
      console.log("[webhook] customer.created:", customer.id, "email:", customer.email);

      if (customer.email) {
        const user = await db.getUserByEmail(customer.email);
        if (user) {
          await db.updateUserStripeCustomerId(user.id, customer.id);
          console.log("[webhook] saved stripeCustomerId for user:", user.id);
        }
      }
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[webhook] checkout.session.completed:", session.id, "customerId:", session.customer);

      if (typeof session.customer === "string") {
        const customer = await stripe.customers.retrieve(session.customer) as Stripe.Customer;
        if (customer.email) {
          const user = await db.getUserByEmail(customer.email);
          if (user) {
            await db.updateUserStripeCustomerId(user.id, customer.id);
            console.log("[webhook] saved stripeCustomerId for user:", user.id);
          }
        }
      }
      break;
    }

    default:
      console.log("[webhook] unhandled event type:", event.type);
  }
}
