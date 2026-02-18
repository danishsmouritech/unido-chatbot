import { searchRelevantChunks } from "./search.service.js";

const MIN_RELEVANCE_SCORE = Number(process.env.RAG_MIN_SCORE || 0.75);
const TOP_K = Number(process.env.RAG_TOP_K || 5);

export async function retrieveRelevantChunks(embedding) {
  const retrievedChunks = await searchRelevantChunks(embedding, TOP_K);

  const relevantChunks = retrievedChunks.filter(
    chunk => (chunk.score || 0) >= MIN_RELEVANCE_SCORE
  );

  return {
    retrievedChunks,
    relevantChunks
  };
}
