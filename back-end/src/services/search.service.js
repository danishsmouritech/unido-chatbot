import { esClient } from "../config/elasticsearch.js";

export async function searchRelevantChunks(queryEmbedding,TOP_K) {
  const response = await esClient.search({
    index: "unido_careers_index",
    size: TOP_K,
    query: {
      knn: {
        field: "embedding",
        query_vector: queryEmbedding,
        k: TOP_K,
        num_candidates: 50
      }
    }
  });

  return response.hits.hits.map((hit) => ({
    score: hit._score,
    ...hit._source
  }));
}
