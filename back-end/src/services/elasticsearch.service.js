import { esClient } from "../config/elasticsearch.js";

export async function ensureChunkIndex() {
  const indexExists = await esClient.indices.exists({
    index: "unido_careers_index"
  });

  if (indexExists) {
    console.log("Elasticsearch index already exists");
    return;
  }

  await esClient.indices.create({
    index: "unido_careers_index",
    mappings: {
      properties: {
        id: { type: "keyword" },
        content: { type: "text" },
        embedding: {
          type: "dense_vector",
          dims: 1536,
          index: true,
          similarity: "cosine"
        },
        metadata: {
          properties: {
            doc_type: { type: "keyword" },
            page: { type: "keyword" },
            url: { type: "keyword" },
            category: { type: "keyword" },
            requisitionId: { type: "keyword" }
          }
        }
      }
    }
  });
  console.log("Elasticsearch index created");
}
