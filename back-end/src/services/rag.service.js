import { generateEmbedding } from "./embedding.service.js";
import { retrieveRelevantChunks } from "./retrieval.service.js";
import { generateAnswer } from "./generation.service.js";

export async function runRAG(question, history) {
  const embedding = await generateEmbedding(question);

  const { retrievedChunks, relevantChunks } =
    await retrieveRelevantChunks(embedding);

  if (!relevantChunks.length) {
    return {
      answer: "I do not have enough information in the provided content.",
      sources: []
    };
  }

  const answer = await generateAnswer(
    question,
    history,
    relevantChunks
  );

  return {
    answer,
    sources: relevantChunks
  };
}
