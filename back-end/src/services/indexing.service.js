import { esClient } from "../config/elasticsearch.js";

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
    console.error("Bulk indexing had errors:", response.items);
  }
  console.log("Bulk indexing completed");
}
