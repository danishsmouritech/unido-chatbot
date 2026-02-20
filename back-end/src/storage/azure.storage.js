import { blobServiceClient } from "../config/azureBlob.js";

const containerName = process.env.AZURE_STORAGE_CONTAINER;
const RETENTION_DAYS = 7;

export async function uploadJSONToAzure(data, fileName) {
  const containerClient =
    blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists();

  const blockBlobClient =
    containerClient.getBlockBlobClient(fileName);

  const buffer = Buffer.from(JSON.stringify(data, null, 2));

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: "application/json"
    }
  });

  console.log(`Uploaded to Azure: ${fileName}`);
}
export async function deleteOldBlobs() {
  const containerClient =
    blobServiceClient.getContainerClient(containerName);

  const now = new Date();
  const threshold = new Date(
    now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  for await (const blob of containerClient.listBlobsFlat()) {
    if (blob.properties.lastModified < threshold) {
      await containerClient.deleteBlob(blob.name);
      console.log(`Deleted old blob: ${blob.name}`);
    }
  }
}
