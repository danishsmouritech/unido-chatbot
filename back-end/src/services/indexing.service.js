import { esClient } from "../config/elasticsearch.js";
import { logger } from "./utils/logger.js";
export async function clearChunkIndex() {
  await esClient.deleteByQuery({
    index: "unido_careers_index",
    query: { match_all: {} },
    refresh: true,
    conflicts: "proceed"
  });
}

export async function bulkIndexChunks(chunks) {
  const operations = [];

  for (const chunk of chunks) {
    operations.push({
      index: {
        _index: "unido_careers_index",
        _id: chunk.id
      }
    });

    operations.push({
      id: chunk.id,
      content: chunk.content,
      embedding: chunk.embedding,
      metadata: chunk.metadata
    });
  }

  const response = await esClient.bulk({
    refresh: true,
    operations
  });

  if (response.errors) {
    logger.error("Bulk indexing had errors:", response.items);
  }
  logger.log("Bulk indexing completed");
}
