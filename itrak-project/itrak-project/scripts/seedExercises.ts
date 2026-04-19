import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set");
  initializeApp({ credential: cert(JSON.parse(key)) });
}

const db = getFirestore();

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  difficulty: string;
  environments: string[];
  formTips: string;
  commonMistakes: string;
}

async function seed() {
  const raw = readFileSync(resolve(__dirname, "exercises.json"), "utf-8");
  const { exercises }: { exercises: Exercise[] } = JSON.parse(raw);

  console.log(`Seeding ${exercises.length} exercises...`);

  const col = db.collection("exercises");
  const batch = db.batch();

  for (const ex of exercises) {
    const { id, ...data } = ex;
    batch.set(col.doc(id), data);
  }

  await batch.commit();
  console.log(`Batch write complete.`);

  const snapshot = await col.count().get();
  console.log(`exercises collection count: ${snapshot.data().count}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
