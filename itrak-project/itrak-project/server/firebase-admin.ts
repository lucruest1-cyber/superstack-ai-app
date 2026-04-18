import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local"), override: true });

import { initializeApp, getApps, cert } from "firebase-admin/app";

const apps = getApps();

if (apps.length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.error(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not set — Firebase will not be initialized. " +
      "All database calls will fail until this variable is provided."
    );
  } else {
    let serviceAccount: object | null = null;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch {
      console.error(
        "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON — Firebase will not be initialized."
      );
    }
    if (serviceAccount) {
      initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
    }
  }
}

export { getApps };
