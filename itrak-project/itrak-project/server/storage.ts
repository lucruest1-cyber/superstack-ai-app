import { getStorage } from "firebase-admin/storage";

const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET;

function bucket() {
  if (!FIREBASE_STORAGE_BUCKET) {
    throw new Error(
      "FIREBASE_STORAGE_BUCKET environment variable is not set. " +
      "Set it to your Firebase Storage bucket name (e.g. your-project.appspot.com)."
    );
  }
  return getStorage().bucket(FIREBASE_STORAGE_BUCKET);
}

/**
 * Upload a file to Firebase Storage and return the public download URL.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const file = bucket().file(relKey);

  try {
    await file.save(buffer, {
      contentType,
      metadata: { contentType },
    });
    await file.makePublic();
    const url = file.publicUrl();
    return { key: relKey, url };
  } catch (error) {
    console.error("[Storage] Failed to upload file:", error);
    throw error;
  }
}

/**
 * Get a signed download URL for a file in Firebase Storage.
 */
export async function storageGet(
  relKey: string,
  expiresIn: number = 3600
): Promise<{ key: string; url: string }> {
  const file = bucket().file(relKey);
  const expiresAt = Date.now() + expiresIn * 1000;

  try {
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: expiresAt,
    });
    return { key: relKey, url };
  } catch (error) {
    console.error("[Storage] Failed to generate signed URL:", error);
    throw error;
  }
}
