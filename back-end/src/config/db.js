import "dotenv/config";
import { Firestore } from "@google-cloud/firestore";
import { logger } from "../utils/logger.js";

export const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  databaseId: process.env.FIRESTORE_DATABASE_ID || "unido-rag",
  ignoreUndefinedProperties: true
});

export async function connectDB() {
  // Firestore uses Application Default Credentials (Cloud Run service account
  // in production, `gcloud auth application-default login` locally).
  await firestore.collection("_health").doc("firestore").get();
  logger.log("Firestore connected");
}

export async function assertFirestoreConnection() {
  await firestore.collection("_health").doc("firestore").get();
}
