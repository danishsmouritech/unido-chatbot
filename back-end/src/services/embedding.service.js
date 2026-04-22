import { getEmbeddingClient } from "../config/openai.js";

export async function generateEmbedding(text) {
  const embeddingClient = getEmbeddingClient();

  if (!embeddingClient) {
    throw new Error("Embedding client not initialized");
  }

  const response = await embeddingClient.embeddings.create({
    model: process.env.AZURE_EMBEDDING_DEPLOYMENT,
    input: text
  });

  return response.data[0].embedding;
}
