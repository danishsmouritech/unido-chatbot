import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("Azure Storage connection string missing");
}

export const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
