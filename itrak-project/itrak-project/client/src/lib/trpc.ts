import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "@server/routers";
import { auth } from "./firebase";

export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers: async () => {
        // Wait for Firebase to finish hydrating auth state from IndexedDB
        // before reading currentUser. Without this, the first queries on a
        // fresh page load fire while auth.currentUser is still null and
        // get sent without an Authorization header → 401.
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user) return {};
        const token = await user.getIdToken();
        return { Authorization: `Bearer ${token}` };
      },
    }),
  ],
});
