import { initializeApp, getApps, cert } from "firebase-admin/app";

const apps = getApps();

if (apps.length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. " +
      "Provide the Firebase service account JSON as a string."
    );
  }

  let serviceAccount: object;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. " +
      "Ensure the entire service account JSON is stored as a single-line string."
    );
  }

  initializeApp({ credential: cert(serviceAccount as any) });
}

export { getApps };
