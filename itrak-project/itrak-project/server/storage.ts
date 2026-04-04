import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "itrak-storage";

/**
 * Upload file to S3 and return the public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: relKey,
    Body: buffer,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${relKey}`;
    return { key: relKey, url };
  } catch (error) {
    console.error("[Storage] Failed to upload file:", error);
    throw error;
  }
}

/**
 * Get a presigned URL for downloading a file from S3
 */
export async function storageGet(
  relKey: string,
  expiresIn: number = 3600
): Promise<{ key: string; url: string }> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: relKey,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { key: relKey, url };
  } catch (error) {
    console.error("[Storage] Failed to generate presigned URL:", error);
    throw error;
  }
}
