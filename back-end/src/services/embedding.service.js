import { embeddingClient } from "../config/openai.js";

export async function generateEmbedding(text) {
  if (!embeddingClient) {
    throw new Error("Embedding client not initialized");
  }

  const response = await embeddingClient.embeddings.create({
    model: process.env.AZURE_EMBEDDING_DEPLOYMENT, // must match deployment name
    input: text
  });

  return response.data[0].embedding;
}
