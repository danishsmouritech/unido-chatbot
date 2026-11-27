import "dotenv/config";
import { Storage } from "@google-cloud/storage";

export const cloudStorage = new Storage({ projectId: process.env.GOOGLE_CLOUD_PROJECT });

export function assertCloudStorageConfig() {
  if (!process.env.GCS_BUCKET_NAME) throw new Error("GCS_BUCKET_NAME is required");
}

export function getBackupBucket() {
  const name = process.env.GCS_BUCKET_NAME;
  if (!name) throw new Error("GCS_BUCKET_NAME is required to upload backups to Cloud Storage");
  return cloudStorage.bucket(name);
}
