import { EMBEDDING_MODEL, getVertexAIClient } from "../config/vertexAi.js";

export async function generateEmbedding(text, taskType = "RETRIEVAL_QUERY") {
  const response = await getVertexAIClient().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { taskType }
  });
  const embedding = response.embeddings?.[0]?.values;
  if (!embedding?.length) throw new Error("Vertex AI returned no text embedding");
  return embedding;
}
